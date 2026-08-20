import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth, type AuthedRequest } from "../lib/authMiddleware.js";
import { classroomForRequest } from "../lib/google.js";
import { distributeAssessment } from "../lib/distributeAssessment.js";

export const assessmentsRouter = Router();
assessmentsRouter.use(requireAuth);

const createSchema = z.object({
  title: z.string().min(1),
  durationMinutes: z.number().int().positive(),
  classIds: z.array(z.string()).min(1),
  questionIds: z.array(z.string()).min(1),
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
    const { title, durationMinutes, classIds, questionIds } = parsed.data;

    const classes = await prisma.classSection.findMany({
      where: { id: { in: classIds }, teacherId: req.userId! },
    });
    if (classes.length !== classIds.length) {
      return res.status(404).json({ error: "Uma ou mais turmas não foram encontradas" });
    }

    const questions = await prisma.question.findMany({
      where: { id: { in: questionIds }, authorId: req.userId! },
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
          classId: classSection.id,
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
