import type { ReactNode } from "react";
import { GalaxyBackground } from "../effects/GalaxyBackground";

export function AuthBackground({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#050505] text-white selection:bg-orange-500/30">
      <div className="pointer-events-none fixed inset-0 z-0">
        <GalaxyBackground density={3} />
        <div className="absolute top-0 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-orange-900/10 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-[600px] w-[600px] rounded-full bg-orange-950/20 blur-[100px]" />
      </div>
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 py-12">
        {children}
      </div>
    </div>
  );
}
