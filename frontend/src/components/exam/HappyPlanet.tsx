import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";

export function HappyPlanet({ className = "" }: { className?: string }) {
  const wrapRef = useRef<SVGSVGElement>(null);
  const ringRef = useRef<SVGEllipseElement>(null);
  const sparkleRefs = useRef<(SVGPathElement | null)[]>([]);

  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    const ring = ringRef.current;
    const sparkles = sparkleRefs.current.filter(Boolean) as SVGPathElement[];
    if (!wrap || !ring) return;

    gsap.set(wrap, { scale: 0.4, opacity: 0, rotate: -12, transformOrigin: "50% 50%" });
    gsap.set(ring, { rotate: -8, transformOrigin: "50% 50%" });
    gsap.set(sparkles, { scale: 0, opacity: 0, transformOrigin: "50% 50%" });

    const tl = gsap.timeline({ delay: 0.1 });
    tl.to(wrap, { scale: 1, opacity: 1, rotate: 0, duration: 0.7, ease: "back.out(1.8)" })
      .to(wrap, { y: -10, duration: 1.1, ease: "sine.inOut", repeat: -1, yoyo: true }, "-=0.1")
      .to(ring, { rotate: 8, duration: 2.2, ease: "sine.inOut", repeat: -1, yoyo: true }, "<")
      .to(
        sparkles,
        { scale: 1, opacity: 1, duration: 0.4, ease: "back.out(2)", stagger: 0.12 },
        "-=0.5",
      )
      .to(
        sparkles,
        { opacity: 0.4, duration: 0.9, ease: "sine.inOut", repeat: -1, yoyo: true, stagger: 0.15 },
        "-=0.1",
      );

    return () => {
      tl.kill();
    };
  }, []);

  return (
    <svg
      ref={wrapRef}
      viewBox="0 0 120 120"
      className={className}
      aria-hidden="true"
    >
      <path
        ref={(el) => {
          sparkleRefs.current[0] = el;
        }}
        d="M12 18 L14.5 24 L21 26.5 L14.5 29 L12 35.5 L9.5 29 L3 26.5 L9.5 24 Z"
        fill="#FDBA74"
      />
      <path
        ref={(el) => {
          sparkleRefs.current[1] = el;
        }}
        d="M104 78 L106 83 L111 85 L106 87 L104 92 L102 87 L97 85 L102 83 Z"
        fill="#F59E0B"
      />
      <path
        ref={(el) => {
          sparkleRefs.current[2] = el;
        }}
        d="M100 16 L101.6 20 L105.6 21.6 L101.6 23.2 L100 27.2 L98.4 23.2 L94.4 21.6 L98.4 20 Z"
        fill="#C084FC"
      />

      <ellipse
        ref={ringRef}
        cx="60"
        cy="64"
        rx="46"
        ry="12"
        fill="none"
        stroke="#7C3AED"
        strokeWidth="3"
        opacity="0.7"
      />

      <circle cx="60" cy="60" r="30" fill="url(#happyPlanetGradient)" />

      <path d="M34 52c8-3 20 2 26-4 6-6 10-12 22-10" stroke="#FDE68A" strokeWidth="2.5" fill="none" opacity="0.45" strokeLinecap="round" />
      <path d="M32 68c10 4 18-3 30 1 8 3 14 0 20-3" stroke="#7C2D12" strokeWidth="2.5" fill="none" opacity="0.35" strokeLinecap="round" />

      <circle cx="50" cy="56" r="3.4" fill="#1F1147" />
      <circle cx="70" cy="56" r="3.4" fill="#1F1147" />
      <path
        d="M48 68c3.5 4.5 12.5 4.5 16 0"
        stroke="#1F1147"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="46" cy="63" r="2.6" fill="#FCA5A5" opacity="0.6" />
      <circle cx="74" cy="63" r="2.6" fill="#FCA5A5" opacity="0.6" />

      <defs>
        <radialGradient id="happyPlanetGradient" cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#FDE047" />
          <stop offset="45%" stopColor="#F97316" />
          <stop offset="100%" stopColor="#6D28D9" />
        </radialGradient>
      </defs>
    </svg>
  );
}
