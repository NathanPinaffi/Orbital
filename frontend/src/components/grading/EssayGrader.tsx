import { useState } from "react";
import type { GradingQuestion } from "../../lib/api";

export function EssayGrader({
  question,
  onSave,
}: {
  question: GradingQuestion;
  onSave: (points: number, teacherComment: string) => Promise<unknown>;
}) {
  const answer = question.answer;
  const [points, setPoints] = useState(answer?.points?.toString() ?? "");
  const [comment, setComment] = useState(answer?.teacherComment ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const numericPoints = Number(points);
  const invalid = points === "" || Number.isNaN(numericPoints) || numericPoints < 0 || numericPoints > question.maxPoints;

  async function handleSave() {
    if (invalid || !answer) return;
    setSaving(true);
    setError(null);
    try {
      await onSave(numericPoints, comment);
    } catch {
      setError("Não foi possível salvar a correção.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="rounded-lg bg-white/[0.02] px-3 py-2 text-sm text-neutral-300 ring-1 ring-white/5">
        {answer?.response || <span className="text-neutral-600">Sem resposta</span>}
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs text-neutral-400">Pontos (máx. {question.maxPoints})</label>
          <input
            type="number"
            min={0}
            max={question.maxPoints}
            step={0.1}
            value={points}
            onChange={(e) => setPoints(e.target.value)}
            className="w-28 rounded-lg border border-white/10 bg-[#050505] px-3 py-2 text-sm text-white focus:border-orange-500/50 focus:outline-none"
          />
        </div>
        <div className="min-w-0 flex-1">
          <label className="mb-1 block text-xs text-neutral-400">Comentário (visível ao aluno)</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-white/10 bg-[#050505] px-3 py-2 text-sm text-white focus:border-orange-500/50 focus:outline-none"
          />
        </div>
        <button
          onClick={handleSave}
          disabled={invalid || saving}
          className="rounded-full bg-white/[0.06] px-4 py-2 text-xs font-medium text-white ring-1 ring-white/10 transition hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {saving ? "Salvando…" : answer?.gradedAt ? "Atualizar" : "Salvar correção"}
        </button>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
