import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth, type AuthedRequest } from "../lib/authMiddleware.js";

export const questionsRouter = Router();
questionsRouter.use(requireAuth);

const difficultySchema = z.enum(["EASY", "MEDIUM", "HARD"]);
const bloomLevelSchema = z.enum(["REMEMBER", "UNDERSTAND", "APPLY", "ANALYZE", "EVALUATE", "CREATE"]);

const baseFields = {
  subject: z.string().min(1),
  topic: z.string().min(1),
  content: z.string().min(1),
  difficulty: difficultySchema,
  bloomLevel: bloomLevelSchema,
};

const questionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("MULTIPLE_CHOICE"),
    ...baseFields,
    alternatives: z
      .array(z.object({ content: z.string().min(1), isCorrect: z.boolean() }))
      .min(2)
      .refine((alts) => alts.filter((a) => a.isCorrect).length === 1, {
        message: "Marque exatamente uma alternativa como correta",
      }),
  }),
  z.object({
    type: z.literal("TRUE_FALSE"),
    ...baseFields,
    correctAnswer: z.boolean(),
  }),
  z.object({
    type: z.literal("ESSAY"),
    ...baseFields,
  }),
]);

function alternativesForCreate(body: z.infer<typeof questionSchema>) {
  if (body.type === "MULTIPLE_CHOICE") {
    return body.alternatives;
  }
  if (body.type === "TRUE_FALSE") {
    return [
      { content: "Verdadeiro", isCorrect: body.correctAnswer === true },
      { content: "Falso", isCorrect: body.correctAnswer === false },
    ];
  }
  return [];
}

questionsRouter.get("/", async (req: AuthedRequest, res, next) => {
  try {
    const questions = await prisma.question.findMany({
      where: { authorId: req.userId! },
      include: { alternatives: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(questions);
  } catch (err) {
    next(err);
  }
});

questionsRouter.post("/", async (req: AuthedRequest, res, next) => {
  try {
    const parsed = questionSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    const body = parsed.data;

    const question = await prisma.question.create({
      data: {
        authorId: req.userId!,
        subject: body.subject,
        topic: body.topic,
        content: body.content,
        type: body.type,
        difficulty: body.difficulty,
        bloomLevel: body.bloomLevel,
        alternatives: { create: alternativesForCreate(body) },
      },
      include: { alternatives: true },
    });

    res.status(201).json(question);
  } catch (err) {
    next(err);
  }
});

questionsRouter.put("/:id", async (req: AuthedRequest, res, next) => {
  try {
    const parsed = questionSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    const body = parsed.data;

    const existing = await prisma.question.findFirst({
      where: { id: req.params.id, authorId: req.userId! },
    });
    if (!existing) {
      return res.status(404).json({ error: "Questão não encontrada" });
    }

    const question = await prisma.$transaction(async (tx) => {
      await tx.alternative.deleteMany({ where: { questionId: existing.id } });
      return tx.question.update({
        where: { id: existing.id },
        data: {
          subject: body.subject,
          topic: body.topic,
          content: body.content,
          type: body.type,
          difficulty: body.difficulty,
          bloomLevel: body.bloomLevel,
          alternatives: { create: alternativesForCreate(body) },
        },
        include: { alternatives: true },
      });
    });

    res.json(question);
  } catch (err) {
    next(err);
  }
});

questionsRouter.delete("/:id", async (req: AuthedRequest, res, next) => {
  try {
    const existing = await prisma.question.findFirst({
      where: { id: req.params.id, authorId: req.userId! },
    });
    if (!existing) {
      return res.status(404).json({ error: "Questão não encontrada" });
    }

    await prisma.question.delete({ where: { id: existing.id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});
