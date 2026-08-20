import { useMemo } from "react";
import { GlassCard } from "./GlassCard";
import { ClipboardListIcon, ClockIcon, CalendarIcon } from "../ui/dashboardIcons";
import type { AssessmentSummary } from "../../lib/api";

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "agora mesmo";
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `há ${days}d`;
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function formatDueDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export function RecentActivityCard({ assessments }: { assessments: AssessmentSummary[] }) {
  const recent = useMemo(
    () => [...assessments].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5),
    [assessments],
  );

  return (
    <GlassCard data-animate className="p-6">
      <div className="mb-4 flex items-center gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-500/10 text-orange-400">
          <ClockIcon className="h-4 w-4" />
        </div>
        <h3 className="font-bricolage text-base font-light tracking-tight text-white">Atividades recentes</h3>
      </div>

      {recent.length === 0 ? (
        <p className="text-sm text-neutral-500">Nenhuma atividade ainda.</p>
      ) : (
        <ul className="space-y-2.5">
          {recent.map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-3 text-sm">
              <div className="min-w-0">
                <p className="truncate text-neutral-200">{a.title}</p>
                <p className="truncate text-xs text-neutral-500">{a.className}</p>
              </div>
              <span className="shrink-0 text-xs text-neutral-500">{timeAgo(a.createdAt)}</span>
            </li>
          ))}
        </ul>
      )}
    </GlassCard>
  );
}

export function UpcomingCard({ assessments }: { assessments: AssessmentSummary[] }) {
  const upcoming = useMemo(
    () =>
      assessments
        .filter((a) => a.status === "PUBLISHED")
        .sort((a, b) => {
          if (!a.dueAt && !b.dueAt) return 0;
          if (!a.dueAt) return 1;
          if (!b.dueAt) return -1;
          return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
        })
        .slice(0, 5),
    [assessments],
  );

  return (
    <GlassCard data-animate className="p-6">
      <div className="mb-4 flex items-center gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-500/10 text-orange-400">
          <ClipboardListIcon className="h-4 w-4" />
        </div>
        <h3 className="font-bricolage text-base font-light tracking-tight text-white">A entregar</h3>
      </div>

      {upcoming.length === 0 ? (
        <p className="text-sm text-neutral-500">Nenhuma avaliação em aberto no momento.</p>
      ) : (
        <ul className="space-y-2.5">
          {upcoming.map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-3 text-sm">
              <div className="min-w-0">
                <p className="truncate text-neutral-200">{a.title}</p>
                <p className="truncate text-xs text-neutral-500">{a.className}</p>
              </div>
              <span className="shrink-0 text-xs text-orange-400">
                {a.dueAt ? formatDueDate(a.dueAt) : "sem prazo"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </GlassCard>
  );
}

const WEEKDAY_LABELS = ["D", "S", "T", "Q", "Q", "S", "S"];

export function CalendarCard({ assessments }: { assessments: AssessmentSummary[] }) {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();

  const dueDays = useMemo(() => {
    const set = new Set<number>();
    for (const a of assessments) {
      if (!a.dueAt) continue;
      const d = new Date(a.dueAt);
      if (d.getFullYear() === year && d.getMonth() === month) set.add(d.getDate());
    }
    return set;
  }, [assessments, year, month]);

  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: Array<number | null> = [...Array(firstWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  return (
    <GlassCard data-animate className="p-6">
      <div className="mb-4 flex items-center gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-500/10 text-orange-400">
          <CalendarIcon className="h-4 w-4" />
        </div>
        <h3 className="font-bricolage text-base font-light tracking-tight text-white">
          {today.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
        </h3>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAY_LABELS.map((w, i) => (
          <span key={i} className="text-[10px] uppercase text-neutral-600">
            {w}
          </span>
        ))}
        {cells.map((day, i) =>
          day == null ? (
            <span key={i} />
          ) : (
            <span
              key={i}
              className={`flex h-7 w-7 items-center justify-center justify-self-center rounded-full text-xs ${
                day === today.getDate()
                  ? "bg-orange-500 text-[#2c1306]"
                  : dueDays.has(day)
                    ? "bg-orange-500/15 text-orange-400 ring-1 ring-orange-500/30"
                    : "text-neutral-400"
              }`}
            >
              {day}
            </span>
          ),
        )}
      </div>

      {dueDays.size > 0 && (
        <p className="mt-4 text-xs text-neutral-500">
          <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-orange-500/40 align-middle" />
          Dias com entrega marcada
        </p>
      )}
    </GlassCard>
  );
}
