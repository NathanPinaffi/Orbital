import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { Topbar } from "../components/dashboard/Topbar";
import { GlassCard } from "../components/dashboard/GlassCard";
import { useGsapEntrance } from "../hooks/useGsapEntrance";
import { fetchClassRanking, type ClassRanking as ClassRankingData } from "../lib/api";
import { initials } from "../hooks/useMe";

const RANK_STYLE: Record<number, string> = {
  1: "bg-gradient-to-br from-yellow-300 to-orange-500 text-[#2c1306]",
  2: "bg-white/20 text-white",
  3: "bg-orange-900/40 text-orange-200",
};

export default function ClassRanking() {
  const { classId = "" } = useParams();
  const containerRef = useGsapEntrance<HTMLDivElement>();
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [data, setData] = useState<ClassRankingData | null>(null);

  useEffect(() => {
    fetchClassRanking(classId)
      .then((d) => {
        setData(d);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }, [classId]);

  return (
    <AppShell>
      <div ref={containerRef}>
        <Topbar />
        <header data-animate className="mb-6">
          <Link to="/turmas" className="text-xs text-neutral-500 hover:text-white">
            ← Turmas
          </Link>
          <h1 className="font-bricolage text-xl font-light tracking-tight text-white sm:text-2xl md:text-3xl">
            {data?.className ?? "Ranking"}
          </h1>
          <p className="text-sm text-neutral-500">Alunos ordenados pela média das provas entregues e corrigidas.</p>
        </header>

        {status === "loading" && (
          <div data-animate className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-2xl bg-white/[0.03]" />
            ))}
          </div>
        )}

        {status === "error" && (
          <GlassCard data-animate className="max-w-lg p-6 text-sm text-red-400">
            Não foi possível carregar o ranking agora.
          </GlassCard>
        )}

        {status === "ready" && data && data.ranking.length === 0 && (
          <GlassCard data-animate className="max-w-lg p-6 text-sm text-neutral-400">
            Nenhum aluno matriculado nesta turma.
          </GlassCard>
        )}

        {status === "ready" && data && data.ranking.length > 0 && (
          <div data-animate className="space-y-2">
            {data.ranking.map((entry) => (
              <GlassCard key={entry.studentId} className="flex items-center gap-4 p-4">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
                    RANK_STYLE[entry.rank] ?? "bg-white/5 text-neutral-400"
                  }`}
                >
                  {entry.rank}
                </div>
                {entry.avatarUrl ? (
                  <img src={entry.avatarUrl} alt={entry.studentName} className="h-9 w-9 shrink-0 rounded-full object-cover" />
                ) : (
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-purple-700 text-xs font-medium text-white">
                    {initials(entry.studentName)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-white">{entry.studentName}</p>
                  <p className="text-xs text-neutral-500">
                    {entry.submissionsCount} prova(s) considerada(s)
                  </p>
                </div>
                <p className="shrink-0 font-bricolage text-lg font-light text-white">
                  {entry.average != null ? entry.average.toFixed(1) : "—"}
                </p>
              </GlassCard>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
