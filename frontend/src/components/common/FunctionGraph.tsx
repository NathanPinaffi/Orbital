import { useMemo } from "react";
import { compile } from "mathjs";

const WIDTH = 480;
const HEIGHT = 300;
const PADDING = 28;

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

function buildPaths(expression: string, xMin: number, xMax: number, yMin: number, yMax: number) {
  const paths: string[] = [];
  try {
    const fn = compile(expression);
    const samples = 400;
    let current: string | null = null;

    for (let i = 0; i <= samples; i++) {
      const x = xMin + ((xMax - xMin) * i) / samples;
      let y: number;
      try {
        const raw = fn.evaluate({ x });
        y = typeof raw === "number" ? raw : NaN;
      } catch {
        y = NaN;
      }

      const valid = Number.isFinite(y) && y >= yMin - (yMax - yMin) * 2 && y <= yMax + (yMax - yMin) * 2;
      const svgX = toSvgX(x, xMin, xMax);
      const svgY = toSvgY(Math.min(Math.max(y, yMin - (yMax - yMin)), yMax + (yMax - yMin)), yMin, yMax);

      if (!valid) {
        current = null;
        continue;
      }
      if (current === null) {
        current = `M ${svgX.toFixed(2)} ${svgY.toFixed(2)}`;
      } else {
        current += ` L ${svgX.toFixed(2)} ${svgY.toFixed(2)}`;
      }
      if (i === samples && current) paths.push(current);
    }
    if (current && !paths.includes(current)) paths.push(current);
  } catch {
    return { paths: [], error: true };
  }
  return { paths, error: false };
}

export function FunctionGraph({ spec, className }: { spec: GraphSpec; className?: string }) {
  const { expression, xMin, xMax, yMin, yMax } = spec;

  const { paths, error } = useMemo(
    () => buildPaths(expression, xMin, xMax, yMin, yMax),
    [expression, xMin, xMax, yMin, yMax],
  );

  const showXAxis = yMin <= 0 && yMax >= 0;
  const showYAxis = xMin <= 0 && xMax >= 0;

  if (error) {
    return (
      <div className={`rounded-lg border border-red-500/20 bg-red-500/5 p-3 text-xs text-red-400 ${className ?? ""}`}>
        Não foi possível interpretar a expressão do gráfico.
      </div>
    );
  }

  return (
    <div className={`rounded-lg border border-white/10 bg-white/[0.02] p-2 ${className ?? ""}`}>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" role="img" aria-label={`Gráfico de ${expression}`}>
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

        <rect
          x={PADDING}
          y={PADDING}
          width={WIDTH - 2 * PADDING}
          height={HEIGHT - 2 * PADDING}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={1}
        />

        {paths.map((d, i) => (
          <path key={i} d={d} fill="none" stroke="#fb923c" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        ))}

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
    </div>
  );
}
