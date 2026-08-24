import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { GlassCard } from "../components/dashboard/GlassCard";
import { DownloadIcon, PlusIcon, TrashIcon } from "../components/ui/dashboardIcons";
import { CreateAssessmentModal } from "../components/assessments/CreateAssessmentModal";
import { ConfirmModal } from "../components/grading/ConfirmModal";
import { useGsapEntrance } from "../hooks/useGsapEntrance";
import {
  ApiError,
  deleteAssessment,
  downloadAssessmentPdf,
  fetchAssessments,
  type AssessmentSummary,
  type AssessmentStatus,
} from "../lib/api";

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
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [assessments, setAssessments] = useState<AssessmentSummary[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AssessmentSummary | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadErrorId, setDownloadErrorId] = useState<string | null>(null);

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

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteAssessment(deleteTarget.id);
      setDeleteTarget(null);
      load();
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : "Não foi possível excluir a avaliação.");
    } finally {
      setDeleting(false);
    }
  }

  async function handleDownloadPdf(a: AssessmentSummary) {
    setDownloadingId(a.id);
    setDownloadErrorId(null);
    try {
      await downloadAssessmentPdf(a.id, a.title);
    } catch {
      setDownloadErrorId(a.id);
    } finally {
      setDownloadingId(null);
    }
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
              <GlassCard
                key={a.id}
                data-animate
                onClick={() => navigate(`/avaliacoes/${a.id}/submissions`)}
                className="flex cursor-pointer items-center justify-between gap-3 p-5"
              >
                <div className="min-w-0">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm text-white">{a.title}</p>
                    <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] uppercase ring-1 ${STATUS_STYLE[a.status]}`}>
                      {STATUS_LABEL[a.status]}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500">
                    {a.className} · {a.questionCount} questões · {a.durationMinutes} min
                  </p>
                  {downloadErrorId === a.id && (
                    <p className="mt-1 text-xs text-red-400">Não foi possível gerar o PDF. Tente novamente.</p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownloadPdf(a);
                    }}
                    disabled={downloadingId === a.id}
                    className="rounded-full p-2 text-neutral-500 transition-colors hover:bg-orange-500/10 hover:text-orange-400 disabled:cursor-wait disabled:opacity-50"
                    aria-label="Baixar PDF da prova"
                    title="Baixar PDF"
                  >
                    <DownloadIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteError(null);
                      setDeleteTarget(a);
                    }}
                    className="rounded-full p-2 text-neutral-500 transition-colors hover:bg-red-500/10 hover:text-red-400"
                    aria-label="Excluir avaliação"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>

      {modalOpen && <CreateAssessmentModal onClose={() => setModalOpen(false)} onCreated={handleCreated} />}

      {deleteTarget && (
        <ConfirmModal
          title="Excluir avaliação"
          description={
            deleteError ??
            `Isso vai excluir permanentemente "${deleteTarget.title}", todas as entregas dos alunos e a atividade correspondente no Google Sala de Aula. Essa ação não pode ser desfeita.`
          }
          confirmLabel="Excluir"
          danger
          busy={deleting}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleConfirmDelete}
        />
      )}
    </AppShell>
  );
}
