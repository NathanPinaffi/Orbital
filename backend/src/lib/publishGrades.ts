import type { classroom_v1 } from "googleapis";
import { prisma } from "./prisma.js";
import type { Assessment, ClassSection, Submission, User } from "@prisma/client";

type AssessmentWithClass = Assessment & { class: ClassSection };
type SubmissionWithStudent = Submission & { student: User };

function missingPrerequisite(assessment: AssessmentWithClass, submission: SubmissionWithStudent) {
  if (!assessment.googleCourseWorkId) return "Avaliação não possui atividade vinculada no Google Sala de Aula";
  if (!assessment.class.googleClassroomId) return "Turma não está vinculada ao Google Sala de Aula";
  if (!submission.submittedAt) return "Aluno ainda não entregou a prova";
  if (submission.score == null) return "Prova ainda não foi corrigida (nota indisponível)";
  if (!submission.student.googleId) return "Aluno não está vinculado a uma conta Google";
  return null;
}

/** Publica a nota de uma submission específica como assignedGrade/draftGrade no Google Sala de Aula. */
export async function publishGradeForSubmission(
  classroom: classroom_v1.Classroom,
  assessment: AssessmentWithClass,
  submission: SubmissionWithStudent,
) {
  const reason = missingPrerequisite(assessment, submission);
  if (reason) {
    const err = new Error(reason);
    (err as { status?: number }).status = 409;
    throw err;
  }

  const { data } = await classroom.courses.courseWork.studentSubmissions.list({
    courseId: assessment.class.googleClassroomId!,
    courseWorkId: assessment.googleCourseWorkId!,
    userId: submission.student.googleId!,
  });
  const studentSubmission = data.studentSubmissions?.[0];
  if (!studentSubmission?.id) {
    const err = new Error("Entrega correspondente não encontrada no Google Sala de Aula");
    (err as { status?: number }).status = 404;
    throw err;
  }

  await classroom.courses.courseWork.studentSubmissions.patch({
    courseId: assessment.class.googleClassroomId!,
    courseWorkId: assessment.googleCourseWorkId!,
    id: studentSubmission.id,
    updateMask: "assignedGrade,draftGrade",
    requestBody: { assignedGrade: submission.score!, draftGrade: submission.score! },
  });

  return prisma.submission.update({
    where: { id: submission.id },
    data: { gradePublishedAt: new Date() },
  });
}

const CONCURRENCY = 4;

/** Publica a nota de várias submissions, sem interromper o lote por causa de falhas individuais. */
export async function publishGradesForAssessment(
  classroom: classroom_v1.Classroom,
  assessment: AssessmentWithClass,
  submissions: SubmissionWithStudent[],
) {
  const published: string[] = [];
  const skipped: Array<{ studentId: string; reason: string }> = [];

  let cursor = 0;
  async function worker() {
    while (cursor < submissions.length) {
      const submission = submissions[cursor++];
      try {
        await publishGradeForSubmission(classroom, assessment, submission);
        published.push(submission.studentId);
      } catch (err) {
        skipped.push({ studentId: submission.studentId, reason: err instanceof Error ? err.message : "Erro desconhecido" });
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, submissions.length) }, worker));

  return { published, skipped };
}
