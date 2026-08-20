import { AlertTriangleIcon, ClockIcon, FileTextIcon } from "../ui/dashboardIcons";

export function ExamWarning({
  title,
  durationMinutes,
  questionCount,
  onStart,
  starting,
}: {
  title: string;
  durationMinutes: number;
  questionCount: number;
  onStart: () => void;
  starting: boolean;
}) {
  return (
    <div className="electric-card relative overflow-hidden rounded-[28px] bg-neutral-900 p-[2px]">
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-yellow-300 via-orange-500 to-transparent opacity-60" />
      <div className="relative z-10 rounded-[26px] bg-[#0A0A0A] p-6 text-center sm:p-10">
        <h1 className="font-bricolage mb-2 text-2xl font-light tracking-tight text-white sm:text-3xl">{title}</h1>
        <p className="mb-8 text-sm text-neutral-500">Leia com atenção antes de começar.</p>

        <div className="mb-8 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
            <ClockIcon className="mx-auto mb-2 h-5 w-5 text-orange-400" />
            <p className="text-lg text-white">{durationMinutes} min</p>
            <p className="text-xs text-neutral-500">Duração</p>
          </div>
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
            <FileTextIcon className="mx-auto mb-2 h-5 w-5 text-orange-400" />
            <p className="text-lg text-white">{questionCount}</p>
            <p className="text-xs text-neutral-500">Questões</p>
          </div>
        </div>

        <div className="mb-8 flex items-start gap-3 rounded-xl border border-orange-500/20 bg-orange-500/10 p-4 text-left">
          <AlertTriangleIcon className="mt-0.5 h-5 w-5 shrink-0 text-orange-400" />
          <p className="text-sm leading-relaxed text-orange-200">
            Ao clicar em <strong>"Fazer a atividade"</strong> o temporizador será ativado imediatamente e{" "}
            <strong>não será possível pausá-lo</strong>. Certifique-se de ter tempo disponível antes de começar.
          </p>
        </div>

        <button
          onClick={onStart}
          disabled={starting}
          className="w-full rounded-full bg-gradient-to-t from-yellow-200 via-orange-400 to-orange-500 px-8 py-3 text-sm font-medium text-[#2c1306] shadow-[0_0_40px_-5px_rgba(249,115,22,0.6)] ring-1 ring-inset ring-white/40 transition-all duration-300 hover:scale-[1.02] disabled:opacity-50"
        >
          {starting ? "Iniciando…" : "Fazer a atividade"}
        </button>
      </div>
    </div>
  );
}
