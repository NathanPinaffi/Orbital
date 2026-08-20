import { useEffect, useMemo, useRef, useState } from "react";
import { ClockIcon } from "../ui/dashboardIcons";
import type { ExamQuestion } from "../../lib/api";

function formatTime(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const s = Math.floor(totalSeconds % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

const TYPE_LABEL: Record<ExamQuestion["type"], string> = {
  MULTIPLE_CHOICE: "Múltipla escolha",
  TRUE_FALSE: "Verdadeiro ou falso",
  ESSAY: "Dissertativa",
};

export function ExamRunner({
  title,
  questions,
  initialRemainingSeconds,
  onSubmit,
}: {
  title: string;
  questions: ExamQuestion[];
  initialRemainingSeconds: number;
  onSubmit: (answers: Record<string, string>) => void;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [remaining, setRemaining] = useState(initialRemainingSeconds);
  const deadlineRef = useRef(Date.now() + initialRemainingSeconds * 1000);
  const submittedRef = useRef(false);
  const questionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    const interval = setInterval(() => {
      const secondsLeft = Math.max(0, Math.round((deadlineRef.current - Date.now()) / 1000));
      setRemaining(secondsLeft);
      if (secondsLeft === 0 && !submittedRef.current) {
        submittedRef.current = true;
        clearInterval(interval);
        onSubmit(answers);
      }
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const answeredCount = Object.keys(answers).length;
  const urgent = remaining <= 60;

  function setAnswer(questionId: string, value: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  function scrollToQuestion(id: string) {
    questionRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function handleDeliver() {
    if (submittedRef.current) return;
    if (!window.confirm(`Você respondeu ${answeredCount} de ${questions.length} questões. Entregar a prova agora?`)) {
      return;
    }
    submittedRef.current = true;
    onSubmit(answers);
  }

  const overviewItems = useMemo(
    () => questions.map((q, i) => ({ id: q.id, index: i + 1, answered: Boolean(answers[q.id]) })),
    [questions, answers],
  );

  return (
    <div className="space-y-4">
      <div className="sticky top-4 z-20 flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#0A0A0A]/95 p-4 backdrop-blur-md">
        <div className="min-w-0">
          <p className="truncate text-sm text-white">{title}</p>
          <p className="text-xs text-neutral-500">
            {answeredCount}/{questions.length} respondidas
          </p>
        </div>
        <div
          className={`flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-sm tabular-nums ring-1 ${
            urgent ? "bg-red-500/10 text-red-400 ring-red-500/30" : "bg-orange-500/10 text-orange-400 ring-orange-500/20"
          }`}
        >
          <ClockIcon className="h-4 w-4" />
          {formatTime(remaining)}
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 rounded-2xl border border-white/5 bg-white/[0.02] p-3">
        {overviewItems.map((item) => (
          <button
            key={item.id}
            onClick={() => scrollToQuestion(item.id)}
            className={`flex h-7 w-7 items-center justify-center rounded-md text-[11px] transition-colors ${
              item.answered
                ? "bg-orange-500/20 text-orange-300 ring-1 ring-orange-500/40"
                : "bg-white/5 text-neutral-500 ring-1 ring-white/10"
            }`}
          >
            {item.index}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-[28px] border border-white/10 bg-[#0A0A0A]">
        {questions.map((q, i) => (
          <div
            key={q.id}
            ref={(el) => {
              questionRefs.current[q.id] = el;
            }}
            className={`p-6 sm:p-8 ${i !== 0 ? "border-t border-white/10" : ""}`}
          >
            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-orange-500/10 text-[11px] text-orange-400">
                {i + 1}
              </span>
              <span className="text-[10px] uppercase text-neutral-500">{TYPE_LABEL[q.type]}</span>
            </div>

            <p className="mb-5 text-sm leading-relaxed text-white">{q.content}</p>

            {q.type === "ESSAY" ? (
              <textarea
                className="min-h-32 w-full resize-y rounded-lg border border-white/10 bg-[#050505] px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:border-orange-500/50 focus:outline-none"
                placeholder="Digite sua resposta..."
                value={answers[q.id] ?? ""}
                onChange={(e) => setAnswer(q.id, e.target.value)}
              />
            ) : (
              <div className="space-y-2">
                {q.alternatives.map((alt) => (
                  <label
                    key={alt.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-sm transition-colors ${
                      answers[q.id] === alt.id
                        ? "border-orange-500/50 bg-orange-500/10 text-white"
                        : "border-white/10 bg-white/[0.02] text-neutral-300 hover:bg-white/[0.05]"
                    }`}
                  >
                    <input
                      type="radio"
                      name={q.id}
                      checked={answers[q.id] === alt.id}
                      onChange={() => setAnswer(q.id, alt.id)}
                      className="h-4 w-4 border-white/20 bg-transparent text-orange-500 focus:ring-0"
                    />
                    {alt.content}
                  </label>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={handleDeliver}
        className="w-full rounded-full bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 py-3.5 text-sm font-medium text-white shadow-[0_4px_15px_rgba(249,115,22,0.4)] transition-transform hover:scale-[1.01]"
      >
        Entregar prova
      </button>
    </div>
  );
}
