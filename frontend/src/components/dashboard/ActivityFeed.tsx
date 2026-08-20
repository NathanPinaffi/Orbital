import { GlassCard } from "./GlassCard";
import { AlertTriangleIcon, CheckCircleIcon, ClockIcon, SparklesIcon } from "../ui/dashboardIcons";

const iconFor = (actor: string) => {
  if (actor.includes("IA")) return SparklesIcon;
  if (actor.includes("Monitoramento")) return AlertTriangleIcon;
  if (actor === "Você") return CheckCircleIcon;
  return ClockIcon;
};

export function ActivityFeed({
  items,
}: {
  items: Array<{ id: string; actor: string; action: string; target: string; time: string }>;
}) {
  return (
    <GlassCard data-animate className="p-6">
      <h3 className="font-bricolage mb-1 text-lg font-light tracking-tight text-white">Atividade recente</h3>
      <p className="mb-6 text-xs text-neutral-500">O que aconteceu nas suas turmas</p>

      <ol className="space-y-5">
        {items.map((item, i) => {
          const Icon = iconFor(item.actor);
          return (
            <li key={item.id} className="relative flex gap-3 pl-1">
              {i !== items.length - 1 && (
                <span className="absolute left-[15px] top-7 h-[calc(100%+4px)] w-px bg-white/10" />
              )}
              <span className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-[#0A0A0A] text-orange-400">
                <Icon className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0 pt-1">
                <p className="text-xs leading-relaxed text-neutral-300">
                  <span className="text-white">{item.actor}</span> {item.action}{" "}
                  <span className="text-white">{item.target}</span>
                </p>
                <p className="mt-0.5 text-[11px] text-neutral-600">{item.time}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </GlassCard>
  );
}
