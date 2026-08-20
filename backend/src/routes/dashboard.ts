import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireRole, type AuthedRequest } from "../lib/authMiddleware.js";

export const dashboardRouter = Router();
dashboardRouter.use(requireAuth);

/** Dashboard de desempenho do aluno: turmas matriculadas e provas já entregues. */
dashboardRouter.get("/student", requireRole("STUDENT"), async (req: AuthedRequest, res, next) => {
  try {
    const [enrollments, submissions] = await Promise.all([
      prisma.enrollment.findMany({
        where: { studentId: req.userId! },
        include: { class: { include: { teacher: true } } },
      }),
      prisma.submission.findMany({
        where: { studentId: req.userId!, submittedAt: { not: null } },
        include: { assessment: { include: { class: true } } },
        orderBy: { submittedAt: "desc" },
      }),
    ]);

    res.json({
      classes: enrollments.map(({ class: c }) => ({ id: c.id, name: c.name, teacherName: c.teacher.name })),
      submissions: submissions.map((s) => ({
        id: s.id,
        assessmentId: s.assessmentId,
        assessmentTitle: s.assessment.title,
        className: s.assessment.class.name,
        submittedAt: s.submittedAt,
        score: s.score,
      })),
    });
  } catch (err) {
    next(err);
  }
});
