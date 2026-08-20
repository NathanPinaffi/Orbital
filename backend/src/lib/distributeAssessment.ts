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

  return { courseWorkId: courseWork.id, alternateLink: courseWork.alternateLink };
}
