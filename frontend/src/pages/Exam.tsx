import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ExamShell } from "../components/exam/ExamShell";
import { ExamWarning } from "../components/exam/ExamWarning";
import { ExamRunner } from "../components/exam/ExamRunner";
import { CheckCircleIcon } from "../components/ui/dashboardIcons";
import { HappyPlanet } from "../components/exam/HappyPlanet";
import { ApiError, fetchExam, startExam, submitExam, type ExamState } from "../lib/api";

export default function Exam() {
  const { id } = useParams<{ id: string }>();
  const [state, setState] = useState<ExamState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [finalScore, setFinalScore] = useState<number | null | undefined>(undefined);

  function load() {
    if (!id) return;
    fetchExam(id)
      .then(setState)
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : "Não foi possível carregar a prova.");
      });
  }

  useEffect(load, [id]);

  async function handleStart() {
    if (!id) return;
    setStarting(true);
    try {
      await startExam(id);
      load();
    } catch {
      setError("Não foi possível iniciar a prova. Tente novamente.");
    } finally {
      setStarting(false);
    }
  }

  async function handleSubmit(answers: Record<string, string>) {
    if (!id) return;
    try {
      const result = await submitExam(
        id,
        Object.entries(answers).map(([questionId, response]) => ({ questionId, response })),
      );
      setFinalScore(result.score);
      setState({ status: "submitted", score: result.score });
    } catch {
      setError("Não foi possível enviar a prova. Tente novamente.");
    }
  }

  return (
    <ExamShell>
      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-center text-sm text-red-400">
          {error}
        </div>
      )}

      {!error && !state && (
        <div className="space-y-3">
          {[0, 1].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl bg-white/[0.03]" />
          ))}
        </div>
      )}

      {!error && state?.status === "not_started" && (
        <ExamWarning
          title={state.title}
          durationMinutes={state.durationMinutes}
          questionCount={state.questionCount}
          onStart={handleStart}
          starting={starting}
        />
      )}

      {!error && state?.status === "in_progress" && (
        <ExamRunner
          title={state.title}
          questions={state.questions}
          initialRemainingSeconds={state.remainingSeconds}
          onSubmit={handleSubmit}
        />
      )}

      {!error && state?.status === "submitted" && (
        <div className="rounded-[28px] border border-white/10 bg-[#0A0A0A] p-10 text-center">
          <HappyPlanet className="mx-auto mb-4 h-28 w-28" />
          <h1 className="font-bricolage mb-2 text-2xl font-light tracking-tight text-white">Prova enviada!</h1>
          {(finalScore ?? state.score) != null ? (
            <p className="text-sm text-neutral-400">
              Nota: <span className="text-white">{(finalScore ?? state.score)!.toFixed(1)}</span> / 10
            </p>
          ) : (
            <p className="text-sm text-neutral-400">Sua prova será corrigida em breve.</p>
          )}
        </div>
      )}
    </ExamShell>
  );
}
