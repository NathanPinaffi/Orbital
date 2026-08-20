import { useEffect, useState } from "react";
import { GlassCard } from "./GlassCard";
import { fetchStudentDashboard, type StudentDashboard as StudentDashboardData } from "../../lib/api";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function StudentDashboard() {
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [data, setData] = useState<StudentDashboardData | null>(null);

  useEffect(() => {
    fetchStudentDashboard()
      .then((d) => {
        setData(d);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }, []);

  if (status === "loading") {
    return (
      <div data-animate className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-2xl bg-white/[0.03]" />
        ))}
      </div>
    );
  }

  if (status === "error" || !data) {
    return (
      <GlassCard data-animate className="max-w-lg p-6 text-sm text-red-400">
        Não foi possível carregar seu dashboard agora.
      </GlassCard>
    );
  }

  return (
    <div className="space-y-8">
      <section data-animate>
        <h2 className="mb-3 font-bricolage text-lg font-light text-white">Minhas turmas</h2>
        {data.classes.length === 0 ? (
          <GlassCard className="max-w-lg p-6 text-sm text-neutral-400">
            Você ainda não está matriculado em nenhuma turma.
          </GlassCard>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.classes.map((c) => (
              <GlassCard key={c.id} className="p-5">
                <p className="truncate text-sm text-white">{c.name}</p>
                <p className="text-xs text-neutral-500">Prof. {c.teacherName}</p>
              </GlassCard>
            ))}
          </div>
        )}
      </section>

      <section data-animate>
        <h2 className="mb-3 font-bricolage text-lg font-light text-white">Provas entregues</h2>
        {data.submissions.length === 0 ? (
          <GlassCard className="max-w-lg p-6 text-sm text-neutral-400">
            Você ainda não entregou nenhuma prova.
          </GlassCard>
        ) : (
          <div className="space-y-3">
            {data.submissions.map((s) => (
              <GlassCard key={s.id} className="flex items-center justify-between gap-4 p-5">
                <div className="min-w-0">
                  <p className="truncate text-sm text-white">{s.assessmentTitle}</p>
                  <p className="text-xs text-neutral-500">
                    {s.className} · entregue em {formatDate(s.submittedAt)}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-bricolage text-lg font-light text-white">
                    {s.score != null ? s.score.toFixed(1) : "—"}
                  </p>
                  <p className="text-[10px] uppercase text-neutral-500">nota</p>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
