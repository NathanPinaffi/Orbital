import { useLayoutEffect, useRef } from "react";
import { secureRandom } from "../../lib/random";

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

  // useLayoutEffect (não useEffect) é essencial aqui: o <canvas> nasce com o buffer
  // default do navegador (300x150) até que resize() rode. Com useEffect isso pode ser
  // pintado na tela antes do resize rodar — e como o CSS força o canvas a preencher
  // 100% da largura/altura, o navegador estica esse buffer 300x150 pra caber, distorcendo
  // as estrelas/planetas por um frame. Em celulares (CPU mais lenta, mais chance desse
  // frame ficar visível) é exatamente esse "distorcido" que aparece. useLayoutEffect roda
  // de forma síncrona antes do navegador pintar, então o buffer já nasce no tamanho certo.
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let width = 0;
    let height = 0;
    // Em telas pequenas capamos o DPR em 1 (celulares costumam ter DPR 2-3, o que
    // quadruplica/nonuplica os pixels a preencher a cada frame sem ganho visual perceptível
    // num fundo decorativo) e reduzimos a densidade — menos estrelas/planetas pra desenhar.
    const isSmallScreen = window.matchMedia("(max-width: 640px)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, isSmallScreen ? 1 : 2);
    const effectiveDensity = isSmallScreen ? density * 0.4 : density;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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

    const count = Math.round(480 * effectiveDensity);
    const stars: Star[] = Array.from({ length: count }, () => ({
      x: secureRandom() * 2 - 1,
      y: secureRandom() * 2 - 1,
      radius: secureRandom() * 1.3 + 0.3,
      baseAlpha: secureRandom() * 0.6 + 0.35,
      twinkleSpeed: secureRandom() * 0.02 + 0.006,
      twinklePhase: secureRandom() * Math.PI * 2,
      depth: secureRandom() * 0.7 + 0.2,
      hue: secureRandom() < 0.14 ? "warm" : secureRandom() < 0.06 ? "cool" : "white",
    }));

    const planetCount = Math.max(2, Math.round(2 * effectiveDensity));
    const planets: Planet[] = Array.from({ length: planetCount }, () => {
      const palette = PLANET_PALETTE[Math.floor(secureRandom() * PLANET_PALETTE.length)];
      return {
        x: secureRandom() * 1.6 - 0.8,
        y: secureRandom() * 1.6 - 0.8,
        radius: secureRandom() * 10 + 8,
        color: palette.color,
        ringColor: palette.ringColor,
        depth: secureRandom() * 0.3 + 0.05,
        orbitSpeed: secureRandom() * 0.0004 + 0.0001,
        orbitRadius: secureRandom() * 14 + 6,
        orbitPhase: secureRandom() * Math.PI * 2,
      };
    });

    let comets: Comet[] = [];
    let framesUntilNextComet = (120 + secureRandom() * 240) * 0.7;

    function spawnComet() {
      const fromLeft = secureRandom() < 0.5;
      const startY = secureRandom() * height * 0.6;
      const speed = secureRandom() * 2.5 + 3.5;
      const angle = (fromLeft ? 1 : -1) * (Math.PI / 5) + Math.PI / 2;
      comets.push({
        x: fromLeft ? -40 : width + 40,
        y: startY,
        vx: (fromLeft ? 1 : -1) * speed,
        vy: Math.sin(angle) * speed * 0.4,
        length: secureRandom() * 60 + 60,
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

        // ctx.filter = blur(...) por planeta por frame é bastante caro (principalmente em
        // Safari/iOS mobile). Um gradiente radial com uma borda semi-transparente dá o mesmo
        // efeito de "borrado" visualmente sem forçar o navegador a rodar um blur de pixel a
        // cada frame.
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

        const glow = ctx!.createRadialGradient(px, py, 0, px, py, p.radius);
        glow.addColorStop(0, `rgba(${p.color},0.85)`);
        glow.addColorStop(0.85, `rgba(${p.color},0.85)`);
        glow.addColorStop(1, `rgba(${p.color},0)`);
        ctx!.beginPath();
        ctx!.fillStyle = glow;
        ctx!.arc(px, py, p.radius, 0, Math.PI * 2);
        ctx!.fill();
      }

      framesUntilNextComet -= 1;
      if (framesUntilNextComet <= 0) {
        spawnComet();
        framesUntilNextComet = (240 + secureRandom() * 360) * 0.7;
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

      if (!document.hidden) raf = requestAnimationFrame(frame);
    }

    function handleVisibilityChange() {
      // Sem isso o canvas continua sendo redesenhado a 60fps com a aba em segundo
      // plano ou o celular com a tela apagada, gastando bateria/CPU à toa.
      if (document.hidden) {
        cancelAnimationFrame(raf);
      } else {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(frame);
      }
    }

    resize();
    if (prefersReducedMotion) {
      // Desenha um único frame estático em vez de animar indefinidamente.
      frame();
      cancelAnimationFrame(raf);
    } else {
      frame();
    }

    window.addEventListener("resize", resize);
    // Em alguns navegadores mobile (principalmente Safari/iOS mais antigos) o evento
    // "resize" não dispara de forma confiável ao girar a tela — sem "orientationchange"
    // o canvas pode ficar com o buffer da orientação anterior esticado pro novo tamanho,
    // distorcendo o desenho até o próximo resize real.
    window.addEventListener("orientationchange", resize);
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerleave", handlePointerLeave);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("orientationchange", resize);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerleave", handlePointerLeave);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [density]);

  return <canvas ref={canvasRef} className={`absolute inset-0 h-full w-full ${className}`} />;
}
