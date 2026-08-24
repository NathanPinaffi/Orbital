import { useState, type FormEvent } from "react";
import { PlusIcon, TrashIcon, XIcon } from "../ui/dashboardIcons";
import { MathText } from "../common/MathText";
import { FunctionGraph } from "../common/FunctionGraph";
import type { BloomLevel, Difficulty, Question, QuestionInput, QuestionType } from "../../lib/api";

const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  EASY: "Fácil",
  MEDIUM: "Médio",
  HARD: "Difícil",
};

const BLOOM_LABEL: Record<BloomLevel, string> = {
  REMEMBER: "Lembrar",
  UNDERSTAND: "Compreender",
  APPLY: "Aplicar",
  ANALYZE: "Analisar",
  EVALUATE: "Avaliar",
  CREATE: "Criar",
};

const TYPE_LABEL: Record<QuestionType, string> = {
  MULTIPLE_CHOICE: "Múltipla escolha",
  TRUE_FALSE: "Verdadeiro ou falso",
  ESSAY: "Dissertativa",
};

const inputClass =
  "w-full rounded-lg border border-white/10 bg-[#050505] px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:border-orange-500/50 focus:outline-none";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs text-neutral-400">{label}</label>
      {children}
    </div>
  );
}

export function QuestionFormModal({
  question,
  bankId,
  subjectOptions,
  topicOptions,
  onClose,
  onSubmit,
}: {
  question?: Question;
  bankId: string;
  subjectOptions: string[];
  topicOptions: string[];
  onClose: () => void;
  onSubmit: (input: QuestionInput) => Promise<void>;
}) {
  const [subject, setSubject] = useState(question?.subject ?? "");
  const [topic, setTopic] = useState(question?.topic ?? "");
  const [content, setContent] = useState(question?.content ?? "");
  const [difficulty, setDifficulty] = useState<Difficulty>(question?.difficulty ?? "MEDIUM");
  const [bloomLevel, setBloomLevel] = useState<BloomLevel>(question?.bloomLevel ?? "UNDERSTAND");
  const [type, setType] = useState<QuestionType>(question?.type ?? "MULTIPLE_CHOICE");
  const [alternatives, setAlternatives] = useState<{ content: string; isCorrect: boolean }[]>(
    question?.type === "MULTIPLE_CHOICE" && question.alternatives.length
      ? question.alternatives.map((a) => ({ content: a.content, isCorrect: a.isCorrect }))
      : [
          { content: "", isCorrect: true },
          { content: "", isCorrect: false },
        ],
  );
  const [correctAnswer, setCorrectAnswer] = useState(
    question?.type === "TRUE_FALSE" ? question.alternatives.find((a) => a.isCorrect)?.content === "Verdadeiro" : true,
  );
  const [graphEnabled, setGraphEnabled] = useState(question?.graph != null);
  const [graphExpression, setGraphExpression] = useState(question?.graph?.expression ?? "x^2");
  const [graphXMin, setGraphXMin] = useState(question?.graph?.xMin ?? -10);
  const [graphXMax, setGraphXMax] = useState(question?.graph?.xMax ?? 10);
  const [graphYMin, setGraphYMin] = useState(question?.graph?.yMin ?? -10);
  const [graphYMax, setGraphYMax] = useState(question?.graph?.yMax ?? 10);
  const [requiresSketch, setRequiresSketch] = useState(question?.requiresSketch ?? false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateAlternative(index: number, patch: Partial<{ content: string; isCorrect: boolean }>) {
    setAlternatives((prev) =>
      prev.map((a, i) =>
        i === index
          ? { ...a, ...patch }
          : patch.isCorrect
            ? { ...a, isCorrect: false }
            : a,
      ),
    );
  }

  function addAlternative() {
    setAlternatives((prev) => [...prev, { content: "", isCorrect: false }]);
  }

  function removeAlternative(index: number) {
    setAlternatives((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (graphEnabled) {
      if (!graphExpression.trim()) {
        setError("Digite a expressão do gráfico ou desative essa opção.");
        return;
      }
      if (graphXMax <= graphXMin) {
        setError("O máximo de X do gráfico deve ser maior que o mínimo.");
        return;
      }
      if (graphYMax <= graphYMin) {
        setError("O máximo de Y do gráfico deve ser maior que o mínimo.");
        return;
      }
    }

    const graph = graphEnabled
      ? { expression: graphExpression.trim(), xMin: graphXMin, xMax: graphXMax, yMin: graphYMin, yMax: graphYMax }
      : null;

    const common = {
      bankId,
      subject,
      topic,
      content,
      difficulty,
      bloomLevel,
      graph,
      requiresSketch: type === "ESSAY" && requiresSketch,
    };
    let input: QuestionInput;

    if (type === "MULTIPLE_CHOICE") {
      const filled = alternatives.filter((a) => a.content.trim().length > 0);
      if (filled.length < 2) {
        setError("Adicione pelo menos 2 alternativas preenchidas.");
        return;
      }
      if (!filled.some((a) => a.isCorrect)) {
        setError("Marque uma alternativa como correta.");
        return;
      }
      input = { type, ...common, alternatives: filled };
    } else if (type === "TRUE_FALSE") {
      input = { type, ...common, correctAnswer: correctAnswer ?? true };
    } else {
      input = { type, ...common };
    }

    setSubmitting(true);
    try {
      await onSubmit(input);
    } catch {
      setError("Não foi possível salvar a questão. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 px-3 py-6 backdrop-blur-sm sm:px-4 sm:py-8">
      <div className="electric-card relative w-full max-w-xl overflow-hidden rounded-[24px] bg-neutral-900 p-[2px] sm:rounded-[28px]">
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-yellow-300 via-orange-500 to-transparent opacity-60" />
        <div className="relative z-10 max-h-[85vh] overflow-y-auto rounded-[22px] bg-[#0A0A0A] p-5 sm:rounded-[26px] sm:p-8">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-bricolage text-xl font-light tracking-tight text-white">
              {question ? "Editar questão" : "Nova questão"}
            </h2>
            <button onClick={onClose} className="text-neutral-500 transition-colors hover:text-white" aria-label="Fechar">
              <XIcon className="h-5 w-5" />
            </button>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Disciplina">
                <input
                  className={inputClass}
                  list="subject-options"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Ex: História"
                  required
                />
                <datalist id="subject-options">
                  {subjectOptions.map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
              </Field>
              <Field label="Matéria">
                <input
                  className={inputClass}
                  list="topic-options"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Ex: Revolução Francesa"
                  required
                />
                <datalist id="topic-options">
                  {topicOptions.map((t) => (
                    <option key={t} value={t} />
                  ))}
                </datalist>
              </Field>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Dificuldade">
                <select
                  className={inputClass}
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                >
                  {Object.entries(DIFFICULTY_LABEL).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Nível cognitivo (Bloom)">
                <select
                  className={inputClass}
                  value={bloomLevel}
                  onChange={(e) => setBloomLevel(e.target.value as BloomLevel)}
                >
                  {Object.entries(BLOOM_LABEL).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="Tipo de questão">
              <select
                className={inputClass}
                value={type}
                onChange={(e) => setType(e.target.value as QuestionType)}
              >
                {Object.entries(TYPE_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Enunciado">
              <textarea
                className={`${inputClass} min-h-24 resize-y`}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Digite o enunciado da questão... Use $ x^2 $ para fórmulas em linha ou $$ x^2 $$ para fórmulas em bloco."
                required
              />
              <p className="mt-1 text-[11px] text-neutral-600">
                Use LaTeX entre <code className="text-neutral-500">$...$</code> (em linha) ou{" "}
                <code className="text-neutral-500">$$...$$</code> (em bloco) para escrever fórmulas matemáticas.
              </p>
              {content.includes("$") && (
                <div className="mt-2 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-neutral-200">
                  <MathText text={content} />
                </div>
              )}
            </Field>

            <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
              <label className="flex items-center gap-2 text-xs text-neutral-300">
                <input
                  type="checkbox"
                  checked={graphEnabled}
                  onChange={(e) => setGraphEnabled(e.target.checked)}
                  className="h-3.5 w-3.5 shrink-0 rounded border-white/20 bg-transparent accent-orange-500 text-orange-500 focus:ring-0"
                />
                Exibir gráfico de referência para o aluno (ex: análise de f(x))
              </label>

              {graphEnabled && (
                <div className="mt-3 space-y-3">
                  <Field label="Expressão (em função de x)">
                    <input
                      className={inputClass}
                      value={graphExpression}
                      onChange={(e) => setGraphExpression(e.target.value)}
                      placeholder="Ex: x^2 - 3*x + 2, sin(x), sqrt(x)"
                    />
                  </Field>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <Field label="X mín">
                      <input
                        type="number"
                        className={inputClass}
                        value={graphXMin}
                        onChange={(e) => setGraphXMin(Number(e.target.value))}
                      />
                    </Field>
                    <Field label="X máx">
                      <input
                        type="number"
                        className={inputClass}
                        value={graphXMax}
                        onChange={(e) => setGraphXMax(Number(e.target.value))}
                      />
                    </Field>
                    <Field label="Y mín">
                      <input
                        type="number"
                        className={inputClass}
                        value={graphYMin}
                        onChange={(e) => setGraphYMin(Number(e.target.value))}
                      />
                    </Field>
                    <Field label="Y máx">
                      <input
                        type="number"
                        className={inputClass}
                        value={graphYMax}
                        onChange={(e) => setGraphYMax(Number(e.target.value))}
                      />
                    </Field>
                  </div>

                  {graphExpression.trim() && graphXMax > graphXMin && graphYMax > graphYMin && (
                    <FunctionGraph
                      spec={{ expression: graphExpression, xMin: graphXMin, xMax: graphXMax, yMin: graphYMin, yMax: graphYMax }}
                    />
                  )}
                </div>
              )}
            </div>

            {type === "ESSAY" && (
              <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
                <label className="flex items-center gap-2 text-xs text-neutral-300">
                  <input
                    type="checkbox"
                    checked={requiresSketch}
                    onChange={(e) => setRequiresSketch(e.target.checked)}
                    className="h-3.5 w-3.5 shrink-0 rounded border-white/20 bg-transparent accent-orange-500 text-orange-500 focus:ring-0"
                  />
                  Pedir que o aluno esboce um gráfico na resposta
                </label>
                {requiresSketch && (
                  <p className="mt-1.5 text-[11px] text-neutral-600">
                    Uma área de desenho aparecerá abaixo da resposta do aluno durante a prova.
                  </p>
                )}
              </div>
            )}

            {type === "MULTIPLE_CHOICE" && (
              <div>
                <label className="mb-1.5 block text-xs text-neutral-400">Alternativas</label>
                <div className="space-y-2">
                  {alternatives.map((alt, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="correct-alternative"
                        checked={alt.isCorrect}
                        onChange={() => updateAlternative(i, { isCorrect: true })}
                        className="h-4 w-4 shrink-0 border-white/20 bg-transparent accent-orange-500 text-orange-500 focus:ring-0"
                      />
                      <div className="min-w-0 flex-1">
                        <input
                          className={inputClass}
                          value={alt.content}
                          onChange={(e) => updateAlternative(i, { content: e.target.value })}
                          placeholder={`Alternativa ${i + 1}`}
                        />
                        {alt.content.includes("$") && (
                          <p className="mt-1 text-xs text-neutral-400">
                            <MathText text={alt.content} />
                          </p>
                        )}
                      </div>
                      {alternatives.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeAlternative(i)}
                          className="shrink-0 text-neutral-500 transition-colors hover:text-red-400"
                          aria-label="Remover alternativa"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addAlternative}
                  className="mt-2 flex items-center gap-1.5 text-xs text-orange-400 transition-colors hover:text-orange-300"
                >
                  <PlusIcon className="h-3.5 w-3.5" />
                  Adicionar alternativa
                </button>
              </div>
            )}

            {type === "TRUE_FALSE" && (
              <Field label="Resposta correta">
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm text-neutral-300">
                    <input
                      type="radio"
                      name="true-false"
                      checked={correctAnswer === true}
                      onChange={() => setCorrectAnswer(true)}
                      className="h-4 w-4 border-white/20 bg-transparent accent-orange-500 text-orange-500 focus:ring-0"
                    />
                    Verdadeiro
                  </label>
                  <label className="flex items-center gap-2 text-sm text-neutral-300">
                    <input
                      type="radio"
                      name="true-false"
                      checked={correctAnswer === false}
                      onChange={() => setCorrectAnswer(false)}
                      className="h-4 w-4 border-white/20 bg-transparent accent-orange-500 text-orange-500 focus:ring-0"
                    />
                    Falso
                  </label>
                </div>
              </Field>
            )}

            {error && <p className="text-xs text-red-400">{error}</p>}

            <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                className="rounded-full px-4 py-2 text-xs text-neutral-400 transition-colors hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-full bg-gradient-to-t from-yellow-200 via-orange-400 to-orange-500 px-6 py-2.5 text-xs font-medium text-[#2c1306] ring-1 ring-inset ring-white/40 transition-transform hover:scale-105 disabled:opacity-50 sm:py-2"
              >
                {submitting ? "Salvando…" : "Salvar questão"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
