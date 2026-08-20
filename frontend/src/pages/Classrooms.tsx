import { useEffect, useState } from "react";
import { AppShell } from "../components/layout/AppShell";
import { GlassCard } from "../components/dashboard/GlassCard";
import { Button } from "../components/ui/Button";
import { GoogleIcon } from "../components/ui/icons";
import { CheckCircleIcon, UsersIcon } from "../components/ui/dashboardIcons";
import { useGsapEntrance } from "../hooks/useGsapEntrance";
import {
  ApiError,
  fetchClassroomCourses,
  importClassroomCourse,
  loginWithGoogle,
  type ClassroomCourse,
} from "../lib/api";

type ImportState = "idle" | "importing" | "done" | "error";

export default function Classrooms() {
  const containerRef = useGsapEntrance<HTMLDivElement>();
  const [status, setStatus] = useState<"loading" | "not_connected" | "ready" | "error">("loading");
  const [courses, setCourses] = useState<ClassroomCourse[]>([]);
  const [importStates, setImportStates] = useState<Record<string, { state: ImportState; students?: number }>>({});

  useEffect(() => {
    fetchClassroomCourses()
      .then((data) => {
        setCourses(data);
        setStatus("ready");
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 409) {
          setStatus("not_connected");
        } else {
          setStatus("error");
        }
      });
  }, []);

  async function handleImport(course: ClassroomCourse) {
    setImportStates((prev) => ({ ...prev, [course.id]: { state: "importing" } }));
    try {
      const result = await importClassroomCourse(course.id);
      setImportStates((prev) => ({
        ...prev,
        [course.id]: { state: "done", students: result.studentsImported },
      }));
    } catch {
      setImportStates((prev) => ({ ...prev, [course.id]: { state: "error" } }));
    }
  }

  return (
    <AppShell>
      <div ref={containerRef}>
        <header data-animate className="mb-8">
          <h1 className="font-bricolage text-2xl font-light tracking-tight text-white sm:text-3xl">
            Turmas
          </h1>
          <p className="text-sm text-neutral-500">Importe suas turmas diretamente do Google Sala de Aula.</p>
        </header>

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
            <div className="relative z-10 rounded-[26px] bg-[#0A0A0A] p-8 text-center">
              <h2 className="font-bricolage mb-2 text-xl font-light tracking-tight text-white">
                Conecte-se ao Google Sala de Aula
              </h2>
              <p className="mb-6 text-sm leading-relaxed text-neutral-400">
                Sua conta ainda não está vinculada. Conecte para importar turmas, alunos e distribuir
                avaliações automaticamente.
              </p>
              <Button type="button" variant="secondary" onClick={loginWithGoogle}>
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

        {status === "ready" && courses.length === 0 && (
          <GlassCard data-animate className="max-w-lg p-6 text-sm text-neutral-400">
            Nenhuma turma ativa encontrada no seu Google Sala de Aula.
          </GlassCard>
        )}

        {status === "ready" && courses.length > 0 && (
          <div className="space-y-3">
            {courses.map((course) => {
              const importState = importStates[course.id]?.state ?? "idle";
              const students = importStates[course.id]?.students;
              return (
                <GlassCard
                  key={course.id}
                  data-animate
                  className="flex items-center justify-between gap-4 p-5"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-500/10 text-orange-400">
                      <UsersIcon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm text-white">{course.name}</p>
                      <p className="text-xs text-neutral-500">
                        {[course.section, course.room].filter(Boolean).join(" · ") || "Google Sala de Aula"}
                      </p>
                    </div>
                  </div>

                  {importState === "done" ? (
                    <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                      <CheckCircleIcon className="h-4 w-4" />
                      Importada · {students} alunos
                    </span>
                  ) : (
                    <button
                      onClick={() => handleImport(course)}
                      disabled={importState === "importing"}
                      className="shrink-0 rounded-full bg-white px-4 py-2 text-xs font-medium text-black transition-colors hover:bg-neutral-200 disabled:opacity-50"
                    >
                      {importState === "importing"
                        ? "Importando…"
                        : importState === "error"
                          ? "Tentar novamente"
                          : "Importar"}
                    </button>
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
