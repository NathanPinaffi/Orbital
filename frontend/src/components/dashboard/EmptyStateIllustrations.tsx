type IllustrationProps = { className?: string };

// Ilustrações usadas nos estados vazios dos cards do dashboard. Maiores e mais
// detalhadas que os ícones de UI em dashboardIcons.tsx (que são só indicadores
// de 16-20px), então ficam em um arquivo separado.

// "A entregar" vazio: nenhuma prova pendente, o foguete tira uma soneca.
export function RocketRestingIllustration({ className = "h-24 w-24" }: IllustrationProps) {
  return (
    <svg viewBox="0 0 120 100" className={className} fill="none">
      {/* chão */}
      <ellipse cx="52" cy="80" rx="34" ry="4" className="fill-white/[0.04]" />

      {/* foguete deitado de lado, "dormindo" */}
      <path
        d="M30 62c0-9 14-16 28-16 8 0 14 3 14 16s-6 16-14 16c-14 0-28-7-28-16Z"
        className="fill-white/[0.05] stroke-neutral-500"
        strokeWidth="1.5"
      />
      <path d="M30 62c6-4 14-6 20-6" className="stroke-neutral-600" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="52" cy="62" r="5" className="fill-orange-500/15 stroke-orange-400" strokeWidth="1.5" />
      <path
        d="M46 47c1-6 6-9 11-9-2 4-3 8-2 11Z"
        className="fill-white/[0.05] stroke-neutral-500"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M46 77c1 6 6 9 11 9-2-4-3-8-2-11Z"
        className="fill-white/[0.05] stroke-neutral-500"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M22 55c-5 2-7 4-7 8s2 6 7 8"
        className="fill-white/[0.05] stroke-neutral-500"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      {/* zzz de soneca */}
      <text x="82" y="40" className="fill-neutral-500" fontSize="11" fontFamily="inherit">
        z
      </text>
      <text x="90" y="30" className="fill-neutral-600" fontSize="8" fontFamily="inherit">
        z
      </text>
      <text x="96" y="22" className="fill-neutral-700" fontSize="6" fontFamily="inherit">
        z
      </text>
    </svg>
  );
}

// "Atividades recentes" vazio: nenhuma prova criada ainda, o foguete está sendo
// abastecido, pronto pra decolar assim que a primeira avaliação for criada.
export function RocketFuelingIllustration({ className = "h-24 w-24" }: IllustrationProps) {
  return (
    <svg viewBox="0 0 120 100" className={className} fill="none">
      {/* plataforma */}
      <rect x="30" y="82" width="44" height="4" rx="1.5" className="fill-white/[0.05]" />
      <rect x="24" y="86" width="56" height="3" rx="1.5" className="fill-white/[0.03]" />

      {/* foguete em pé */}
      <path
        d="M52 12c9 0 16 22 16 40 0 11-3 18-16 18s-16-7-16-18c0-18 7-40 16-40Z"
        className="fill-white/[0.05] stroke-neutral-500"
        strokeWidth="1.5"
      />
      <circle cx="52" cy="38" r="5.5" className="fill-orange-500/15 stroke-orange-400" strokeWidth="1.5" />
      <path
        d="M36 46c-6 1-9 6-9 12 4-2 8-3 11-2Z"
        className="fill-white/[0.05] stroke-neutral-500"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M68 46c6 1 9 6 9 12-4-2-8-3-11-2Z"
        className="fill-white/[0.05] stroke-neutral-500"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M44 70v6c0 3 3.5 5 8 5s8-2 8-5v-6"
        className="fill-white/[0.05] stroke-neutral-500"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      {/* mangueira de abastecimento saindo do tanque no chão até o foguete */}
      <path
        d="M96 84c0-8-4-10-8-10s-6 3-6 6c-3-4-9-4-12 0-9-2-14 4-14 10"
        className="stroke-orange-400/70"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <rect x="90" y="78" width="10" height="14" rx="2" className="fill-white/[0.05] stroke-neutral-500" strokeWidth="1.3" />
      <path d="M92 82h6M92 86h6" className="stroke-neutral-600" strokeWidth="1" strokeLinecap="round" />

      {/* gotas de combustível subindo até o bocal na lateral do foguete */}
      <circle cx="54" cy="60" r="1.6" className="fill-orange-400/70" />
      <circle cx="50" cy="66" r="1.3" className="fill-orange-400/50" />
      <circle cx="57" cy="72" r="1.1" className="fill-orange-400/40" />
    </svg>
  );
}
