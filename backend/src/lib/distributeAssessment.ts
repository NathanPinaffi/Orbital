import type { classroom_v1 } from "googleapis";
import { prisma } from "./prisma.js";
import type { Assessment, ClassSection } from "@prisma/client";

/**
 * Cria a atividade (courseWork) no Google Sala de Aula vinculada à turma da
 * avaliação, com um link de volta pra Orbital, e marca a avaliação como publicada.
 */
export async function distributeAssessment(
  classroom: classroom_v1.Classroom,
  assessment: Assessment & { class: ClassSection },
) {
  if (!assessment.class.googleClassroomId) {
    const err = new Error(`A turma "${assessment.class.name}" não está vinculada ao Google Sala de Aula`);
    (err as { status?: number }).status = 409;
    throw err;
  }

  const appUrl = process.env.FRONTEND_URL ?? "http://localhost:5173";
  const { data: courseWork } = await classroom.courses.courseWork.create({
    courseId: assessment.class.googleClassroomId,
    requestBody: {
      title: assessment.title,
      workType: "ASSIGNMENT",
      state: "PUBLISHED",
      maxPoints: 10,
      dueDate: assessment.dueAt
        ? {
            year: assessment.dueAt.getUTCFullYear(),
            month: assessment.dueAt.getUTCMonth() + 1,
            day: assessment.dueAt.getUTCDate(),
          }
        : undefined,
      // O Google Sala de Aula interpreta dueDate/dueTime em UTC; ambos precisam vir juntos ou a API rejeita.
      dueTime: assessment.dueAt
        ? {
            hours: assessment.dueAt.getUTCHours(),
            minutes: assessment.dueAt.getUTCMinutes(),
          }
        : undefined,
      materials: [{ link: { url: `${appUrl}/assessments/${assessment.id}` } }],
    },
  });

  await prisma.assessment.update({
    where: { id: assessment.id },
    data: { status: "PUBLISHED", googleCourseWorkId: courseWork.id },
  });

  const enrollments = await prisma.enrollment.findMany({ where: { classId: assessment.classId } });
  if (enrollments.length > 0) {
    await prisma.notification.createMany({
      data: enrollments.map((e) => ({
        userId: e.studentId,
        type: "NEW_ASSESSMENT" as const,
        title: "Nova avaliação publicada",
        body: `"${assessment.title}" foi publicada em ${assessment.class.name}`,
        assessmentId: assessment.id,
      })),
    });
  }

  return { courseWorkId: courseWork.id, alternateLink: courseWork.alternateLink };
}
