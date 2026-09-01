import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "text";

const variants: Record<Variant, string> = {
  primary:
    "cursor-pointer bg-gradient-to-t from orange-500 to-yellow-500 via-orange-400 text-[#2c1306] shadow-[0_0_40px_-5px_rgba(249,115,22,0.1)] ring-1 ring-inset hover:scale-[1.01] hover:shadow-[0_0_60px_-5px_rgba(249,115,22,0.3)]",
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
      className={`cursor-pointer flex w-full items-center justify-center gap-2.5 rounded-full px-8 py-3 text-sm font-medium transition-all duration-300 ${variants[variant]} ${className}`}
      {...props}
    />
  );
}

