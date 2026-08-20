import { useEffect, useState } from "react";
import { AppShell } from "../components/layout/AppShell";
import { GlassCard } from "../components/dashboard/GlassCard";
import { PlusIcon } from "../components/ui/dashboardIcons";
import { CreateAssessmentModal } from "../components/assessments/CreateAssessmentModal";
import { useGsapEntrance } from "../hooks/useGsapEntrance";
import { fetchAssessments, type AssessmentSummary, type AssessmentStatus } from "../lib/api";

const STATUS_LABEL: Record<AssessmentStatus, string> = {
  DRAFT: "Rascunho",
  PUBLISHED: "Publicada",
  CLOSED: "Encerrada",
};

const STATUS_STYLE: Record<AssessmentStatus, string> = {
  DRAFT: "bg-white/5 text-neutral-300 ring-white/10",
  PUBLISHED: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20",
  CLOSED: "bg-white/5 text-neutral-500 ring-white/10",
};

export default function Assessments() {
  const containerRef = useGsapEntrance<HTMLDivElement>();
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [assessments, setAssessments] = useState<AssessmentSummary[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  function load() {
    setStatus("loading");
    fetchAssessments()
      .then((data) => {
        setAssessments(data);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }

  useEffect(load, []);

  function handleCreated() {
    setModalOpen(false);
    load();
  }

  return (
    <AppShell>
      <div ref={containerRef}>
        <header data-animate className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-bricolage text-xl font-light tracking-tight text-white sm:text-2xl md:text-3xl">
              Avaliações
            </h1>
            <br />
            <p className="text-sm text-neutral-500">Monte provas a partir do banco de questões e distribua no Classroom.</p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center justify-center gap-2 rounded-full bg-gradient-to-t from-yellow-200 via-orange-400 to-orange-500 px-4 py-2.5 text-xs font-medium text-[#2c1306] shadow-[0_0_25px_-5px_rgba(249,115,22,0.6)] ring-1 ring-inset ring-white/40 transition-transform hover:scale-105"
          >
            <PlusIcon className="h-3.5 w-3.5" />
            Nova avaliação
          </button>
        </header>

        {status === "loading" && (
          <div data-animate className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-2xl bg-white/[0.03]" />
            ))}
          </div>
        )}

        {status === "error" && (
          <GlassCard data-animate className="max-w-lg p-6 text-sm text-red-400">
            Não foi possível carregar as avaliações agora.
          </GlassCard>
        )}

        {status === "ready" && assessments.length === 0 && (
          <GlassCard data-animate className="max-w-lg p-6 text-sm text-neutral-400">
            Nenhuma avaliação criada ainda. Clique em "Nova avaliação" para começar.
          </GlassCard>
        )}

        {status === "ready" && assessments.length > 0 && (
          <div className="space-y-3">
            {assessments.map((a) => (
              <GlassCard key={a.id} data-animate className="p-5">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <p className="truncate text-sm text-white">{a.title}</p>
                  <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] uppercase ring-1 ${STATUS_STYLE[a.status]}`}>
                    {STATUS_LABEL[a.status]}
                  </span>
                </div>
                <p className="text-xs text-neutral-500">
                  {a.className} · {a.questionCount} questões · {a.durationMinutes} min
                </p>
              </GlassCard>
            ))}
          </div>
        )}
      </div>

      {modalOpen && <CreateAssessmentModal onClose={() => setModalOpen(false)} onCreated={handleCreated} />}
    </AppShell>
  );
}
