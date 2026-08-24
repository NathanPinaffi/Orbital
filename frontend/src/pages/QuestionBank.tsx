import { useEffect, useMemo, useState } from "react";
import { AppShell } from "../components/layout/AppShell";
import { GlassCard } from "../components/dashboard/GlassCard";
import { PencilIcon, PlusIcon, TrashIcon } from "../components/ui/dashboardIcons";
import { QuestionFormModal } from "../components/questions/QuestionFormModal";
import { CreateBankModal } from "../components/questions/CreateBankModal";
import { useGsapEntrance } from "../hooks/useGsapEntrance";
import {
  createQuestion,
  createQuestionBank,
  deleteQuestion,
  deleteQuestionBank,
  fetchQuestionBanks,
  fetchQuestions,
  updateQuestion,
  type BankVisibility,
  type BloomLevel,
  type Difficulty,
  type Question,
  type QuestionBankSummary,
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

function BankPill({
  active,
  label,
  hint,
  onClick,
}: {
  active: boolean;
  label: string;
  hint?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs transition-colors ${
        active
          ? "bg-orange-500/15 text-orange-400 ring-1 ring-orange-500/30"
          : "bg-white/5 text-neutral-400 ring-1 ring-white/10 hover:text-white"
      }`}
    >
      {label}
      {hint && <span className="ml-1.5 text-[10px] opacity-70">{hint}</span>}
    </button>
  );
}

export default function QuestionBank() {
  const containerRef = useGsapEntrance<HTMLDivElement>();
  const [bankStatus, setBankStatus] = useState<"loading" | "ready" | "error">("loading");
  const [mine, setMine] = useState<QuestionBankSummary[]>([]);
  const [publicBanks, setPublicBanks] = useState<QuestionBankSummary[]>([]);
  const [selectedBankId, setSelectedBankId] = useState<string | null>(null);
  const [bankModalOpen, setBankModalOpen] = useState(false);

  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [subjectFilter, setSubjectFilter] = useState(ALL);
  const [topicFilter, setTopicFilter] = useState(ALL);
  const [difficultyFilter, setDifficultyFilter] = useState(ALL);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Question | undefined>(undefined);

  function loadBanks() {
    setBankStatus("loading");
    fetchQuestionBanks()
      .then((data) => {
        setMine(data.mine);
        setPublicBanks(data.public);
        setBankStatus("ready");
        setSelectedBankId((current) => current ?? data.mine[0]?.id ?? data.public[0]?.id ?? null);
      })
      .catch(() => setBankStatus("error"));
  }

  useEffect(loadBanks, []);

  function loadQuestions() {
    if (!selectedBankId) {
      setQuestions([]);
      setStatus("ready");
      return;
    }
    setStatus("loading");
    fetchQuestions(selectedBankId)
      .then((data) => {
        setQuestions(data);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }

  useEffect(loadQuestions, [selectedBankId]);

  const selectedBank =
    mine.find((b) => b.id === selectedBankId) ?? publicBanks.find((b) => b.id === selectedBankId) ?? null;
  const isOwnBank = mine.some((b) => b.id === selectedBankId);

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
    loadQuestions();
    loadBanks();
  }

  async function handleDelete(question: Question) {
    if (!window.confirm(`Excluir a questão "${question.content.slice(0, 60)}..."?`)) return;
    await deleteQuestion(question.id);
    loadQuestions();
    loadBanks();
  }

  async function handleCreateBank(input: { name: string; visibility: BankVisibility }) {
    const bank = await createQuestionBank(input);
    setBankModalOpen(false);
    loadBanks();
    setSelectedBankId(bank.id);
  }

  async function handleDeleteBank(bank: QuestionBankSummary) {
    if (bank.questionCount > 0) {
      window.alert("Mova ou exclua as questões deste banco antes de excluí-lo.");
      return;
    }
    if (!window.confirm(`Excluir o banco "${bank.name}"?`)) return;
    await deleteQuestionBank(bank.id);
    if (selectedBankId === bank.id) setSelectedBankId(null);
    loadBanks();
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
            <p className="text-sm text-neutral-500">Organize suas questões em bancos, privados ou públicos.</p>
          </div>
          {isOwnBank && selectedBankId && (
            <button
              onClick={openCreate}
              className="flex items-center justify-center gap-2 rounded-full bg-gradient-to-t from-yellow-200 via-orange-400 to-orange-500 px-4 py-2.5 text-xs font-medium text-[#2c1306] shadow-[0_0_25px_-5px_rgba(249,115,22,0.6)] ring-1 ring-inset ring-white/40 transition-transform hover:scale-105 sm:self-auto"
            >
              <PlusIcon className="h-3.5 w-3.5" />
              Nova questão
            </button>
          )}
        </header>

        {bankStatus === "ready" && (
          <div data-animate className="mb-6 space-y-3">
            <div>
              <p className="mb-1.5 text-[10px] uppercase text-neutral-600">Meus bancos</p>
              <div className="flex flex-wrap items-center gap-2">
                {mine.map((b) => (
                  <div key={b.id} className="group relative">
                    <BankPill
                      active={selectedBankId === b.id}
                      label={b.name}
                      hint={`${b.questionCount} · ${b.visibility === "PUBLIC" ? "público" : "privado"}`}
                      onClick={() => setSelectedBankId(b.id)}
                    />
                    {b.questionCount === 0 && (
                      <button
                        onClick={() => handleDeleteBank(b)}
                        className="absolute -right-1 -top-1 hidden h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[8px] text-white group-hover:flex"
                        aria-label="Excluir banco"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={() => setBankModalOpen(true)}
                  className="flex shrink-0 items-center gap-1 rounded-full border border-dashed border-white/20 px-3 py-1.5 text-xs text-neutral-400 transition-colors hover:border-orange-500/40 hover:text-orange-400"
                >
                  <PlusIcon className="h-3 w-3" />
                  Novo banco
                </button>
              </div>
            </div>

            {publicBanks.length > 0 && (
              <div>
                <p className="mb-1.5 text-[10px] uppercase text-neutral-600">Bancos públicos de outros professores</p>
                <div className="flex flex-wrap gap-2">
                  {publicBanks.map((b) => (
                    <BankPill
                      key={b.id}
                      active={selectedBankId === b.id}
                      label={`${b.name} (${b.ownerName})`}
                      hint={`${b.questionCount}`}
                      onClick={() => setSelectedBankId(b.id)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {bankStatus === "ready" && mine.length === 0 && (
          <GlassCard data-animate className="mb-6 max-w-lg p-6 text-sm text-neutral-400">
            Você ainda não tem nenhum banco de questões.{" "}
            <button onClick={() => setBankModalOpen(true)} className="text-orange-400 hover:text-orange-300">
              Criar meu primeiro banco
            </button>
          </GlassCard>
        )}

        {selectedBank && !isOwnBank && (
          <p data-animate className="mb-4 text-xs text-neutral-500">
            Banco público de {selectedBank.ownerName} — somente leitura, mas você pode usar essas questões em suas provas.
          </p>
        )}

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

        {(status === "loading" || bankStatus === "loading") && (
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

        {status === "ready" && selectedBankId && questions.length === 0 && (
          <GlassCard data-animate className="max-w-lg p-6 text-sm text-neutral-400">
            {isOwnBank ? 'Nenhuma questão cadastrada ainda. Clique em "Nova questão" para começar.' : "Este banco ainda não tem questões."}
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
                  {isOwnBank && (
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
                  )}
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

      {modalOpen && selectedBankId && (
        <QuestionFormModal
          question={editing}
          bankId={selectedBankId}
          subjectOptions={subjectOptions}
          topicOptions={topicOptions}
          onClose={() => setModalOpen(false)}
          onSubmit={handleSubmit}
        />
      )}

      {bankModalOpen && <CreateBankModal onClose={() => setBankModalOpen(false)} onCreate={handleCreateBank} />}
    </AppShell>
  );
}
