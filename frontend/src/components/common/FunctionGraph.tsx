import { useMemo, useState } from "react";
import { compile } from "mathjs";

const WIDTH = 240;
const HEIGHT = 150;
const PADDING = 14;

export interface GraphSpec {
  expression: string;
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

function toSvgX(x: number, xMin: number, xMax: number) {
  return PADDING + ((x - xMin) / (xMax - xMin)) * (WIDTH - 2 * PADDING);
}

function toSvgY(y: number, yMin: number, yMax: number) {
  return HEIGHT - PADDING - ((y - yMin) / (yMax - yMin)) * (HEIGHT - 2 * PADDING);
}

/**
 * Samples the curve across the x range and splits it into separate path segments
 * wherever the function is undefined (e.g. sqrt of a negative number, division by zero).
 * Values outside the visible Y range are still plotted (unclamped) — the caller clips
 * them with an SVG clipPath so the curve reaches the plot edges cleanly instead of
 * vanishing whenever it briefly leaves the window.
 */
function buildPaths(expression: string, xMin: number, xMax: number, yMin: number, yMax: number) {
  const paths: string[] = [];
  try {
    const fn = compile(expression);
    const samples = 400;
    let current: string[] = [];

    for (let i = 0; i <= samples; i++) {
      const x = xMin + ((xMax - xMin) * i) / samples;
      let y: number;
      try {
        const raw = fn.evaluate({ x });
        y = typeof raw === "number" ? raw : NaN;
      } catch {
        y = NaN;
      }

      if (!Number.isFinite(y)) {
        if (current.length > 1) paths.push(current.join(" "));
        current = [];
        continue;
      }

      const svgX = toSvgX(x, xMin, xMax);
      const svgY = toSvgY(y, yMin, yMax);
      current.push(`${current.length === 0 ? "M" : "L"} ${svgX.toFixed(2)} ${svgY.toFixed(2)}`);
    }
    if (current.length > 1) paths.push(current.join(" "));
  } catch {
    return { paths: [], error: true };
  }
  return { paths, error: false };
}

export function FunctionGraph({ spec, className }: { spec: GraphSpec; className?: string }) {
  const { expression, xMin, xMax, yMin, yMax } = spec;
  const clipId = useMemo(() => `graph-clip-${Math.random().toString(36).slice(2)}`, []);
  const [open, setOpen] = useState(false);

  const { paths, error } = useMemo(
    () => buildPaths(expression, xMin, xMax, yMin, yMax),
    [expression, xMin, xMax, yMin, yMax],
  );

  const showXAxis = yMin <= 0 && yMax >= 0;
  const showYAxis = xMin <= 0 && xMax >= 0;

  const toggleButton = (
    <button
      type="button"
      onClick={() => setOpen((v) => !v)}
      className="flex w-full items-center justify-between rounded-lg px-1 py-1 text-left text-sm font-semibold text-orange-400 transition hover:text-orange-300"
    >
      <span>Gráfico</span>
      <span className="text-xs text-orange-400/70">{open ? "Ocultar ▲" : "Mostrar ▼"}</span>
    </button>
  );

  if (error) {
    return (
      <div className={`rounded-lg border border-red-500/20 bg-red-500/5 p-3 text-xs text-red-400 ${className ?? ""}`}>
        Não foi possível interpretar a expressão do gráfico.
      </div>
    );
  }

  return (
    <div className={`rounded-lg border border-white/10 bg-white/[0.02] p-2 ${className ?? ""}`}>
      {toggleButton}
      {open && (
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="mt-2 w-full" role="img" aria-label={`Gráfico de ${expression}`}>
        <defs>
          <clipPath id={clipId}>
            <rect x={PADDING} y={PADDING} width={WIDTH - 2 * PADDING} height={HEIGHT - 2 * PADDING} />
          </clipPath>
        </defs>

        <rect x={0} y={0} width={WIDTH} height={HEIGHT} fill="transparent" />

        {showXAxis && (
          <line
            x1={PADDING}
            y1={toSvgY(0, yMin, yMax)}
            x2={WIDTH - PADDING}
            y2={toSvgY(0, yMin, yMax)}
            stroke="rgba(255,255,255,0.25)"
            strokeWidth={1}
          />
        )}
        {showYAxis && (
          <line
            x1={toSvgX(0, xMin, xMax)}
            y1={PADDING}
            x2={toSvgX(0, xMin, xMax)}
            y2={HEIGHT - PADDING}
            stroke="rgba(255,255,255,0.25)"
            strokeWidth={1}
          />
        )}

        <g clipPath={`url(#${clipId})`}>
          {paths.map((d, i) => (
            <path key={i} d={d} fill="none" stroke="#fb923c" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          ))}
        </g>

        <rect
          x={PADDING}
          y={PADDING}
          width={WIDTH - 2 * PADDING}
          height={HEIGHT - 2 * PADDING}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={1}
        />

        <text x={PADDING} y={HEIGHT - 8} fontSize={9} fill="rgba(255,255,255,0.4)">
          {xMin}
        </text>
        <text x={WIDTH - PADDING} y={HEIGHT - 8} fontSize={9} fill="rgba(255,255,255,0.4)" textAnchor="end">
          {xMax}
        </text>
        <text x={4} y={PADDING + 8} fontSize={9} fill="rgba(255,255,255,0.4)">
          {yMax}
        </text>
        <text x={4} y={HEIGHT - PADDING} fontSize={9} fill="rgba(255,255,255,0.4)">
          {yMin}
        </text>
      </svg>
      )}
    </div>
  );
}
