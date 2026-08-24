import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth, type AuthedRequest } from "../lib/authMiddleware.js";

export const notificationsRouter = Router();
notificationsRouter.use(requireAuth);

/** Últimas notificações do usuário autenticado + contagem de não lidas. */
notificationsRouter.get("/", async (req: AuthedRequest, res, next) => {
  try {
    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: req.userId! },
        orderBy: { createdAt: "desc" },
        take: 30,
      }),
      prisma.notification.count({ where: { userId: req.userId!, readAt: null } }),
    ]);
    res.json({ unreadCount, notifications });
  } catch (err) {
    next(err);
  }
});

/** Marca uma notificação como lida. */
notificationsRouter.post("/:id/read", async (req: AuthedRequest, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: { id: req.params.id, userId: req.userId! },
      data: { readAt: new Date() },
    });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

/** Marca todas as notificações do usuário como lidas. */
notificationsRouter.post("/read-all", async (req: AuthedRequest, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.userId!, readAt: null },
      data: { readAt: new Date() },
    });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});
