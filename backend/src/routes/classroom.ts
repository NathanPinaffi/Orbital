import { Router } from "express";
import { classroomClient } from "../lib/google.js";
import { prisma } from "../lib/prisma.js";
import { requireAuth, type AuthedRequest } from "../lib/authMiddleware.js";

export const classroomRouter = Router();
classroomRouter.use(requireAuth);

async function classroomForRequest(req: AuthedRequest) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId! } });
  if (!user.googleRefreshToken) {
    const err = new Error("Conta não conectada ao Google Sala de Aula");
    (err as { status?: number }).status = 409;
    throw err;
  }
  return { user, classroom: classroomClient(user.googleRefreshToken) };
}

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

    const { data: rosterPage } = await classroom.courses.students.list({ courseId: googleCourseId });
    const students = rosterPage.students ?? [];

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

    if (!assessment.class.googleClassroomId) {
      return res.status(409).json({ error: "Esta turma não está vinculada ao Google Sala de Aula" });
    }

    const appUrl = process.env.FRONTEND_URL ?? "http://localhost:5173";
    const { data: courseWork } = await classroom.courses.courseWork.create({
      courseId: assessment.class.googleClassroomId,
      requestBody: {
        title: assessment.title,
        workType: "ASSIGNMENT",
        state: "PUBLISHED",
        dueDate: assessment.dueAt
          ? {
              year: assessment.dueAt.getFullYear(),
              month: assessment.dueAt.getMonth() + 1,
              day: assessment.dueAt.getDate(),
            }
          : undefined,
        materials: [{ link: { url: `${appUrl}/assessments/${assessment.id}` } }],
      },
    });

    await prisma.assessment.update({
      where: { id: assessment.id },
      data: { status: "PUBLISHED" },
    });

    res.json({ courseWorkId: courseWork.id, alternateLink: courseWork.alternateLink });
  } catch (err) {
    next(err);
  }
});
