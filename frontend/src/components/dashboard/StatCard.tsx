import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { GlassCard } from "./GlassCard";
import { TrendingDownIcon, TrendingUpIcon } from "../ui/dashboardIcons";

export function StatCard({
  label,
  value,
  decimals = 0,
  delta,
  trend,
}: {
  label: string;
  value: number;
  decimals?: number;
  delta: string;
  trend: "up" | "down";
}) {
  const valueRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const el = valueRef.current;
    if (!el) return;
    const counter = { n: 0 };
    const tween = gsap.to(counter, {
      n: value,
      duration: 1.4,
      ease: "power2.out",
      delay: 0.3,
      onUpdate: () => {
        el.textContent = counter.n.toFixed(decimals);
      },
    });
    return () => {
      tween.kill();
    };
  }, [value, decimals]);

  const TrendIcon = trend === "up" ? TrendingUpIcon : TrendingDownIcon;
  const trendColor = trend === "up" ? "text-orange-400 bg-orange-500/10" : "text-emerald-400 bg-emerald-500/10";

  return (
    <GlassCard data-animate className="p-6">
      <p className="mb-3 text-xs uppercase tracking-wide text-neutral-400">{label}</p>
      <div className="flex items-baseline justify-between gap-2">
        <span
          ref={valueRef}
          className="font-bricolage text-3xl font-light tracking-tight text-white"
        >
          0
        </span>
        <span className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-xs ${trendColor}`}>
          <TrendIcon className="h-3 w-3" />
          {delta}
        </span>
      </div>
    </GlassCard>
  );
}
