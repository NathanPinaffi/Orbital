import { Router } from "express";
import { classroomForRequest } from "../lib/google.js";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireRole, type AuthedRequest } from "../lib/authMiddleware.js";
import { distributeAssessment } from "../lib/distributeAssessment.js";
import { importCourseRoster, importAllCourses, listAllActiveCourses } from "../lib/importClassroom.js";
import { cached } from "../lib/redis.js";

export const classroomRouter = Router();
classroomRouter.use(requireAuth, requireRole("TEACHER", "ADMIN"));

/** Lista as turmas ativas do Google Sala de Aula em que o usuário é professor (cacheada por 5 min). */
classroomRouter.get("/courses", async (req: AuthedRequest, res, next) => {
  try {
    const { classroom } = await classroomForRequest(req);
    const courses = await cached(`classroom:courses:${req.userId}`, 300, async () => {
      const list = await listAllActiveCourses(classroom);
      return list.map((c) => ({ id: c.id, name: c.name, section: c.section, room: c.room }));
    });
    res.json(courses);
  } catch (err) {
    next(err);
  }
});

/** Importa uma turma do Classroom (dados + lista de alunos) para o banco da Orbital. */
classroomRouter.post("/courses/:googleCourseId/import", async (req: AuthedRequest, res, next) => {
  try {
    const { user, classroom } = await classroomForRequest(req);
    const result = await importCourseRoster(classroom, user.id, req.params.googleCourseId);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/** Importa todas as turmas ativas do professor de uma vez (usado no auto-sync). */
classroomRouter.post("/courses/import-all", async (req: AuthedRequest, res, next) => {
  try {
    const { user, classroom } = await classroomForRequest(req);
    const result = await importAllCourses(classroom, user.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * Distribui uma avaliação como atividade (coursework) na turma do Classroom
 * vinculada, com um link para o aluno responder dentro da Orbital.
 */
classroomRouter.post("/assessments/:assessmentId/distribute", async (req: AuthedRequest, res, next) => {
  try {
    const { classroom } = await classroomForRequest(req);
    const assessment = await prisma.assessment.findUniqueOrThrow({
      where: { id: req.params.assessmentId },
      include: { class: true },
    });

    const result = await distributeAssessment(classroom, assessment);
    res.json(result);
  } catch (err) {
    next(err);
  }
});
