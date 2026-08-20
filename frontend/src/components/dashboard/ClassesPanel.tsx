import { GlassCard } from "./GlassCard";
import { UsersIcon } from "../ui/dashboardIcons";

export function ClassesPanel({
  items,
}: {
  items: Array<{ id: string; name: string; subject: string; students: number }>;
}) {
  return (
    <GlassCard data-animate className="p-6">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="font-bricolage text-lg font-light tracking-tight text-white">Suas turmas</h3>
        <span className="text-xs text-neutral-500">{items.length} ativas</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {items.map((c) => (
          <div
            key={c.id}
            className="group cursor-pointer rounded-xl border border-white/5 bg-white/[0.02] p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-orange-500/30 hover:bg-white/[0.05]"
          >
            <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10 text-orange-400">
              <UsersIcon className="h-4 w-4" />
            </div>
            <p className="text-sm text-white">{c.name}</p>
            <p className="text-xs text-neutral-500">{c.subject}</p>
            <p className="mt-2 text-[11px] text-neutral-600">{c.students} alunos</p>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
