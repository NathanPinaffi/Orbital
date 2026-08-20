import type { classroom_v1 } from "googleapis";
import { prisma } from "./prisma.js";

function normalizePhotoUrl(photoUrl: string | null | undefined): string | undefined {
  if (!photoUrl) return undefined;
  return photoUrl.startsWith("//") ? `https:${photoUrl}` : photoUrl;
}

/** Importa uma turma do Classroom (dados + roster completo, paginado) para o banco da Orbital. */
export async function importCourseRoster(classroom: classroom_v1.Classroom, teacherId: string, googleCourseId: string) {
  const { data: course } = await classroom.courses.get({ id: googleCourseId });
  const classSection = await prisma.classSection.upsert({
    where: { googleClassroomId: googleCourseId },
    update: { name: course.name ?? "Turma sem nome" },
    create: {
      name: course.name ?? "Turma sem nome",
      googleClassroomId: googleCourseId,
      teacherId,
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
    const avatarUrl = normalizePhotoUrl(s.profile?.photoUrl);

    const student = await prisma.user.upsert({
      where: { email },
      update: { ...(avatarUrl ? { avatarUrl } : {}) },
      create: { name: s.profile?.name?.fullName ?? email, email, role: "STUDENT", avatarUrl },
    });

    await prisma.enrollment.upsert({
      where: { studentId_classId: { studentId: student.id, classId: classSection.id } },
      update: {},
      create: { studentId: student.id, classId: classSection.id },
    });
  }

  return { classSection, studentsImported: students.length };
}

/** Lista todas as turmas ativas do professor no Classroom, paginando até esgotar. */
export async function listAllActiveCourses(classroom: classroom_v1.Classroom) {
  const courses: classroom_v1.Schema$Course[] = [];
  let pageToken: string | undefined;
  do {
    const { data } = await classroom.courses.list({ teacherId: "me", courseStates: ["ACTIVE"], pageToken });
    courses.push(...(data.courses ?? []));
    pageToken = data.nextPageToken ?? undefined;
  } while (pageToken);
  return courses;
}

/** Importa todas as turmas ativas do professor, tolerando falha em turmas individuais. */
export async function importAllCourses(classroom: classroom_v1.Classroom, teacherId: string) {
  const courses = await listAllActiveCourses(classroom);

  const imported: Array<{ courseId: string; classSectionId: string; className: string; studentsImported: number }> = [];
  const skipped: Array<{ courseId: string; reason: string }> = [];

  for (const course of courses) {
    if (!course.id) continue;
    try {
      const { classSection, studentsImported } = await importCourseRoster(classroom, teacherId, course.id);
      imported.push({ courseId: course.id, classSectionId: classSection.id, className: classSection.name, studentsImported });
    } catch (err) {
      skipped.push({ courseId: course.id, reason: err instanceof Error ? err.message : "Erro desconhecido" });
    }
  }

  return { imported, skipped };
}
