import type { ReactNode } from "react";

export function ExamShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#050505] text-white selection:bg-orange-500/30">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="stars absolute inset-0" />
        <div className="absolute top-0 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-orange-900/10 blur-[120px]" />
      </div>
      <div className="relative z-10 flex min-h-screen justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-2xl">{children}</div>
      </div>
    </div>
  );
}
