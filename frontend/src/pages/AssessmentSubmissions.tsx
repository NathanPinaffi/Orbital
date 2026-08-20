import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { Topbar } from "../components/dashboard/Topbar";
import { GlassCard } from "../components/dashboard/GlassCard";
import { ConfirmModal } from "../components/grading/ConfirmModal";
import { useGsapEntrance } from "../hooks/useGsapEntrance";
import {
  fetchAssessmentSubmissions,
  publishAllGrades,
  voidAllSubmissions,
  type AssessmentSubmissionsResponse,
  type SubmissionStatus,
} from "../lib/api";

const STATUS_LABEL: Record<SubmissionStatus, string> = {
  not_started: "Não iniciada",
  in_progress: "Em andamento",
  submitted: "Entregue",
};

const STATUS_STYLE: Record<SubmissionStatus, string> = {
  not_started: "bg-white/5 text-neutral-500 ring-white/10",
  in_progress: "bg-amber-500/10 text-amber-400 ring-amber-500/20",
  submitted: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20",
};

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function AssessmentSubmissions() {
  const { assessmentId = "" } = useParams();
  const navigate = useNavigate();
  const containerRef = useGsapEntrance<HTMLDivElement>();
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [data, setData] = useState<AssessmentSubmissionsResponse | null>(null);
  const [confirm, setConfirm] = useState<"void-all" | "publish-all" | null>(null);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  function load() {
    setStatus("loading");
    fetchAssessmentSubmissions(assessmentId)
      .then((d) => {
        setData(d);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }

  useEffect(load, [assessmentId]);

  async function handleVoidAll() {
    setBusy(true);
    try {
      await voidAllSubmissions(assessmentId);
      setConfirm(null);
      load();
    } finally {
      setBusy(false);
    }
  }

  async function handlePublishAll() {
    setBusy(true);
    try {
      const result = await publishAllGrades(assessmentId);
      setConfirm(null);
      setFeedback(
        `${result.published.length} nota(s) publicada(s)` +
          (result.skipped.length > 0 ? `, ${result.skipped.length} pulada(s)` : ""),
      );
      load();
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <div ref={containerRef}>
        <Topbar />
        <header data-animate className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link to="/avaliacoes" className="text-xs text-neutral-500 hover:text-white">
              ← Avaliações
            </Link>
            <h1 className="font-bricolage text-xl font-light tracking-tight text-white sm:text-2xl md:text-3xl">
              {data?.assessment.title ?? "Entregas"}
            </h1>
          </div>
          {status === "ready" && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setConfirm("publish-all")}
                disabled={!data?.assessment.googleCourseWorkId}
                title={!data?.assessment.googleCourseWorkId ? "Esta avaliação foi distribuída antes do suporte a publicação de notas" : undefined}
                className="rounded-full bg-white/[0.06] px-4 py-2 text-xs font-medium text-white ring-1 ring-white/10 transition hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Publicar todas as notas
              </button>
              <button
                onClick={() => setConfirm("void-all")}
                className="rounded-full bg-red-500/10 px-4 py-2 text-xs font-medium text-red-400 ring-1 ring-red-500/20 transition hover:bg-red-500/20"
              >
                Anular turma toda
              </button>
            </div>
          )}
        </header>

        {feedback && (
          <GlassCard data-animate className="mb-4 max-w-lg p-4 text-sm text-neutral-300">
            {feedback}
          </GlassCard>
        )}

        {status === "loading" && (
          <div data-animate className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-2xl bg-white/[0.03]" />
            ))}
          </div>
        )}

        {status === "error" && (
          <GlassCard data-animate className="max-w-lg p-6 text-sm text-red-400">
            Não foi possível carregar as entregas agora.
          </GlassCard>
        )}

        {status === "ready" && data && (
          <div data-animate className="space-y-2">
            {data.submissions.map((s) => (
              <GlassCard
                key={s.studentId}
                onClick={() => s.submissionId && navigate(`/avaliacoes/${assessmentId}/submissions/${s.submissionId}`)}
                className={`flex flex-wrap items-center justify-between gap-3 p-4 ${s.submissionId ? "cursor-pointer" : "opacity-60"}`}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm text-white">{s.studentName}</p>
                  <p className="text-xs text-neutral-500">Entregue em {formatDate(s.submittedAt)}</p>
                </div>
                <div className="flex items-center gap-3">
                  {s.hasUngraded && (
                    <span className="rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[10px] uppercase text-amber-400 ring-1 ring-amber-500/20">
                      não corrigida
                    </span>
                  )}
                  {s.gradePublishedAt && (
                    <span className="rounded-md bg-white/5 px-1.5 py-0.5 text-[10px] uppercase text-neutral-400 ring-1 ring-white/10">
                      nota publicada
                    </span>
                  )}
                  <span className={`rounded-md px-1.5 py-0.5 text-[10px] uppercase ring-1 ${STATUS_STYLE[s.status]}`}>
                    {STATUS_LABEL[s.status]}
                  </span>
                  <span className="w-12 text-right font-bricolage text-sm text-white">
                    {s.score != null ? s.score.toFixed(1) : "—"}
                  </span>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>

      {confirm === "void-all" && (
        <ConfirmModal
          title="Anular turma toda"
          description="Isso vai apagar permanentemente as entregas de todos os alunos desta avaliação. Eles poderão refazer a prova do zero. Essa ação não pode ser desfeita."
          confirmLabel="Anular todas"
          busy={busy}
          onCancel={() => setConfirm(null)}
          onConfirm={handleVoidAll}
        />
      )}

      {confirm === "publish-all" && (
        <ConfirmModal
          title="Publicar todas as notas"
          description="Isso vai enviar a nota de cada aluno corrigido diretamente para o Google Sala de Aula, sobrescrevendo qualquer nota já publicada lá."
          confirmLabel="Publicar"
          busy={busy}
          onCancel={() => setConfirm(null)}
          onConfirm={handlePublishAll}
        />
      )}
    </AppShell>
  );
}
