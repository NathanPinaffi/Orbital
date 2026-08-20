import { useEffect, useMemo, useState } from "react";
import { AppShell } from "../components/layout/AppShell";
import { GlassCard } from "../components/dashboard/GlassCard";
import { PencilIcon, PlusIcon, TrashIcon } from "../components/ui/dashboardIcons";
import { QuestionFormModal } from "../components/questions/QuestionFormModal";
import { useGsapEntrance } from "../hooks/useGsapEntrance";
import {
  createQuestion,
  deleteQuestion,
  fetchQuestions,
  updateQuestion,
  type BloomLevel,
  type Difficulty,
  type Question,
  type QuestionInput,
  type QuestionType,
} from "../lib/api";

const DIFFICULTY_LABEL: Record<Difficulty, string> = { EASY: "Fácil", MEDIUM: "Médio", HARD: "Difícil" };
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
const TYPE_STYLE: Record<QuestionType, string> = {
  MULTIPLE_CHOICE: "bg-blue-500/10 text-blue-300 ring-blue-500/20",
  TRUE_FALSE: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20",
  ESSAY: "bg-orange-500/10 text-orange-400 ring-orange-500/20",
};

const ALL = "__all__";

export default function QuestionBank() {
  const containerRef = useGsapEntrance<HTMLDivElement>();
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [subjectFilter, setSubjectFilter] = useState(ALL);
  const [topicFilter, setTopicFilter] = useState(ALL);
  const [difficultyFilter, setDifficultyFilter] = useState(ALL);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Question | undefined>(undefined);

  function load() {
    setStatus("loading");
    fetchQuestions()
      .then((data) => {
        setQuestions(data);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }

  useEffect(load, []);

  const subjectOptions = useMemo(() => Array.from(new Set(questions.map((q) => q.subject))).sort(), [questions]);
  const topicOptions = useMemo(() => Array.from(new Set(questions.map((q) => q.topic))).sort(), [questions]);

  const filtered = questions.filter(
    (q) =>
      (subjectFilter === ALL || q.subject === subjectFilter) &&
      (topicFilter === ALL || q.topic === topicFilter) &&
      (difficultyFilter === ALL || q.difficulty === difficultyFilter),
  );

  function openCreate() {
    setEditing(undefined);
    setModalOpen(true);
  }

  function openEdit(question: Question) {
    setEditing(question);
    setModalOpen(true);
  }

  async function handleSubmit(input: QuestionInput) {
    if (editing) {
      await updateQuestion(editing.id, input);
    } else {
      await createQuestion(input);
    }
    setModalOpen(false);
    load();
  }

  async function handleDelete(question: Question) {
    if (!window.confirm(`Excluir a questão "${question.content.slice(0, 60)}..."?`)) return;
    await deleteQuestion(question.id);
    load();
  }

  const selectClass =
    "rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-neutral-300 focus:border-orange-500/50 focus:outline-none";

  return (
    <AppShell>
      <div ref={containerRef}>
        <header data-animate className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-bricolage text-xl font-light tracking-tight text-white sm:text-2xl md:text-3xl">
              Banco de questões
            </h1>
            <br />
            <p className="text-sm text-neutral-500">Organize suas questões por disciplina, matéria e dificuldade.</p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center justify-center gap-2 rounded-full bg-gradient-to-t from-yellow-200 via-orange-400 to-orange-500 px-4 py-2.5 text-xs font-medium text-[#2c1306] shadow-[0_0_25px_-5px_rgba(249,115,22,0.6)] ring-1 ring-inset ring-white/40 transition-transform hover:scale-105 sm:self-auto"
          >
            <PlusIcon className="h-3.5 w-3.5" />
            Nova questão
          </button>
        </header>

        {status === "ready" && questions.length > 0 && (
          <div data-animate className="mb-6 grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:gap-3">
            <select
              className={`${selectClass} w-full sm:w-auto`}
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
              className={`${selectClass} w-full sm:w-auto`}
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
            <select
              className={`${selectClass} w-full sm:w-auto`}
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
            >
              <option value={ALL}>Todas as dificuldades</option>
              {Object.entries(DIFFICULTY_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        )}

        {status === "loading" && (
          <div data-animate className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl bg-white/[0.03]" />
            ))}
          </div>
        )}

        {status === "error" && (
          <GlassCard data-animate className="max-w-lg p-6 text-sm text-red-400">
            Não foi possível carregar o banco de questões agora.
          </GlassCard>
        )}

        {status === "ready" && questions.length === 0 && (
          <GlassCard data-animate className="max-w-lg p-6 text-sm text-neutral-400">
            Nenhuma questão cadastrada ainda. Clique em "Nova questão" para começar.
          </GlassCard>
        )}

        {status === "ready" && questions.length > 0 && (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {filtered.map((q) => (
              <GlassCard key={q.id} data-animate className="flex flex-col gap-3 p-5">
                <div className="flex items-start justify-between gap-2">
                  <span className={`rounded-md px-1.5 py-0.5 text-[10px] uppercase ring-1 ${TYPE_STYLE[q.type]}`}>
                    {TYPE_LABEL[q.type]}
                  </span>
                  <div className="flex shrink-0 gap-1">
                    <button
                      onClick={() => openEdit(q)}
                      className="rounded-lg p-1.5 text-neutral-500 transition-colors hover:bg-white/5 hover:text-white"
                      aria-label="Editar"
                    >
                      <PencilIcon className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(q)}
                      className="rounded-lg p-1.5 text-neutral-500 transition-colors hover:bg-red-500/10 hover:text-red-400"
                      aria-label="Excluir"
                    >
                      <TrashIcon className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <p className="line-clamp-3 text-sm text-white">{q.content}</p>

                <div className="mt-auto flex flex-wrap gap-1.5 text-[10px] text-neutral-500">
                  <span className="rounded-md bg-white/5 px-2 py-0.5 ring-1 ring-white/10">{q.subject}</span>
                  <span className="rounded-md bg-white/5 px-2 py-0.5 ring-1 ring-white/10">{q.topic}</span>
                  <span className="rounded-md bg-white/5 px-2 py-0.5 ring-1 ring-white/10">
                    {DIFFICULTY_LABEL[q.difficulty]}
                  </span>
                  <span className="rounded-md bg-white/5 px-2 py-0.5 ring-1 ring-white/10">
                    {BLOOM_LABEL[q.bloomLevel]}
                  </span>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>

      {modalOpen && (
        <QuestionFormModal
          question={editing}
          subjectOptions={subjectOptions}
          topicOptions={topicOptions}
          onClose={() => setModalOpen(false)}
          onSubmit={handleSubmit}
        />
      )}
    </AppShell>
  );
}
