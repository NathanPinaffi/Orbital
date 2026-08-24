import { prisma } from "./prisma.js";

/** Notifica professor e alunos matriculados quando uma avaliação publicada está a menos de 24h do prazo. */
export async function checkDueSoonAssessments() {
  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const assessments = await prisma.assessment.findMany({
    where: { status: "PUBLISHED", dueAt: { gte: now, lte: in24h }, dueSoonNotifiedAt: null },
    include: { class: { include: { enrollments: true } } },
  });

  for (const a of assessments) {
    const recipients = [a.class.teacherId, ...a.class.enrollments.map((e) => e.studentId)];
    if (recipients.length > 0) {
      await prisma.notification.createMany({
        data: recipients.map((userId) => ({
          userId,
          type: "DUE_SOON" as const,
          title: "Prazo de entrega chegando",
          body: `"${a.title}" (${a.class.name}) vence em menos de 24h`,
          assessmentId: a.id,
        })),
      });
    }
    await prisma.assessment.update({ where: { id: a.id }, data: { dueSoonNotifiedAt: new Date() } });
  }

  return assessments.length;
}

const CHECK_INTERVAL_MS = 30 * 60 * 1000;

/** Inicia a checagem periódica de prazos próximos do vencimento. */
export function startDueSoonChecker() {
  const run = () => {
    checkDueSoonAssessments().catch((err) => {
      console.error("Falha ao checar avaliações com prazo próximo:", err);
    });
  };
  run();
  setInterval(run, CHECK_INTERVAL_MS);
}
