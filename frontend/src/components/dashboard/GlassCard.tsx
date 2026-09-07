import type { HTMLAttributes } from "react";

export function GlassCard({ className = "", children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      // brilho: backdrop-brightness-110 clareia o que fica atrás do vidro em exatamente
      // 10% (era só backdrop-blur-xl, sem brightness nenhum). bg/border também sobem ~10%
      // em relação aos valores originais (0.03->0.033, 10%->11%, hover 0.05->0.055,
      // 20%->22%) pra reforçar a translucidez.
      className={`relative overflow-hidden rounded-2xl border border-white/[0.11] bg-white/[0.033] backdrop-blur-xl backdrop-brightness-110 transition-colors duration-300 hover:border-white/[0.22] hover:bg-white/[0.055] ${className}`}
      {...props}
    >
      {/* Reflexo: brilho suave na metade superior do card, como luz batendo no vidro —
          é o que faltava pra o efeito de glassmorphism ficar visível de fato. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-1/2 rounded-t-2xl bg-gradient-to-b from-white/[0.10] via-white/[0.02] to-transparent"
      />
      {children}
    </div>
  );
}
