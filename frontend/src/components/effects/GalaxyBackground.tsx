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

interface Planet {
  x: number; // -1..1 world space, relative to center
  y: number;
  radius: number;
  color: string;
  ringColor: string | null;
  depth: number;
  orbitSpeed: number;
  orbitRadius: number;
  orbitPhase: number;
}

interface Comet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  length: number;
  life: number; // 0..1, fades in/out
  maxLife: number;
  age: number;
}

const HUE_COLOR: Record<Star["hue"], string> = {
  warm: "251,146,60",
  cool: "168,85,247",
  white: "255,255,255",
};

const PLANET_PALETTE: Array<{ color: string; ringColor: string | null }> = [
  { color: "251,146,60", ringColor: "251,146,60" },
  { color: "253,224,71", ringColor: null },
  { color: "196,132,252", ringColor: "196,132,252" },
];

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

    const count = Math.round(480 * density);
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

    const planetCount = Math.max(2, Math.round(2 * density));
    const planets: Planet[] = Array.from({ length: planetCount }, () => {
      const palette = PLANET_PALETTE[Math.floor(Math.random() * PLANET_PALETTE.length)];
      return {
        x: Math.random() * 1.6 - 0.8,
        y: Math.random() * 1.6 - 0.8,
        radius: Math.random() * 10 + 8,
        color: palette.color,
        ringColor: palette.ringColor,
        depth: Math.random() * 0.3 + 0.05,
        orbitSpeed: Math.random() * 0.0004 + 0.0001,
        orbitRadius: Math.random() * 14 + 6,
        orbitPhase: Math.random() * Math.PI * 2,
      };
    });

    let comets: Comet[] = [];
    let framesUntilNextComet = (120 + Math.random() * 240) * 0.7;

    function spawnComet() {
      const fromLeft = Math.random() < 0.5;
      const startY = Math.random() * height * 0.6;
      const speed = Math.random() * 2.5 + 3.5;
      const angle = (fromLeft ? 1 : -1) * (Math.PI / 5) + Math.PI / 2;
      comets.push({
        x: fromLeft ? -40 : width + 40,
        y: startY,
        vx: (fromLeft ? 1 : -1) * speed,
        vy: Math.sin(angle) * speed * 0.4,
        length: Math.random() * 60 + 60,
        life: 0,
        maxLife: 1,
        age: 0,
      });
    }

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

      for (const p of planets) {
        const wobbleX = Math.cos(time * p.orbitSpeed + p.orbitPhase) * p.orbitRadius;
        const wobbleY = Math.sin(time * p.orbitSpeed + p.orbitPhase) * p.orbitRadius;
        const px = cx + p.x * maxDim + current.x * p.depth * 46 + wobbleX;
        const py = cy + p.y * maxDim + current.y * p.depth * 46 + wobbleY;

        if (p.ringColor) {
          ctx!.save();
          ctx!.translate(px, py);
          ctx!.rotate(-0.5);
          ctx!.scale(1, 0.15);
          ctx!.beginPath();
          ctx!.strokeStyle = `rgba(${p.ringColor},0.35)`;
          ctx!.lineWidth = 1.5;
          ctx!.arc(0, 0, p.radius * 1.9, 0, Math.PI * 2);
          ctx!.stroke();
          ctx!.restore();
        }

        ctx!.beginPath();
        ctx!.fillStyle = `rgba(${p.color},0.85)`;
        ctx!.arc(px, py, p.radius, 0, Math.PI * 2);
        ctx!.fill();
      }

      framesUntilNextComet -= 1;
      if (framesUntilNextComet <= 0) {
        spawnComet();
        framesUntilNextComet = (240 + Math.random() * 360) * 0.7;
      }

      comets = comets.filter((c) => {
        c.age += 1;
        c.x += c.vx;
        c.y += c.vy;
        c.life = Math.min(1, c.age / 20) * Math.min(1, (140 - c.age) / 40);

        const inBounds = c.x > -80 && c.x < width + 80 && c.y > -80 && c.y < height + 80;
        if (!inBounds || c.life <= 0) return false;

        const angle = Math.atan2(c.vy, c.vx);
        const tailX = c.x - Math.cos(angle) * c.length;
        const tailY = c.y - Math.sin(angle) * c.length;

        const tailGradient = ctx!.createLinearGradient(c.x, c.y, tailX, tailY);
        tailGradient.addColorStop(0, `rgba(255,255,255,${0.85 * c.life})`);
        tailGradient.addColorStop(1, "rgba(255,255,255,0)");

        ctx!.beginPath();
        ctx!.strokeStyle = tailGradient;
        ctx!.lineWidth = 1.8;
        ctx!.lineCap = "round";
        ctx!.moveTo(c.x, c.y);
        ctx!.lineTo(tailX, tailY);
        ctx!.stroke();

        ctx!.beginPath();
        ctx!.fillStyle = `rgba(255,255,255,${c.life})`;
        ctx!.arc(c.x, c.y, 1.6, 0, Math.PI * 2);
        ctx!.fill();

        return true;
      });

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
