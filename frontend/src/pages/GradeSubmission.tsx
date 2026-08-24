import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { Topbar } from "../components/dashboard/Topbar";
import { GlassCard } from "../components/dashboard/GlassCard";
import { ConfirmModal } from "../components/grading/ConfirmModal";
import { EssayGrader } from "../components/grading/EssayGrader";
import { useGsapEntrance } from "../hooks/useGsapEntrance";
import { initials } from "../hooks/useMe";
import {
  fetchSubmissionDetail,
  gradeAnswer,
  publishGrade,
  voidSubmission,
  type SubmissionDetail,
} from "../lib/api";

export default function GradeSubmission() {
  const { assessmentId = "", submissionId = "" } = useParams();
  const navigate = useNavigate();
  const containerRef = useGsapEntrance<HTMLDivElement>();
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [data, setData] = useState<SubmissionDetail | null>(null);
  const [confirm, setConfirm] = useState<"void" | "publish" | null>(null);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  function load() {
    setStatus("loading");
    fetchSubmissionDetail(assessmentId, submissionId)
      .then((d) => {
        setData(d);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }

  useEffect(load, [assessmentId, submissionId]);

  async function handleGrade(questionId: string, answerId: string, points: number, teacherComment: string) {
    await gradeAnswer(assessmentId, submissionId, answerId, { points, teacherComment: teacherComment || undefined });
    load();
    return questionId;
  }

  async function handleVoid() {
    setBusy(true);
    try {
      await voidSubmission(assessmentId, submissionId);
      navigate(`/avaliacoes/${assessmentId}/submissions`);
    } finally {
      setBusy(false);
    }
  }

  async function handlePublish() {
    setBusy(true);
    try {
      await publishGrade(assessmentId, submissionId);
      setConfirm(null);
      setFeedback("Nota publicada no Google Sala de Aula.");
      load();
    } finally {
      setBusy(false);
    }
  }

  const hasUngraded = data?.questions.some((q) => q.type === "ESSAY" && !q.answer?.gradedAt) ?? false;

  return (
    <AppShell>
      <div ref={containerRef}>
        <Topbar />

        {status === "loading" && (
          <div data-animate className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl bg-white/[0.03]" />
            ))}
          </div>
        )}

        {status === "error" && (
          <GlassCard data-animate className="max-w-lg p-6 text-sm text-red-400">
            Não foi possível carregar esta entrega agora.
          </GlassCard>
        )}

        {status === "ready" && data && (
          <>
            <header data-animate className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <Link to={`/avaliacoes/${assessmentId}/submissions`} className="text-xs text-neutral-500 hover:text-white">
                  ← Entregas
                </Link>
                <div className="mt-1 flex items-center gap-3">
                  {data.submission.avatarUrl ? (
                    <img
                      src={data.submission.avatarUrl}
                      alt={data.submission.studentName}
                      className="h-9 w-9 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-purple-700 text-xs font-medium text-white">
                      {initials(data.submission.studentName)}
                    </div>
                  )}
                  <h1 className="font-bricolage text-xl font-light tracking-tight text-white sm:text-2xl">
                    {data.submission.studentName}
                  </h1>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <p className="font-bricolage text-lg font-light text-white">
                    Nota: {data.submission.score != null ? data.submission.score.toFixed(1) : "—"}
                  </p>
                  {hasUngraded && (
                    <span className="rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[10px] uppercase text-amber-400 ring-1 ring-amber-500/20">
                      correção parcial
                    </span>
                  )}
                  {data.submission.gradePublishedAt && (
                    <span className="rounded-md bg-white/5 px-1.5 py-0.5 text-[10px] uppercase text-neutral-400 ring-1 ring-white/10">
                      nota publicada
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setConfirm("publish")}
                  className="rounded-full bg-orange-500/10 px-4 py-2 text-xs font-medium text-orange-400 ring-1 ring-orange-500/20 transition hover:bg-orange-500/20"
                >
                  Publicar nota
                </button>
                <button
                  onClick={() => setConfirm("void")}
                  className="rounded-full bg-red-500/10 px-4 py-2 text-xs font-medium text-red-400 ring-1 ring-red-500/20 transition hover:bg-red-500/20"
                >
                  Anular esta prova
                </button>
              </div>
            </header>

            {feedback && (
              <GlassCard data-animate className="mb-4 max-w-lg p-4 text-sm text-neutral-300">
                {feedback}
              </GlassCard>
            )}

            <div data-animate className="space-y-3">
              {data.questions.map((q, i) => (
                <GlassCard key={q.questionId} className="p-5">
                  <p className="mb-2 text-xs text-neutral-500">Questão {i + 1} · {q.maxPoints} pt(s)</p>
                  <p className="mb-3 text-sm text-white">{q.content}</p>

                  {q.type === "ESSAY" ? (
                    <EssayGrader question={q} onSave={(points, comment) => handleGrade(q.questionId, q.answer!.id, points, comment)} />
                  ) : (
                    <div className="space-y-1.5">
                      {q.alternatives.map((alt) => {
                        const chosen = alt.id === q.answer?.response;
                        return (
                          <div
                            key={alt.id}
                            className={`rounded-lg px-3 py-2 text-sm ring-1 ${
                              alt.isCorrect
                                ? "bg-emerald-500/10 text-emerald-300 ring-emerald-500/20"
                                : chosen
                                  ? "bg-red-500/10 text-red-300 ring-red-500/20"
                                  : "bg-white/[0.02] text-neutral-400 ring-white/5"
                            }`}
                          >
                            {alt.content} {chosen && <span className="text-[10px] uppercase opacity-70">(resposta do aluno)</span>}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </GlassCard>
              ))}
            </div>
          </>
        )}
      </div>

      {confirm === "void" && (
        <ConfirmModal
          title="Anular esta prova"
          description="Isso vai apagar permanentemente a tentativa deste aluno. Ele poderá refazer a prova do zero. Essa ação não pode ser desfeita."
          confirmLabel="Anular"
          busy={busy}
          onCancel={() => setConfirm(null)}
          onConfirm={handleVoid}
        />
      )}

      {confirm === "publish" && (
        <ConfirmModal
          title="Publicar nota"
          description="Isso vai enviar a nota deste aluno diretamente para o Google Sala de Aula, sobrescrevendo qualquer nota já publicada lá."
          confirmLabel="Publicar"
          busy={busy}
          onCancel={() => setConfirm(null)}
          onConfirm={handlePublish}
        />
      )}
    </AppShell>
  );
}
