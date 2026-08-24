import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireRole, type AuthedRequest } from "../lib/authMiddleware.js";

export const questionBanksRouter = Router();
questionBanksRouter.use(requireAuth, requireRole("TEACHER", "ADMIN"));

/** Bancos do professor autenticado + bancos públicos de outros professores. */
questionBanksRouter.get("/", async (req: AuthedRequest, res, next) => {
  try {
    const [mine, publicBanks] = await Promise.all([
      prisma.questionBank.findMany({
        where: { ownerId: req.userId! },
        include: { _count: { select: { questions: true } }, owner: true },
        orderBy: { createdAt: "asc" },
      }),
      prisma.questionBank.findMany({
        where: { visibility: "PUBLIC", ownerId: { not: req.userId! } },
        include: { _count: { select: { questions: true } }, owner: true },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    const toSummary = (b: (typeof mine)[number]) => ({
      id: b.id,
      name: b.name,
      visibility: b.visibility,
      ownerName: b.owner.name,
      questionCount: b._count.questions,
    });

    res.json({ mine: mine.map(toSummary), public: publicBanks.map(toSummary) });
  } catch (err) {
    next(err);
  }
});

const bankSchema = z.object({
  name: z.string().min(1),
  visibility: z.enum(["PRIVATE", "PUBLIC"]),
});

/** Cria um novo banco de questões pro professor autenticado. */
questionBanksRouter.post("/", async (req: AuthedRequest, res, next) => {
  try {
    const parsed = bankSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    const bank = await prisma.questionBank.create({
      data: { name: parsed.data.name, visibility: parsed.data.visibility, ownerId: req.userId! },
    });
    res.status(201).json({ id: bank.id, name: bank.name, visibility: bank.visibility, ownerName: "", questionCount: 0 });
  } catch (err) {
    next(err);
  }
});

/** Renomeia ou muda a visibilidade de um banco (só o dono). */
questionBanksRouter.patch("/:id", async (req: AuthedRequest, res, next) => {
  try {
    const parsed = bankSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    const existing = await prisma.questionBank.findFirst({ where: { id: req.params.id, ownerId: req.userId! } });
    if (!existing) {
      return res.status(404).json({ error: "Banco não encontrado" });
    }
    const bank = await prisma.questionBank.update({ where: { id: existing.id }, data: parsed.data });
    res.json(bank);
  } catch (err) {
    next(err);
  }
});

/** Exclui um banco vazio (só o dono; bloqueia se ainda tiver questões). */
questionBanksRouter.delete("/:id", async (req: AuthedRequest, res, next) => {
  try {
    const existing = await prisma.questionBank.findFirst({
      where: { id: req.params.id, ownerId: req.userId! },
      include: { _count: { select: { questions: true } } },
    });
    if (!existing) {
      return res.status(404).json({ error: "Banco não encontrado" });
    }
    if (existing._count.questions > 0) {
      return res.status(409).json({ error: "Mova ou exclua as questões deste banco antes de excluí-lo" });
    }
    await prisma.questionBank.delete({ where: { id: existing.id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});
