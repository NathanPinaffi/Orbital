import { useEffect, useRef } from "react";

interface Star {
  x: number; // -1..1 world space, relative to center
  y: number;
  radius: number;
  baseAlpha: number;
  twinkleSpeed: number;
  twinklePhase: number;
  depth: number; // parallax strength
  hue: "warm" | "cool" | "white";
}

const HUE_COLOR: Record<Star["hue"], string> = {
  warm: "251,146,60",
  cool: "168,85,247",
  white: "255,255,255",
};

/**
 * Campo de estrelas em canvas que reage ao mouse (paralaxe por profundidade)
 * e gira lentamente, como uma galáxia. Inspirado em reactbits.dev/backgrounds/galaxy.
 */
export function GalaxyBackground({
  density = 1,
  className = "",
}: {
  density?: number;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let width = 0;
    let height = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const pointer = { x: 0, y: 0 };
    const current = { x: 0, y: 0 };

    function resize() {
      if (!canvas) return;
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    const count = Math.round(120 * density);
    const stars: Star[] = Array.from({ length: count }, () => ({
      x: Math.random() * 2 - 1,
      y: Math.random() * 2 - 1,
      radius: Math.random() * 1.3 + 0.3,
      baseAlpha: Math.random() * 0.6 + 0.35,
      twinkleSpeed: Math.random() * 0.02 + 0.006,
      twinklePhase: Math.random() * Math.PI * 2,
      depth: Math.random() * 0.7 + 0.2,
      hue: Math.random() < 0.14 ? "warm" : Math.random() < 0.06 ? "cool" : "white",
    }));

    function handlePointerMove(e: PointerEvent) {
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
    }
    function handlePointerLeave() {
      pointer.x = 0;
      pointer.y = 0;
    }

    let raf = 0;
    let time = 0;

    function frame() {
      time += 1;
      current.x += (pointer.x - current.x) * 0.04;
      current.y += (pointer.y - current.y) * 0.04;

      ctx!.clearRect(0, 0, width, height);
      const cx = width / 2;
      const cy = height / 2;
      const maxDim = Math.max(width, height) / 2;
      const rotation = time * 0.00006;
      const cosR = Math.cos(rotation);
      const sinR = Math.sin(rotation);

      for (const s of stars) {
        const rx = s.x * cosR - s.y * sinR;
        const ry = s.x * sinR + s.y * cosR;

        const px = cx + rx * maxDim + current.x * s.depth * 46;
        const py = cy + ry * maxDim + current.y * s.depth * 46;

        const twinkle = Math.sin(time * s.twinkleSpeed + s.twinklePhase) * 0.35 + 0.65;
        const alpha = s.baseAlpha * twinkle;

        ctx!.beginPath();
        ctx!.fillStyle = `rgba(${HUE_COLOR[s.hue]},${alpha})`;
        ctx!.arc(px, py, s.radius, 0, Math.PI * 2);
        ctx!.fill();
      }

      raf = requestAnimationFrame(frame);
    }

    resize();
    frame();

    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerleave", handlePointerLeave);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerleave", handlePointerLeave);
    };
  }, [density]);

  return <canvas ref={canvasRef} className={`absolute inset-0 h-full w-full ${className}`} />;
}
