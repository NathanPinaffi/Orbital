import { useRef, useState } from "react";

const WIDTH = 480;
const HEIGHT = 300;
const PADDING = 28;

export type Stroke = [number, number][];

function pointFromEvent(svg: SVGSVGElement, e: { clientX: number; clientY: number }): [number, number] {
  const rect = svg.getBoundingClientRect();
  const x = ((e.clientX - rect.left) / rect.width) * WIDTH;
  const y = ((e.clientY - rect.top) / rect.height) * HEIGHT;
  return [Math.round(x), Math.round(y)];
}

function strokeToPath(stroke: Stroke) {
  if (stroke.length === 0) return "";
  return stroke.map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x} ${y}`).join(" ");
}

export function SketchPad({
  value,
  onChange,
  readOnly,
  className,
}: {
  value: Stroke[];
  onChange?: (strokes: Stroke[]) => void;
  readOnly?: boolean;
  className?: string;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [drawing, setDrawing] = useState(false);

  function handlePointerDown(e: React.PointerEvent<SVGSVGElement>) {
    if (readOnly || !onChange) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setDrawing(true);
    const point = pointFromEvent(e.currentTarget, e);
    onChange([...value, [point]]);
  }

  function handlePointerMove(e: React.PointerEvent<SVGSVGElement>) {
    if (readOnly || !onChange || !drawing) return;
    const point = pointFromEvent(e.currentTarget, e);
    const next = value.slice();
    const last = next[next.length - 1];
    if (last) next[next.length - 1] = [...last, point];
    onChange(next);
  }

  function handlePointerUp() {
    setDrawing(false);
  }

  function handleClear() {
    onChange?.([]);
  }

  return (
    <div className={className}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className={`w-full rounded-lg border border-white/10 bg-[#050505] ${readOnly ? "" : "touch-none cursor-crosshair"}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        role="img"
        aria-label="Área de esboço"
      >
        <line
          x1={PADDING}
          y1={HEIGHT / 2}
          x2={WIDTH - PADDING}
          y2={HEIGHT / 2}
          stroke="rgba(255,255,255,0.15)"
          strokeWidth={1}
        />
        <line
          x1={WIDTH / 2}
          y1={PADDING}
          x2={WIDTH / 2}
          y2={HEIGHT - PADDING}
          stroke="rgba(255,255,255,0.15)"
          strokeWidth={1}
        />
        <rect
          x={PADDING}
          y={PADDING}
          width={WIDTH - 2 * PADDING}
          height={HEIGHT - 2 * PADDING}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={1}
        />

        {value.map((stroke, i) => (
          <path
            key={i}
            d={strokeToPath(stroke)}
            fill="none"
            stroke="#fb923c"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
      </svg>

      {!readOnly && (
        <button
          type="button"
          onClick={handleClear}
          className="mt-2 text-xs text-neutral-500 transition-colors hover:text-red-400"
        >
          Limpar esboço
        </button>
      )}
    </div>
  );
}
