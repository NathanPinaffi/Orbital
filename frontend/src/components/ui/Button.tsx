import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "text";

const variants: Record<Variant, string> = {
  primary:
    "bg-gradient-to-t from-yellow-200 via-orange-400 to-orange-500 text-[#2c1306] shadow-[0_0_40px_-5px_rgba(249,115,22,0.6)] ring-1 ring-inset ring-white/40 hover:scale-[1.02] hover:shadow-[0_0_60px_-5px_rgba(249,115,22,0.8)]",
  secondary: "bg-white text-black hover:bg-neutral-200",
  text: "bg-transparent text-neutral-400 hover:text-white",
};

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={`flex w-full items-center justify-center gap-2.5 rounded-full px-8 py-3 text-sm font-medium transition-all duration-300 ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
