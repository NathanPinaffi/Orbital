import { Router } from "express";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireRole, type AuthedRequest } from "../lib/authMiddleware.js";
import { classroomForRequest } from "../lib/google.js";
import { distributeAssessment } from "../lib/distributeAssessment.js";
import { publishGradeForSubmission, publishGradesForAssessment } from "../lib/publishGrades.js";

export const assessmentsRouter = Router();
assessmentsRouter.use(requireAuth, requireRole("TEACHER", "ADMIN"));

const createSchema = z
  .object({
    title: z.string().min(1),
    durationMinutes: z.number().int().positive(),
    breakStartMinute: z.number().int().positive().optional(),
    breakDurationMinutes: z.number().int().positive().optional(),
    classIds: z.array(z.string()).min(1),
    questionIds: z.array(z.string()).min(1),
    dueAt: z.string().datetime().optional(),
  })
  .refine((data) => (data.breakStartMinute == null) === (data.breakDurationMinutes == null), {
    message: "Informe o início e a duração da pausa juntos",
    path: ["breakStartMinute"],
  })
  .refine((data) => data.breakStartMinute == null || data.durationMinutes > 60, {
    message: "A pausa só pode ser adicionada em avaliações com mais de 1 hora",
    path: ["breakStartMinute"],
  })
  .refine((data) => data.breakStartMinute == null || data.breakStartMinute < data.durationMinutes, {
    message: "A pausa deve começar antes do fim da avaliação",
    path: ["breakStartMinute"],
  });

/** Lista as avaliações criadas pelo professor autenticado, em qualquer turma sua. */
assessmentsRouter.get("/", async (req: AuthedRequest, res, next) => {
  try {
    const assessments = await prisma.assessment.findMany({
      where: { class: { teacherId: req.userId! } },
      include: { class: true, _count: { select: { questions: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json(
      assessments.map((a) => ({
        id: a.id,
        title: a.title,
        status: a.status,
        durationMinutes: a.durationMinutes,
        className: a.class.name,
        questionCount: a._count.questions,
        createdAt: a.createdAt,
        dueAt: a.dueAt,
      })),
    );
  } catch (err) {
    next(err);
  }
});

/**
 * Cria uma avaliação a partir de questões do banco e a distribui como atividade
 * no Google Sala de Aula de cada turma selecionada (uma Assessment por turma).
 */
assessmentsRouter.post("/", async (req: AuthedRequest, res, next) => {
  try {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    const { title, durationMinutes, breakStartMinute, breakDurationMinutes, classIds, questionIds, dueAt } = parsed.data;

    const classes = await prisma.classSection.findMany({
      where: { id: { in: classIds }, teacherId: req.userId! },
    });
    if (classes.length !== classIds.length) {
      return res.status(404).json({ error: "Uma ou mais turmas não foram encontradas" });
    }

    const questions = await prisma.question.findMany({
      where: { id: { in: questionIds }, bank: { OR: [{ ownerId: req.userId! }, { visibility: "PUBLIC" }] } },
    });
    if (questions.length !== questionIds.length) {
      return res.status(404).json({ error: "Uma ou mais questões não foram encontradas" });
    }

    const { classroom } = await classroomForRequest(req);

    const created = [];
    for (const classSection of classes) {
      const assessment = await prisma.assessment.create({
        data: {
          title,
          durationMinutes,
          breakStartMinute,
          breakDurationMinutes,
          classId: classSection.id,
          dueAt: dueAt ? new Date(dueAt) : undefined,
          questions: {
            create: questionIds.map((questionId, index) => ({
              questionId,
              order: index + 1,
            })),
          },
        },
        include: { class: true },
      });

      const distribution = await distributeAssessment(classroom, assessment);
      created.push({ id: assessment.id, className: classSection.name, ...distribution });
    }

    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

/** Carrega a avaliação garantindo que pertence a uma turma do professor autenticado. */
async function loadOwnedAssessment(assessmentId: string, teacherId: string) {
  const assessment = await prisma.assessment.findUnique({
    where: { id: assessmentId },
    include: { class: true },
  });
  if (!assessment || assessment.class.teacherId !== teacherId) {
    const err = new Error("Avaliação não encontrada");
    (err as { status?: number }).status = 404;
    throw err;
  }
  return assessment;
}

/** Lista as entregas da avaliação (matriculados sem entrega aparecem como not_started). */
assessmentsRouter.get("/:assessmentId/submissions", async (req: AuthedRequest, res, next) => {
  try {
    const assessment = await loadOwnedAssessment(req.params.assessmentId, req.userId!);

    const [enrollments, submissions] = await Promise.all([
      prisma.enrollment.findMany({ where: { classId: assessment.classId }, include: { student: true } }),
      prisma.submission.findMany({
        where: { assessmentId: assessment.id },
        include: { answers: { include: { question: true } } },
      }),
    ]);

    const submissionByStudentId = new Map(submissions.map((s) => [s.studentId, s]));

    const rows = enrollments.map(({ student }) => {
      const submission = submissionByStudentId.get(student.id);
      if (!submission) {
        return {
          submissionId: null,
          studentId: student.id,
          studentName: student.name,
          avatarUrl: student.avatarUrl,
          status: "not_started" as const,
          submittedAt: null,
          score: null,
          hasUngraded: false,
          gradePublishedAt: null,
        };
      }
      const hasUngraded = submission.answers.some((a) => a.question.type === "ESSAY" && !a.gradedAt);
      return {
        submissionId: submission.id,
        studentId: student.id,
        studentName: student.name,
        avatarUrl: student.avatarUrl,
        status: submission.submittedAt ? ("submitted" as const) : ("in_progress" as const),
        submittedAt: submission.submittedAt,
        score: submission.score,
        hasUngraded,
        gradePublishedAt: submission.gradePublishedAt,
      };
    });

    res.json({
      assessment: { id: assessment.id, title: assessment.title, status: assessment.status, googleCourseWorkId: assessment.googleCourseWorkId },
      submissions: rows,
    });
  } catch (err) {
    next(err);
  }
});

/** Carrega os dados de uma entrega para o professor visualizar/corrigir. */
async function loadOwnedSubmission(assessmentId: string, submissionId: string, teacherId: string) {
  const assessment = await loadOwnedAssessment(assessmentId, teacherId);
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: { student: true, answers: true },
  });
  if (!submission || submission.assessmentId !== assessment.id) {
    const err = new Error("Entrega não encontrada");
    (err as { status?: number }).status = 404;
    throw err;
  }
  return { assessment, submission };
}

/** Detalhe de uma entrega: questões na ordem, resposta do aluno e estado de correção. */
assessmentsRouter.get("/:assessmentId/submissions/:submissionId", async (req: AuthedRequest, res, next) => {
  try {
    const { assessment, submission } = await loadOwnedSubmission(
      req.params.assessmentId,
      req.params.submissionId,
      req.userId!,
    );

    const assessmentQuestions = await prisma.assessmentQuestion.findMany({
      where: { assessmentId: assessment.id },
      include: { question: { include: { alternatives: true } } },
      orderBy: { order: "asc" },
    });

    const answerByQuestionId = new Map(submission.answers.map((a) => [a.questionId, a]));

    const questions = assessmentQuestions.map((aq) => {
      const answer = answerByQuestionId.get(aq.questionId);
      return {
        questionId: aq.question.id,
        content: aq.question.content,
        type: aq.question.type,
        maxPoints: aq.points,
        alternatives: aq.question.alternatives.map((alt) => ({ id: alt.id, content: alt.content, isCorrect: alt.isCorrect })),
        requiresSketch: aq.question.requiresSketch,
        graph:
          aq.question.graphExpression != null
            ? {
                expression: aq.question.graphExpression,
                xMin: aq.question.graphXMin!,
                xMax: aq.question.graphXMax!,
                yMin: aq.question.graphYMin!,
                yMax: aq.question.graphYMax!,
              }
            : null,
        answer: answer
          ? {
              id: answer.id,
              response: answer.response,
              sketchData: answer.sketchData ? JSON.parse(answer.sketchData) : null,
              isCorrect: answer.isCorrect,
              points: answer.points,
              teacherComment: answer.teacherComment,
              gradedAt: answer.gradedAt,
            }
          : null,
      };
    });

    res.json({
      submission: {
        id: submission.id,
        studentId: submission.studentId,
        studentName: submission.student.name,
        avatarUrl: submission.student.avatarUrl,
        submittedAt: submission.submittedAt,
        score: submission.score,
        gradePublishedAt: submission.gradePublishedAt,
      },
      questions,
    });
  } catch (err) {
    next(err);
  }
});

const gradeAnswerSchema = z.object({
  points: z.number().min(0),
  teacherComment: z.string().optional(),
});

/** Recalcula a nota da submission a partir das respostas já pontuadas (objetivas + dissertativas corrigidas). */
async function recomputeSubmissionScore(tx: Prisma.TransactionClient, assessmentId: string, submissionId: string) {
  const [assessmentQuestions, answers] = await Promise.all([
    tx.assessmentQuestion.findMany({ where: { assessmentId } }),
    tx.answer.findMany({ where: { submissionId } }),
  ]);

  const maxPointsByQuestionId = new Map(assessmentQuestions.map((aq) => [aq.questionId, aq.points]));

  let earned = 0;
  let total = 0;
  for (const answer of answers) {
    const maxPoints = maxPointsByQuestionId.get(answer.questionId) ?? 0;
    const isGraded = answer.isCorrect !== null || answer.gradedAt !== null;
    if (!isGraded) continue;
    total += maxPoints;
    earned += answer.points ?? 0;
  }

  const score = total > 0 ? (earned / total) * 10 : null;
  await tx.submission.update({ where: { id: submissionId }, data: { score } });
  return score;
}

/** Atribui pontos e comentário a uma questão dissertativa e recalcula a nota da entrega. */
assessmentsRouter.patch(
  "/:assessmentId/submissions/:submissionId/answers/:answerId",
  async (req: AuthedRequest, res, next) => {
    try {
      const parsed = gradeAnswerSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten() });
      }

      const { assessment, submission } = await loadOwnedSubmission(
        req.params.assessmentId,
        req.params.submissionId,
        req.userId!,
      );
      if (!submission.submittedAt) {
        return res.status(409).json({ error: "A prova ainda não foi entregue" });
      }

      const answer = await prisma.answer.findUnique({
        where: { id: req.params.answerId },
        include: { question: true },
      });
      if (!answer || answer.submissionId !== submission.id) {
        return res.status(404).json({ error: "Resposta não encontrada" });
      }
      if (answer.question.type !== "ESSAY") {
        return res.status(400).json({ error: "Apenas questões dissertativas podem ser corrigidas manualmente" });
      }

      const aq = await prisma.assessmentQuestion.findUnique({
        where: { assessmentId_questionId: { assessmentId: assessment.id, questionId: answer.questionId } },
      });
      const maxPoints = aq?.points ?? 0;
      if (parsed.data.points > maxPoints) {
        return res.status(400).json({ error: `A pontuação máxima desta questão é ${maxPoints}` });
      }

      const [updatedAnswer, score] = await prisma.$transaction(async (tx) => {
        const updated = await tx.answer.update({
          where: { id: answer.id },
          data: { points: parsed.data.points, teacherComment: parsed.data.teacherComment, gradedAt: new Date() },
        });
        const newScore = await recomputeSubmissionScore(tx, assessment.id, submission.id);
        return [updated, newScore];
      });

      res.json({ answer: updatedAnswer, submission: { id: submission.id, score } });
    } catch (err) {
      next(err);
    }
  },
);

/** Anula (exclui permanentemente) a entrega de um aluno específico. */
assessmentsRouter.post("/:assessmentId/submissions/:submissionId/void", async (req: AuthedRequest, res, next) => {
  try {
    const { submission } = await loadOwnedSubmission(req.params.assessmentId, req.params.submissionId, req.userId!);
    await prisma.submission.delete({ where: { id: submission.id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

/** Anula (exclui permanentemente) todas as entregas da avaliação. */
assessmentsRouter.post("/:assessmentId/void-all", async (req: AuthedRequest, res, next) => {
  try {
    const assessment = await loadOwnedAssessment(req.params.assessmentId, req.userId!);
    const { count } = await prisma.submission.deleteMany({ where: { assessmentId: assessment.id } });
    res.json({ deletedCount: count });
  } catch (err) {
    next(err);
  }
});

/** Exclui permanentemente a avaliação, suas entregas e a atividade correspondente no Google Sala de Aula. */
assessmentsRouter.delete("/:assessmentId", async (req: AuthedRequest, res, next) => {
  try {
    const assessment = await loadOwnedAssessment(req.params.assessmentId, req.userId!);

    if (assessment.googleCourseWorkId && assessment.class.googleClassroomId) {
      try {
        const { classroom } = await classroomForRequest(req);
        await classroom.courses.courseWork.delete({
          courseId: assessment.class.googleClassroomId,
          id: assessment.googleCourseWorkId,
        });
      } catch {
        // Segue com a exclusão local mesmo se a atividade já tiver sido removida do Classroom ou o acesso tiver expirado.
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.notification.updateMany({ where: { assessmentId: assessment.id }, data: { assessmentId: null } });
      await tx.submission.deleteMany({ where: { assessmentId: assessment.id } });
      await tx.assessment.delete({ where: { id: assessment.id } });
    });

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

/** Publica a nota de um aluno específico no Google Sala de Aula. */
assessmentsRouter.post(
  "/:assessmentId/submissions/:submissionId/publish-grade",
  async (req: AuthedRequest, res, next) => {
    try {
      const { assessment, submission } = await loadOwnedSubmission(
        req.params.assessmentId,
        req.params.submissionId,
        req.userId!,
      );
      const { classroom } = await classroomForRequest(req);
      const updated = await publishGradeForSubmission(classroom, assessment, submission);
      res.json({ publishedAt: updated.gradePublishedAt });
    } catch (err) {
      next(err);
    }
  },
);

/** Publica a nota de todos os alunos já corrigidos da avaliação no Google Sala de Aula. */
assessmentsRouter.post("/:assessmentId/publish-grades", async (req: AuthedRequest, res, next) => {
  try {
    const assessment = await loadOwnedAssessment(req.params.assessmentId, req.userId!);
    const submissions = await prisma.submission.findMany({
      where: { assessmentId: assessment.id, submittedAt: { not: null } },
      include: { student: true },
    });

    const { classroom } = await classroomForRequest(req);
    const result = await publishGradesForAssessment(classroom, assessment, submissions);
    res.json(result);
  } catch (err) {
    next(err);
  }
});
