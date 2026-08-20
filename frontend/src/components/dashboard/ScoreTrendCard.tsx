import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";

function buildPath(values: number[], width: number, height: number) {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const stepX = width / (values.length - 1);

  const points = values.map((v, i) => {
    const x = i * stepX;
    const y = height - ((v - min) / range) * (height - 8) - 4;
    return [x, y];
  });

  const line = points
    .map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`)
    .join(" ");

  const area = `${line} L ${width} ${height} L 0 ${height} Z`;

  return { line, area };
}

export function ScoreTrendCard({ values, current }: { values: number[]; current: number }) {
  const pathRef = useRef<SVGPathElement>(null);
  const dotRef = useRef<SVGCircleElement>(null);
  const { line, area } = buildPath(values, 280, 80);

  useLayoutEffect(() => {
    const path = pathRef.current;
    const dot = dotRef.current;
    if (!path) return;

    const length = path.getTotalLength();
    gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });
    const tl = gsap.timeline({ delay: 0.4 });
    tl.to(path, { strokeDashoffset: 0, duration: 1.6, ease: "power2.inOut" });
    if (dot) {
      tl.fromTo(dot, { scale: 0, transformOrigin: "center" }, { scale: 1, duration: 0.4, ease: "back.out(3)" }, "-=0.2");
    }
  }, [values]);

  const last = values[values.length - 1];
  const lastX = 280;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const lastY = 80 - ((last - min) / range) * (80 - 8) - 4;

  return (
    <div
      data-animate
      className="electric-card relative overflow-hidden rounded-[28px] bg-neutral-900 p-[2px]"
    >
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-yellow-300 via-orange-500 to-transparent opacity-80" />
      <div className="relative z-10 h-full rounded-[26px] bg-[#0A0A0A] p-6">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-xs uppercase tracking-wide text-neutral-400">Nota média — últimas 12 semanas</span>
        </div>
        <div className="mb-4 flex items-baseline gap-2">
          <span className="font-bricolage bg-gradient-to-r from-white via-orange-200 to-orange-400 bg-clip-text text-4xl font-light tracking-tight text-transparent">
            {current.toFixed(1)}
          </span>
          <span className="text-xs text-neutral-500">/ 10</span>
        </div>
        <svg className="h-20 w-full overflow-visible" viewBox="0 0 280 80" preserveAspectRatio="none">
          <defs>
            <linearGradient id="trendGradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#f97316" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={area} fill="url(#trendGradient)" />
          <path ref={pathRef} d={line} fill="none" stroke="#f97316" strokeWidth={2} strokeLinecap="round" />
          <circle ref={dotRef} cx={lastX} cy={lastY} r={3.5} fill="#fff" stroke="#f97316" strokeWidth={2} />
        </svg>
      </div>
    </div>
  );
}
