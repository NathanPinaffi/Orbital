import { useEffect, useMemo, useState, type FormEvent } from "react";
import { XIcon } from "../ui/dashboardIcons";
import {
  createAssessment,
  fetchClasses,
  fetchQuestions,
  type ClassSummary,
  type Question,
} from "../../lib/api";

const ALL = "__all__";

const inputClass =
  "w-full rounded-lg border border-white/10 bg-[#050505] px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:border-orange-500/50 focus:outline-none";

export function CreateAssessmentModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [classes, setClasses] = useState<ClassSummary[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [dueAt, setDueAt] = useState("");
  const [selectedClassIds, setSelectedClassIds] = useState<Set<string>>(new Set());
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<Set<string>>(new Set());
  const [subjectFilter, setSubjectFilter] = useState(ALL);
  const [topicFilter, setTopicFilter] = useState(ALL);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([fetchClasses(), fetchQuestions()])
      .then(([classesData, questionsData]) => {
        setClasses(classesData);
        setQuestions(questionsData);
      })
      .catch(() => setError("Não foi possível carregar turmas e questões."))
      .finally(() => setLoading(false));
  }, []);

  const subjectOptions = useMemo(() => Array.from(new Set(questions.map((q) => q.subject))).sort(), [questions]);
  const topicOptions = useMemo(() => Array.from(new Set(questions.map((q) => q.topic))).sort(), [questions]);

  const filteredQuestions = questions.filter(
    (q) => (subjectFilter === ALL || q.subject === subjectFilter) && (topicFilter === ALL || q.topic === topicFilter),
  );

  function toggleClass(id: string) {
    setSelectedClassIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleQuestion(id: string) {
    setSelectedQuestionIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (selectedClassIds.size === 0) {
      setError("Selecione pelo menos uma turma.");
      return;
    }
    if (selectedQuestionIds.size === 0) {
      setError("Selecione pelo menos uma questão.");
      return;
    }

    setSubmitting(true);
    try {
      await createAssessment({
        title,
        durationMinutes,
        classIds: Array.from(selectedClassIds),
        questionIds: Array.from(selectedQuestionIds),
        dueAt: dueAt ? new Date(dueAt).toISOString() : undefined,
      });
      onCreated();
    } catch {
      setError("Não foi possível criar a avaliação. Verifique se as turmas estão conectadas ao Google Sala de Aula.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 px-3 py-6 backdrop-blur-sm sm:px-4 sm:py-8">
      <div className="electric-card relative w-full max-w-2xl overflow-hidden rounded-[24px] bg-neutral-900 p-[2px] sm:rounded-[28px]">
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-yellow-300 via-orange-500 to-transparent opacity-60" />
        <div className="relative z-10 max-h-[85vh] overflow-y-auto rounded-[22px] bg-[#0A0A0A] p-5 sm:rounded-[26px] sm:p-8">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-bricolage text-xl font-light tracking-tight text-white">Nova avaliação</h2>
            <button onClick={onClose} className="text-neutral-500 transition-colors hover:text-white" aria-label="Fechar">
              <XIcon className="h-5 w-5" />
            </button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-12 animate-pulse rounded-xl bg-white/[0.03]" />
              ))}
            </div>
          ) : (
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs text-neutral-400">Título da avaliação</label>
                  <input
                    className={inputClass}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Prova bimestral"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs text-neutral-400">Duração (minutos)</label>
                  <input
                    type="number"
                    min={1}
                    className={inputClass}
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs text-neutral-400">Data de entrega (opcional)</label>
                <input
                  type="datetime-local"
                  className={inputClass}
                  value={dueAt}
                  onChange={(e) => setDueAt(e.target.value)}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs text-neutral-400">Turmas</label>
                {classes.length === 0 ? (
                  <p className="text-xs text-neutral-500">
                    Nenhuma turma importada ainda. Importe turmas na página Turmas primeiro.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {classes.map((c) => (
                      <label
                        key={c.id}
                        className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-neutral-300"
                      >
                        <input
                          type="checkbox"
                          checked={selectedClassIds.has(c.id)}
                          onChange={() => toggleClass(c.id)}
                          className="h-3.5 w-3.5 shrink-0 rounded border-white/20 bg-transparent text-orange-500 focus:ring-0"
                        />
                        <span className="truncate">
                          {c.name} · {c.studentCount} alunos
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <div className="mb-1.5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <label className="text-xs text-neutral-400">
                    Questões · {selectedQuestionIds.size} selecionada{selectedQuestionIds.size !== 1 && "s"}
                  </label>
                  <div className="grid grid-cols-2 gap-2 sm:flex">
                    <select
                      className="min-w-0 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-neutral-300"
                      value={subjectFilter}
                      onChange={(e) => setSubjectFilter(e.target.value)}
                    >
                      <option value={ALL}>Todas as disciplinas</option>
                      {subjectOptions.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    <select
                      className="min-w-0 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-neutral-300"
                      value={topicFilter}
                      onChange={(e) => setTopicFilter(e.target.value)}
                    >
                      <option value={ALL}>Todas as matérias</option>
                      {topicOptions.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {questions.length === 0 ? (
                  <p className="text-xs text-neutral-500">Nenhuma questão no banco ainda.</p>
                ) : (
                  <div className="max-h-64 space-y-1.5 overflow-y-auto rounded-lg border border-white/5 p-2">
                    {filteredQuestions.map((q) => (
                      <label
                        key={q.id}
                        className="flex items-start gap-2 rounded-lg px-2 py-1.5 text-xs text-neutral-300 hover:bg-white/5"
                      >
                        <input
                          type="checkbox"
                          checked={selectedQuestionIds.has(q.id)}
                          onChange={() => toggleQuestion(q.id)}
                          className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded border-white/20 bg-transparent text-orange-500 focus:ring-0"
                        />
                        <span className="line-clamp-1">
                          {q.content}{" "}
                          <span className="text-neutral-600">
                            ({q.subject} · {q.topic})
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

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
                  {submitting ? "Criando…" : "Criar e distribuir"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
