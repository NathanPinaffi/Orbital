import type { InputHTMLAttributes, ReactNode } from "react";

export function TextField({
  label,
  icon,
  trailing,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  icon: ReactNode;
  trailing?: ReactNode;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label className="text-xs text-neutral-400">{label}</label>
        {trailing}
      </div>
      <div className="flex items-center rounded-lg border border-white/10 bg-[#050505] transition-all focus-within:border-orange-500/50">
        <span className="ml-4 flex-shrink-0 text-neutral-500">{icon}</span>
        <input
          className="w-full bg-transparent border-none py-3 pl-3 pr-4 text-sm text-white placeholder:text-neutral-600 focus:outline-none"
          {...props}
        />
      </div>
    </div>
  );
}
