import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { GlassCard } from "../components/dashboard/GlassCard";
import { Button } from "../components/ui/Button";
import { GoogleIcon } from "../components/ui/icons";
import { CheckCircleIcon, UsersIcon } from "../components/ui/dashboardIcons";
import { useGsapEntrance } from "../hooks/useGsapEntrance";
import { useClassroomCourses } from "../hooks/useClassroomCourses";
import { importAllClassroomCourses, loginWithGoogle, type ClassroomCourse } from "../lib/api";

type SyncState = "idle" | "syncing" | "done" | "error";

export default function Classrooms() {
  const containerRef = useGsapEntrance<HTMLDivElement>();
  const { status, courses } = useClassroomCourses();
  const [syncState, setSyncState] = useState<SyncState>("idle");
  const [classSectionByCourseId, setClassSectionByCourseId] = useState<Record<string, { id: string; students: number }>>({});
  const [missingEmailWarning, setMissingEmailWarning] = useState<number | null>(null);

  async function runSync() {
    setSyncState("syncing");
    try {
      const result = await importAllClassroomCourses();
      const map: Record<string, { id: string; students: number }> = {};
      let missingEmailTotal = 0;
      for (const item of result.imported) {
        map[item.courseId] = { id: item.classSectionId, students: item.studentsImported };
        missingEmailTotal += item.missingEmail;
      }
      setClassSectionByCourseId(map);
      setMissingEmailWarning(missingEmailTotal > 0 ? missingEmailTotal : null);
      setSyncState("done");
    } catch {
      setSyncState("error");
    }
  }

  useEffect(() => {
    if (status === "ready") runSync();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  return (
    <AppShell>
      <div ref={containerRef}>
        <header data-animate className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-bricolage text-2xl font-light tracking-tight text-white sm:text-3xl">
              Turmas
            </h1>
            <br />
            <p className="text-sm text-neutral-500">Suas turmas são importadas automaticamente do Google Sala de Aula.</p>
          </div>
          {status === "ready" && (
            <button
              onClick={runSync}
              disabled={syncState === "syncing"}
              className="shrink-0 self-start rounded-full bg-orange-500/10 px-4 py-2 text-xs font-medium text-orange-400 ring-1 ring-orange-500/20 transition hover:bg-orange-500/20 disabled:cursor-not-allowed disabled:opacity-50 sm:self-auto"
            >
              {syncState === "syncing" ? "Sincronizando…" : "Sincronizar novamente"}
            </button>
          )}
        </header>

        {missingEmailWarning != null && (
          <GlassCard data-animate className="mb-4 max-w-xl border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-300">
            {missingEmailWarning} aluno(s) não puderam ser matriculados porque o Google não retornou o e-mail deles.
            Isso costuma ser resolvido reconectando sua conta Google (saia e entre novamente) para conceder a
            permissão de e-mail do Sala de Aula.
          </GlassCard>
        )}

        {status === "loading" && (
          <div data-animate className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-2xl bg-white/[0.03]" />
            ))}
          </div>
        )}

        {status === "not_connected" && (
          <div
            data-animate
            className="electric-card relative max-w-lg overflow-hidden rounded-[28px] bg-neutral-900 p-[2px]"
          >
            <div className="absolute inset-0 z-0 bg-gradient-to-b from-yellow-300 via-orange-500 to-transparent opacity-80" />
            <div className="relative z-10 rounded-[26px] bg-[#0A0A0A] p-6 text-center sm:p-8">
              <h2 className="font-bricolage mb-2 text-xl font-light tracking-tight text-white">
                Conecte-se ao Google Sala de Aula
              </h2>
              <p className="mb-6 text-sm leading-relaxed text-neutral-400">
                Sua conta ainda não está vinculada. Conecte para importar turmas, alunos e distribuir
                avaliações automaticamente.
              </p>
              <Button type="button" variant="secondary" onClick={() => loginWithGoogle()}>
                <GoogleIcon />
                Conectar com Google
              </Button>
            </div>
          </div>
        )}

        {status === "error" && (
          <GlassCard data-animate className="max-w-lg p-6 text-sm text-red-400">
            Não foi possível carregar suas turmas agora. Tente novamente em instantes.
          </GlassCard>
        )}

        {status === "ready" && syncState === "syncing" && Object.keys(classSectionByCourseId).length === 0 && (
          <div data-animate className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-2xl bg-white/[0.03]" />
            ))}
          </div>
        )}

        {status === "ready" && courses.length === 0 && syncState !== "syncing" && (
          <GlassCard data-animate className="max-w-lg p-6 text-sm text-neutral-400">
            Nenhuma turma ativa encontrada no seu Google Sala de Aula.
          </GlassCard>
        )}

        {status === "ready" && courses.length > 0 && (syncState === "done" || syncState === "error") && (
          <div className="space-y-3">
            {courses.map((course: ClassroomCourse) => {
              const imported = classSectionByCourseId[course.id];
              return (
                <GlassCard
                  key={course.id}
                  data-animate
                  className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-500/10 text-orange-400">
                      <UsersIcon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm text-white">{course.name}</p>
                      <p className="truncate text-xs text-neutral-500">
                        {[course.section, course.room].filter(Boolean).join(" · ") || "Google Sala de Aula"}
                      </p>
                    </div>
                  </div>

                  {imported ? (
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                        <CheckCircleIcon className="h-4 w-4" />
                        Importada · {imported.students} alunos
                      </span>
                      <Link
                        to={`/turmas/${imported.id}/ranking`}
                        className="rounded-full bg-orange-500/10 px-3 py-1.5 text-xs font-medium text-orange-400 ring-1 ring-orange-500/20 transition hover:bg-orange-500/20"
                      >
                        Ver ranking
                      </Link>
                    </div>
                  ) : (
                    <span className="shrink-0 text-xs text-neutral-500">
                      {syncState === "error" ? "Falha ao sincronizar" : "Não importada"}
                    </span>
                  )}
                </GlassCard>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
