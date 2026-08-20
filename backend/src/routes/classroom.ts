import { Router } from "express";
import type { classroom_v1 } from "googleapis";
import { classroomForRequest } from "../lib/google.js";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireRole, type AuthedRequest } from "../lib/authMiddleware.js";
import { distributeAssessment } from "../lib/distributeAssessment.js";

export const classroomRouter = Router();
classroomRouter.use(requireAuth, requireRole("TEACHER", "ADMIN"));

/** Lista as turmas ativas do Google Sala de Aula em que o usuário é professor. */
classroomRouter.get("/courses", async (req: AuthedRequest, res, next) => {
  try {
    const { classroom } = await classroomForRequest(req);
    const { data } = await classroom.courses.list({ teacherId: "me", courseStates: ["ACTIVE"] });
    res.json(
      (data.courses ?? []).map((c) => ({
        id: c.id,
        name: c.name,
        section: c.section,
        room: c.room,
      })),
    );
  } catch (err) {
    next(err);
  }
});

/** Importa uma turma do Classroom (dados + lista de alunos) para o banco da Orbital. */
classroomRouter.post("/courses/:googleCourseId/import", async (req: AuthedRequest, res, next) => {
  try {
    const { user, classroom } = await classroomForRequest(req);
    const { googleCourseId } = req.params;

    const { data: course } = await classroom.courses.get({ id: googleCourseId });
    const classSection = await prisma.classSection.upsert({
      where: { googleClassroomId: googleCourseId },
      update: { name: course.name ?? "Turma sem nome" },
      create: {
        name: course.name ?? "Turma sem nome",
        googleClassroomId: googleCourseId,
        teacherId: user.id,
      },
    });

    const students: classroom_v1.Schema$Student[] = [];
    let pageToken: string | undefined;
    do {
      const { data: rosterPage } = await classroom.courses.students.list({
        courseId: googleCourseId,
        pageToken,
      });
      students.push(...(rosterPage.students ?? []));
      pageToken = rosterPage.nextPageToken ?? undefined;
    } while (pageToken);

    for (const s of students) {
      const email = s.profile?.emailAddress;
      if (!email) continue;

      const student = await prisma.user.upsert({
        where: { email },
        update: {},
        create: { name: s.profile?.name?.fullName ?? email, email, role: "STUDENT" },
      });

      await prisma.enrollment.upsert({
        where: { studentId_classId: { studentId: student.id, classId: classSection.id } },
        update: {},
        create: { studentId: student.id, classId: classSection.id },
      });
    }

    res.json({ classSection, studentsImported: students.length });
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
