import { useState, type ReactNode } from "react";
import { Sidebar } from "../dashboard/Sidebar";
import { MenuIcon } from "../ui/dashboardIcons";
import logo from "../../assets/logo.png";
import { useMe, initials } from "../../hooks/useMe";

export function AppShell({ children }: { children: ReactNode }) {
  const me = useMe();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#050505] text-white md:flex-row">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="stars absolute inset-0" />
        <div className="absolute top-0 left-1/3 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-orange-900/10 blur-[130px]" />
        <div className="absolute bottom-0 right-0 h-[500px] w-[500px] rounded-full bg-orange-950/20 blur-[110px]" />
      </div>

      <Sidebar
        teacherName={me?.name ?? "Carregando…"}
        initials={me ? initials(me.name) : "—"}
        role={me?.role}
        open={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
      />

      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-white/5 bg-white/[0.02] px-4 py-3 backdrop-blur-xl md:hidden">
          <img src={logo} alt="Orbital" className="h-8 w-auto" />
          <button
            onClick={() => setMobileNavOpen(true)}
            className="rounded-lg border border-white/10 p-2 text-neutral-300 hover:text-white"
            aria-label="Abrir menu"
          >
            <MenuIcon className="h-5 w-5" />
          </button>
        </header>

        <main className="min-w-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6 md:px-10 md:py-8">{children}</main>
      </div>
    </div>
  );
}
