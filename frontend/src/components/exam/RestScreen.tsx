function formatTime(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const s = Math.floor(totalSeconds % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

export function RestScreen({ remainingSeconds, totalSeconds }: { remainingSeconds: number; totalSeconds: number }) {
  const progress = totalSeconds > 0 ? Math.min(1, Math.max(0, 1 - remainingSeconds / totalSeconds)) : 1;
  const fuelHeight = 6 + progress * 58;

  return (
    <div className="rounded-[28px] border border-white/10 bg-[#0A0A0A] p-10 text-center">
      <svg viewBox="0 0 120 140" className="mx-auto mb-6 h-40 w-40" aria-hidden="true">
        <ellipse cx="60" cy="128" rx="34" ry="6" fill="#F97316" opacity="0.15" />

        <rect x="30" y="20" width="60" height="72" rx="30" fill="#0A0A0A" stroke="#F97316" strokeWidth="2" opacity="0.25" />
        <clipPath id="fuelClip">
          <rect x="32" y="22" width="56" height="68" rx="28" />
        </clipPath>
        <rect
          x="32"
          y={90 - fuelHeight}
          width="56"
          height={fuelHeight}
          fill="url(#fuelGradient)"
          clipPath="url(#fuelClip)"
          style={{ transition: "height 1s linear, y 1s linear" }}
        />

        <path d="M60 8c14 12 20 28 20 44 0 14-8 26-20 34-12-8-20-20-20-34 0-16 6-32 20-44Z" fill="#171717" stroke="#F97316" strokeWidth="2.5" />
        <circle cx="60" cy="46" r="10" fill="#0A0A0A" stroke="#FDBA74" strokeWidth="2" />
        <circle cx="60" cy="46" r="4" fill="#FDBA74" opacity="0.7" />

        <path d="M40 66c-10 2-16 12-16 24l16-8Z" fill="#7C2D12" stroke="#F97316" strokeWidth="2" />
        <path d="M80 66c10 2 16 12 16 24l-16-8Z" fill="#7C2D12" stroke="#F97316" strokeWidth="2" />

        <path d="M50 86h20l-6 12h-8Z" fill="#292524" stroke="#F97316" strokeWidth="1.5" />
        <path
          className="rocket-flame"
          d="M54 98c2 6 3 12 6 16 3-4 4-10 6-16-3 2-9 2-12 0Z"
          fill="url(#flameGradient)"
        />

        <defs>
          <linearGradient id="fuelGradient" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#F97316" />
            <stop offset="100%" stopColor="#FDE047" />
          </linearGradient>
          <linearGradient id="flameGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FDE047" />
            <stop offset="100%" stopColor="#F97316" />
          </linearGradient>
        </defs>
      </svg>

      <h1 className="font-bricolage mb-2 text-2xl font-light tracking-tight text-white">Tempo de descanso</h1>
      <p className="mx-auto mb-6 max-w-sm text-sm text-neutral-400">
        Jornadas longas exigem um descanso, aproveite, viajante!
      </p>

      <div className="mx-auto inline-flex items-center gap-2 rounded-full bg-orange-500/10 px-4 py-1.5 text-sm tabular-nums text-orange-400 ring-1 ring-orange-500/20">
        Retomando em {formatTime(remainingSeconds)}
      </div>
    </div>
  );
}
