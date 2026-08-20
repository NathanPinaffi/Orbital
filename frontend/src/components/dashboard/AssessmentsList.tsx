import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { GlassCard } from "./GlassCard";
import type { AssessmentStatus } from "../../data/mockDashboard";

const statusStyles: Record<AssessmentStatus, string> = {
  Rascunho: "bg-white/5 text-neutral-300 ring-white/10",
  Publicada: "bg-blue-500/10 text-blue-300 ring-blue-500/20",
  Corrigindo: "bg-orange-500/10 text-orange-400 ring-orange-500/20",
  Concluída: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20",
};

export function AssessmentsList({
  items,
}: {
  items: Array<{
    id: string;
    title: string;
    className: string;
    status: AssessmentStatus;
    progress: number;
    dueDate: string;
    bloomFocus: string;
  }>;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-progress]",
        { width: "0%" },
        { width: (_i, el) => el.dataset.target ?? "0%", duration: 1, ease: "power3.out", stagger: 0.06, delay: 0.5 },
      );
    }, containerRef);
    return () => ctx.revert();
  }, [items]);

  return (
    <GlassCard data-animate className="p-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h3 className="font-bricolage text-lg font-light tracking-tight text-white">Avaliações recentes</h3>
          <p className="text-xs text-neutral-500">Status de aplicação e correção por turma</p>
        </div>
        <a href="#" className="text-xs text-orange-400 transition-colors hover:text-orange-300">
          Ver todas
        </a>
      </div>

      <div ref={containerRef} className="space-y-2">
        {items.map((a) => (
          <div
            key={a.id}
            className="group grid grid-cols-[1fr_auto] items-center gap-4 rounded-xl border border-transparent px-3 py-3 transition-all duration-200 hover:border-white/10 hover:bg-white/[0.04]"
          >
            <div className="min-w-0">
              <div className="mb-1 flex items-center gap-2">
                <p className="truncate text-sm text-white">{a.title}</p>
                <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] uppercase ring-1 ${statusStyles[a.status]}`}>
                  {a.status}
                </span>
              </div>
              <p className="text-xs text-neutral-500">
                {a.className} · Foco: {a.bloomFocus} · Entrega {a.dueDate}
              </p>
              <div className="mt-2 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-white/5">
                <div
                  data-progress
                  data-target={`${a.progress}%`}
                  className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400"
                />
              </div>
            </div>
            <span className="text-sm text-neutral-400 tabular-nums">{a.progress}%</span>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
