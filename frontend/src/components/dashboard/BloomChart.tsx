import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { GlassCard } from "./GlassCard";

export function BloomChart({ data }: { data: Array<{ level: string; value: number; color: string }> }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const max = Math.max(...data.map((d) => d.value));

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-bar]",
        { width: "0%" },
        { width: (_i, el) => el.dataset.target ?? "0%", duration: 1, ease: "power3.out", stagger: 0.08, delay: 0.3 },
      );
    }, containerRef);
    return () => ctx.revert();
  }, [data]);

  return (
    <GlassCard data-animate className="p-6">
      <h3 className="font-bricolage mb-1 text-lg font-light tracking-tight text-white">
        Taxonomia de Bloom
      </h3>
      <p className="mb-6 text-xs text-neutral-500">Distribuição das questões do banco por nível cognitivo</p>

      <div ref={containerRef} className="space-y-3.5">
        {data.map((d) => (
          <div key={d.level} className="flex items-center gap-3">
            <span className="w-24 shrink-0 text-xs text-neutral-400">{d.level}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/5">
              <div
                data-bar
                data-target={`${(d.value / max) * 100}%`}
                className="h-full rounded-full"
                style={{ backgroundColor: d.color }}
              />
            </div>
            <span className="w-6 shrink-0 text-right text-xs text-neutral-500">{d.value}</span>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
