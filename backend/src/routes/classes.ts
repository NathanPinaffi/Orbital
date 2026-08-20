import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireRole, type AuthedRequest } from "../lib/authMiddleware.js";

export const classesRouter = Router();
classesRouter.use(requireAuth, requireRole("TEACHER", "ADMIN"));

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

/** Ranking dos alunos matriculados na turma, pela média das provas entregues e corrigidas. */
classesRouter.get("/:classId/ranking", async (req: AuthedRequest, res, next) => {
  try {
    const classSection = await prisma.classSection.findUnique({ where: { id: req.params.classId } });
    if (!classSection || classSection.teacherId !== req.userId) {
      return res.status(404).json({ error: "Turma não encontrada" });
    }

    const [enrollments, submissions] = await Promise.all([
      prisma.enrollment.findMany({ where: { classId: classSection.id }, include: { student: true } }),
      prisma.submission.findMany({
        where: { assessment: { classId: classSection.id }, submittedAt: { not: null }, score: { not: null } },
      }),
    ]);

    const scoresByStudentId = new Map<string, number[]>();
    for (const s of submissions) {
      const list = scoresByStudentId.get(s.studentId) ?? [];
      list.push(s.score!);
      scoresByStudentId.set(s.studentId, list);
    }

    const entries = enrollments.map(({ student }) => {
      const scores = scoresByStudentId.get(student.id) ?? [];
      const average = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
      return {
        studentId: student.id,
        studentName: student.name,
        avatarUrl: student.avatarUrl,
        average,
        submissionsCount: scores.length,
      };
    });

    entries.sort((a, b) => {
      if (a.average == null && b.average == null) return a.studentName.localeCompare(b.studentName);
      if (a.average == null) return 1;
      if (b.average == null) return -1;
      return b.average - a.average || a.studentName.localeCompare(b.studentName);
    });

    res.json({
      className: classSection.name,
      ranking: entries.map((e, i) => ({ rank: i + 1, ...e })),
    });
  } catch (err) {
    next(err);
  }
});
