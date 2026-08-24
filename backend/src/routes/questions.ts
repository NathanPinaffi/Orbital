import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireRole, type AuthedRequest } from "../lib/authMiddleware.js";

export const questionsRouter = Router();
questionsRouter.use(requireAuth, requireRole("TEACHER", "ADMIN"));

const difficultySchema = z.enum(["EASY", "MEDIUM", "HARD"]);
const bloomLevelSchema = z.enum(["REMEMBER", "UNDERSTAND", "APPLY", "ANALYZE", "EVALUATE", "CREATE"]);

const graphSchema = z
  .object({
    expression: z.string().min(1),
    xMin: z.number(),
    xMax: z.number(),
    yMin: z.number(),
    yMax: z.number(),
  })
  .refine((g) => g.xMax > g.xMin, { message: "O máximo de X deve ser maior que o mínimo" })
  .refine((g) => g.yMax > g.yMin, { message: "O máximo de Y deve ser maior que o mínimo" });

const baseFields = {
  bankId: z.string().min(1),
  subject: z.string().min(1),
  topic: z.string().min(1),
  content: z.string().min(1),
  difficulty: difficultySchema,
  bloomLevel: bloomLevelSchema,
  graph: graphSchema.nullable().optional(),
  requiresSketch: z.boolean().optional().default(false),
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

function serializeQuestion<
  T extends {
    graphExpression: string | null;
    graphXMin: number | null;
    graphXMax: number | null;
    graphYMin: number | null;
    graphYMax: number | null;
  },
>(question: T) {
  const { graphExpression, graphXMin, graphXMax, graphYMin, graphYMax, ...rest } = question;
  return {
    ...rest,
    graph:
      graphExpression != null
        ? { expression: graphExpression, xMin: graphXMin!, xMax: graphXMax!, yMin: graphYMin!, yMax: graphYMax! }
        : null,
  };
}

/** Carrega um banco garantindo que o professor pode ler dele (dono ou banco público). */
async function loadReadableBank(bankId: string, userId: string) {
  const bank = await prisma.questionBank.findUnique({ where: { id: bankId } });
  if (!bank || (bank.ownerId !== userId && bank.visibility !== "PUBLIC")) {
    const err = new Error("Banco não encontrado");
    (err as { status?: number }).status = 404;
    throw err;
  }
  return bank;
}

/** Lista questões acessíveis: sem bankId, tudo (bancos próprios + públicos); com bankId, só aquele banco. */
questionsRouter.get("/", async (req: AuthedRequest, res, next) => {
  try {
    const bankId = typeof req.query.bankId === "string" ? req.query.bankId : undefined;

    if (bankId) {
      await loadReadableBank(bankId, req.userId!);
    }

    const questions = await prisma.question.findMany({
      where: bankId
        ? { bankId }
        : { bank: { OR: [{ ownerId: req.userId! }, { visibility: "PUBLIC" }] } },
      include: { alternatives: true, bank: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(
      questions.map((q) => ({
        ...serializeQuestion(q),
        bank: { id: q.bank.id, name: q.bank.name, visibility: q.bank.visibility, ownerId: q.bank.ownerId },
      })),
    );
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

    const bank = await prisma.questionBank.findFirst({ where: { id: body.bankId, ownerId: req.userId! } });
    if (!bank) {
      return res.status(404).json({ error: "Banco não encontrado" });
    }

    const question = await prisma.question.create({
      data: {
        authorId: req.userId!,
        bankId: bank.id,
        subject: body.subject,
        topic: body.topic,
        content: body.content,
        type: body.type,
        difficulty: body.difficulty,
        bloomLevel: body.bloomLevel,
        graphExpression: body.graph?.expression ?? null,
        graphXMin: body.graph?.xMin ?? null,
        graphXMax: body.graph?.xMax ?? null,
        graphYMin: body.graph?.yMin ?? null,
        graphYMax: body.graph?.yMax ?? null,
        requiresSketch: body.requiresSketch,
        alternatives: { create: alternativesForCreate(body) },
      },
      include: { alternatives: true },
    });

    res.status(201).json(serializeQuestion(question));
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
      where: { id: req.params.id, bank: { ownerId: req.userId! } },
    });
    if (!existing) {
      return res.status(404).json({ error: "Questão não encontrada" });
    }

    const bank = await prisma.questionBank.findFirst({ where: { id: body.bankId, ownerId: req.userId! } });
    if (!bank) {
      return res.status(404).json({ error: "Banco não encontrado" });
    }

    const question = await prisma.$transaction(async (tx) => {
      await tx.alternative.deleteMany({ where: { questionId: existing.id } });
      return tx.question.update({
        where: { id: existing.id },
        data: {
          bankId: bank.id,
          subject: body.subject,
          topic: body.topic,
          content: body.content,
          type: body.type,
          difficulty: body.difficulty,
          bloomLevel: body.bloomLevel,
          graphExpression: body.graph?.expression ?? null,
          graphXMin: body.graph?.xMin ?? null,
          graphXMax: body.graph?.xMax ?? null,
          graphYMin: body.graph?.yMin ?? null,
          graphYMax: body.graph?.yMax ?? null,
          requiresSketch: body.requiresSketch,
          alternatives: { create: alternativesForCreate(body) },
        },
        include: { alternatives: true },
      });
    });

    res.json(serializeQuestion(question));
  } catch (err) {
    next(err);
  }
});

questionsRouter.delete("/:id", async (req: AuthedRequest, res, next) => {
  try {
    const existing = await prisma.question.findFirst({
      where: { id: req.params.id, bank: { ownerId: req.userId! } },
    });
    if (!existing) {
      return res.status(404).json({ error: "Questão não encontrada" });
    }

    const usageCount = await prisma.assessmentQuestion.count({ where: { questionId: existing.id } });
    if (usageCount > 0) {
      return res.status(409).json({
        error: "Esta questão está sendo usada em uma ou mais avaliações e não pode ser excluída. Remova-a das avaliações antes de excluir.",
      });
    }

    await prisma.question.delete({ where: { id: existing.id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});
