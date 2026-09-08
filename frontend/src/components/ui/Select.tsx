import type { SelectHTMLAttributes } from "react";
import { ChevronDownIcon } from "./dashboardIcons";

type Size = "md" | "sm";

// "md" é o campo de formulário padrão (modais de criação/edição), mesma altura
// e fundo do inputClass usado ao lado dele. "sm" é o "chip" de filtro compacto
// (ex: os filtros do banco de questões), mais claro pra se destacar sobre cards.
const sizeClasses: Record<Size, string> = {
  md: "border-white/10 bg-[#050505] px-3 py-2 pr-9 text-sm text-white",
  sm: "border-white/10 bg-white/5 px-2.5 py-1.5 pr-7 text-[11px] text-neutral-300",
};

const chevronSizeClasses: Record<Size, string> = {
  md: "right-3 h-4 w-4",
  sm: "right-2 h-3 w-3",
};

// Select nativo estilizado na paleta cinza/laranja do site — o <select> do
// navegador não aceita border/bg/arrow customizados sem "appearance-none", então
// escondemos a seta padrão e desenhamos a nossa por cima, coerente com o resto
// da UI (dark, borda white/10, foco laranja).
export function Select({
  size = "md",
  className = "",
  ...props
}: Omit<SelectHTMLAttributes<HTMLSelectElement>, "size"> & { size?: Size }) {
  return (
    <div className={`relative ${className}`}>
      <select
        className={`w-full min-w-0 cursor-pointer appearance-none rounded-lg border transition-colors focus:border-orange-500/50 focus:outline-none hover:border-white/20 ${sizeClasses[size]}`}
        {...props}
      />
      <ChevronDownIcon
        className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-orange-400/70 ${chevronSizeClasses[size]}`}
      />
    </div>
  );
}
