import { useEffect, useState } from "react";
import { AppShell } from "../components/layout/AppShell";
import { Topbar } from "../components/dashboard/Topbar";
import { GlassCard } from "../components/dashboard/GlassCard";
import { useGsapEntrance } from "../hooks/useGsapEntrance";
import { fetchStudentDashboard, type StudentDashboardClass } from "../lib/api";

export default function MyClasses() {
  const containerRef = useGsapEntrance<HTMLDivElement>();
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [classes, setClasses] = useState<StudentDashboardClass[]>([]);

  useEffect(() => {
    fetchStudentDashboard()
      .then((d) => {
        setClasses(d.classes);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }, []);

  return (
    <AppShell>
      <div ref={containerRef}>
        <Topbar />
        <header data-animate className="mb-6">
          <h1 className="font-bricolage text-xl font-light tracking-tight text-white sm:text-2xl md:text-3xl">
            Minhas turmas
          </h1>
          <p className="text-sm text-neutral-500">Turmas em que você está matriculado.</p>
        </header>

        {status === "loading" && (
          <div data-animate className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-2xl bg-white/[0.03]" />
            ))}
          </div>
        )}

        {status === "error" && (
          <GlassCard data-animate className="max-w-lg p-6 text-sm text-red-400">
            Não foi possível carregar suas turmas agora.
          </GlassCard>
        )}

        {status === "ready" && classes.length === 0 && (
          <GlassCard data-animate className="max-w-lg p-6 text-sm text-neutral-400">
            Você ainda não está matriculado em nenhuma turma.
          </GlassCard>
        )}

        {status === "ready" && classes.length > 0 && (
          <div data-animate className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {classes.map((c) => (
              <GlassCard key={c.id} className="p-5">
                <p className="truncate text-sm text-white">{c.name}</p>
                <p className="text-xs text-neutral-500">Prof. {c.teacherName}</p>
              </GlassCard>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
