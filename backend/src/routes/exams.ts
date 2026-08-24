import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth, type AuthedRequest } from "../lib/authMiddleware.js";
import { shuffle } from "../lib/shuffle.js";

export const examsRouter = Router();
examsRouter.use(requireAuth);

async function loadAssessmentForStudent(assessmentId: string, studentId: string) {
  const assessment = await prisma.assessment.findUnique({
    where: { id: assessmentId },
    include: {
      class: true,
      questions: { include: { question: { include: { alternatives: true } } } },
    },
  });
  if (!assessment) {
    const err = new Error("Avaliação não encontrada");
    (err as { status?: number }).status = 404;
    throw err;
  }

  if (assessment.class.teacherId === studentId) {
    return assessment;
  }

  const enrollment = await prisma.enrollment.findUnique({
    where: { studentId_classId: { studentId, classId: assessment.classId } },
  });
  if (!enrollment) {
    const err = new Error("Você não está matriculado na turma desta avaliação");
    (err as { status?: number }).status = 403;
    throw err;
  }

  return assessment;
}

/** Estado atual da prova para o aluno autenticado: não iniciada, em andamento ou enviada. */
examsRouter.get("/:assessmentId", async (req: AuthedRequest, res, next) => {
  try {
    const assessment = await loadAssessmentForStudent(req.params.assessmentId, req.userId!);

    const submission = await prisma.submission.findUnique({
      where: { assessmentId_studentId: { assessmentId: assessment.id, studentId: req.userId! } },
    });

    if (!submission) {
      return res.json({
        status: "not_started",
        title: assessment.title,
        durationMinutes: assessment.durationMinutes,
        questionCount: assessment.questions.length,
      });
    }

    if (submission.submittedAt) {
      return res.json({ status: "submitted", score: submission.score });
    }

    const elapsedSeconds = (Date.now() - submission.startedAt.getTime()) / 1000;

    const breakStartSeconds = assessment.breakStartMinute != null ? assessment.breakStartMinute * 60 : null;
    const breakDurationSeconds = assessment.breakDurationMinutes != null ? assessment.breakDurationMinutes * 60 : null;
    const breakEndSeconds = breakStartSeconds != null && breakDurationSeconds != null ? breakStartSeconds + breakDurationSeconds : null;

    let remainingSeconds: number;
    let onBreakNow = false;
    let secondsUntilBreak: number | null = null;
    let breakRemainingOrDurationSeconds: number | null = null;

    if (breakStartSeconds != null && breakEndSeconds != null && elapsedSeconds >= breakStartSeconds && elapsedSeconds < breakEndSeconds) {
      onBreakNow = true;
      breakRemainingOrDurationSeconds = Math.max(0, Math.round(breakEndSeconds - elapsedSeconds));
      remainingSeconds = Math.max(0, Math.round(assessment.durationMinutes * 60 - breakStartSeconds));
    } else if (breakStartSeconds != null && breakDurationSeconds != null && breakEndSeconds != null && elapsedSeconds >= breakEndSeconds) {
      remainingSeconds = Math.max(0, Math.round(assessment.durationMinutes * 60 - (elapsedSeconds - breakDurationSeconds)));
    } else {
      remainingSeconds = Math.max(0, Math.round(assessment.durationMinutes * 60 - elapsedSeconds));
      if (breakStartSeconds != null && breakDurationSeconds != null) {
        secondsUntilBreak = Math.max(0, Math.round(breakStartSeconds - elapsedSeconds));
        breakRemainingOrDurationSeconds = breakDurationSeconds;
      }
    }

    const orderedQuestions = shuffle(assessment.questions, submission.id);
    const questions = orderedQuestions.map((aq) => {
      const alternatives =
        aq.question.type === "ESSAY"
          ? []
          : shuffle(aq.question.alternatives, submission.id + aq.question.id).map((alt) => ({
              id: alt.id,
              content: alt.content,
            }));

      return {
        id: aq.question.id,
        content: aq.question.content,
        type: aq.question.type,
        alternatives,
      };
    });

    res.json({
      status: "in_progress",
      title: assessment.title,
      remainingSeconds,
      questions,
      onBreakNow,
      secondsUntilBreak,
      breakDurationSeconds: breakRemainingOrDurationSeconds,
    });
  } catch (err) {
    next(err);
  }
});

/** Inicia a prova (cria a Submission, disparando o cronômetro). Idempotente. */
examsRouter.post("/:assessmentId/start", async (req: AuthedRequest, res, next) => {
  try {
    const assessment = await loadAssessmentForStudent(req.params.assessmentId, req.userId!);

    const submission = await prisma.submission.upsert({
      where: { assessmentId_studentId: { assessmentId: assessment.id, studentId: req.userId! } },
      update: {},
      create: { assessmentId: assessment.id, studentId: req.userId! },
    });

    res.status(201).json({ startedAt: submission.startedAt });
  } catch (err) {
    next(err);
  }
});

const submitSchema = z.object({
  answers: z.array(z.object({ questionId: z.string(), response: z.string() })),
});

/** Recebe as respostas, corrige as questões objetivas e calcula a nota. */
examsRouter.post("/:assessmentId/submit", async (req: AuthedRequest, res, next) => {
  try {
    const parsed = submitSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }

    const assessment = await loadAssessmentForStudent(req.params.assessmentId, req.userId!);

    const submission = await prisma.submission.findUnique({
      where: { assessmentId_studentId: { assessmentId: assessment.id, studentId: req.userId! } },
    });
    if (!submission) {
      return res.status(409).json({ error: "A prova ainda não foi iniciada" });
    }
    if (submission.submittedAt) {
      return res.status(409).json({ error: "Esta prova já foi enviada" });
    }

    let earnedPoints = 0;
    let totalObjectivePoints = 0;

    const answerRows = parsed.data.answers.map((a) => {
      const aq = assessment.questions.find((q) => q.questionId === a.questionId);
      if (!aq) return null;

      if (aq.question.type === "ESSAY") {
        return { questionId: a.questionId, response: a.response, isCorrect: null, points: null };
      }

      totalObjectivePoints += aq.points;
      const chosen = aq.question.alternatives.find((alt) => alt.id === a.response);
      const isCorrect = chosen?.isCorrect ?? false;
      if (isCorrect) earnedPoints += aq.points;

      return { questionId: a.questionId, response: a.response, isCorrect, points: isCorrect ? aq.points : 0 };
    });

    const validAnswers = answerRows.filter((a): a is NonNullable<typeof a> => a !== null);
    const score = totalObjectivePoints > 0 ? (earnedPoints / totalObjectivePoints) * 10 : null;

    await prisma.$transaction(async (tx) => {
      await tx.answer.deleteMany({ where: { submissionId: submission.id } });
      await tx.answer.createMany({
        data: validAnswers.map((a) => ({
          submissionId: submission.id,
          questionId: a.questionId,
          response: a.response,
          isCorrect: a.isCorrect,
          points: a.points,
        })),
      });
      await tx.submission.update({
        where: { id: submission.id },
        data: { submittedAt: new Date(), score },
      });
    });

    res.json({ status: "submitted", score });
  } catch (err) {
    next(err);
  }
});
