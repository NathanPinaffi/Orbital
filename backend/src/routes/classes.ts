import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth, type AuthedRequest } from "../lib/authMiddleware.js";

export const classesRouter = Router();
classesRouter.use(requireAuth);

/** Lista as turmas do professor autenticado já sincronizadas na Orbital. */
classesRouter.get("/", async (req: AuthedRequest, res, next) => {
  try {
    const classes = await prisma.classSection.findMany({
      where: { teacherId: req.userId! },
      include: { _count: { select: { enrollments: true } } },
      orderBy: { name: "asc" },
    });
    res.json(
      classes.map((c) => ({
        id: c.id,
        name: c.name,
        studentCount: c._count.enrollments,
        googleClassroomId: c.googleClassroomId,
      })),
    );
  } catch (err) {
    next(err);
  }
});
