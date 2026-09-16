import { MathText } from "../common/MathText";
import { FunctionGraph } from "../common/FunctionGraph";
import { TikzStatic } from "../common/TikzStatic";
import { SketchPad } from "../common/SketchPad";
import type { ExamReviewQuestion } from "../../lib/api";

const TYPE_LABEL: Record<ExamReviewQuestion["type"], string> = {
  MULTIPLE_CHOICE: "Múltipla escolha",
  TRUE_FALSE: "Verdadeiro ou falso",
  ESSAY: "Dissertativa",
};

export function ExamReview({ questions }: { questions: ExamReviewQuestion[] }) {
  return (
    <div className="overflow-hidden rounded-[28px] border border-white/10 bg-[#0A0A0A] text-left">
      {questions.map((q, i) => {
        const answer = q.answer;
        return (
          <div key={q.id} className={`p-6 sm:p-8 ${i !== 0 ? "border-t border-white/10" : ""}`}>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-orange-500/10 text-[11px] text-orange-400">
                {i + 1}
              </span>
              <span className="text-[10px] uppercase text-neutral-500">{TYPE_LABEL[q.type]}</span>
              {q.type !== "ESSAY" &&
                (answer?.isCorrect ? (
                  <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-400 ring-1 ring-emerald-500/20">
                    Correta
                  </span>
                ) : (
                  <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] text-red-400 ring-1 ring-red-500/20">
                    Incorreta
                  </span>
                ))}
            </div>

            <p className="mb-5 text-sm leading-relaxed text-white">
              <MathText text={q.content} />
            </p>

            {q.graph && <FunctionGraph spec={q.graph} className="mb-5" />}
            {q.tikz && <TikzStatic svg={q.tikzSvg} source={q.tikz} className="mb-5" />}

            {q.type === "ESSAY" ? (
              <div className="space-y-3">
                <div className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2">
                  <p className="mb-1 text-[10px] uppercase text-neutral-500">Sua resposta</p>
                  {answer?.response ? (
                    <MathText text={answer.response} className="whitespace-pre-wrap text-sm text-neutral-200" />
                  ) : (
                    <span className="text-sm text-neutral-600">Sem resposta</span>
                  )}
                </div>

                {q.requiresSketch && answer?.sketchData && answer.sketchData.length > 0 && (
                  <div>
                    <p className="mb-1.5 text-xs text-neutral-400">Seu esboço</p>
                    <SketchPad value={answer.sketchData} readOnly />
                  </div>
                )}

                <div className="rounded-lg border border-orange-500/20 bg-orange-500/[0.04] px-3 py-2.5">
                  {answer?.gradedAt ? (
                    <>
                      <p className="text-xs text-orange-300">
                        Correção do professor: <span className="text-white">{answer.points}</span> / {q.maxPoints} pontos
                      </p>
                      {answer.teacherComment && (
                        <p className="mt-1.5 text-sm text-neutral-300">
                          <MathText text={answer.teacherComment} className="whitespace-pre-wrap" />
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-xs text-neutral-500">Aguardando correção do professor.</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {q.alternatives.map((alt) => {
                  const wasChosen = answer?.response === alt.id;
                  return (
                    <div
                      key={alt.id}
                      className={`flex items-center justify-between gap-3 rounded-lg border px-4 py-3 text-sm ${
                        alt.isCorrect
                          ? "border-emerald-500/40 bg-emerald-500/10 text-white"
                          : wasChosen
                            ? "border-red-500/40 bg-red-500/10 text-white"
                            : "border-white/10 bg-white/[0.02] text-neutral-400"
                      }`}
                    >
                      <MathText text={alt.content} />
                      {(wasChosen || alt.isCorrect) && (
                        <span className="shrink-0 text-[10px] uppercase text-neutral-500">
                          {wasChosen ? "Sua resposta" : "Correta"}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
