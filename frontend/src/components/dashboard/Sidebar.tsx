import { type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import gsap from "gsap";
import logo from "../../assets/logo.png";
import { clearToken } from "../../lib/api";
import {
  BookOpenIcon,
  FileTextIcon,
  LayoutGridIcon,
  LogOutIcon,
  SettingsIcon,
  UsersIcon,
} from "../ui/dashboardIcons";

const navItems: Array<{
  label: string;
  icon: (p: { className?: string }) => ReactNode;
  to?: string;
}> = [
  { label: "Visão geral", icon: LayoutGridIcon, to: "/dashboard" },
  { label: "Avaliações", icon: FileTextIcon },
  { label: "Banco de questões", icon: BookOpenIcon },
  { label: "Turmas", icon: UsersIcon, to: "/turmas" },
  { label: "Configurações", icon: SettingsIcon },
];

export function Sidebar({ teacherName, initials }: { teacherName: string; initials: string }) {
  const { pathname } = useLocation();

  function onEnter(target: EventTarget) {
    gsap.to(target as Element, { x: 4, duration: 0.25, ease: "power2.out" });
  }
  function onLeave(target: EventTarget) {
    gsap.to(target as Element, { x: 0, duration: 0.25, ease: "power2.out" });
  }

  return (
    <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col border-r border-white/5 bg-white/[0.02] backdrop-blur-xl px-4 py-6">
      <div className="mb-10 flex items-center gap-2 px-2">
        <img src={logo} alt="Orbital" className="h-7 w-auto" />
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const active = item.to ? pathname.startsWith(item.to) : false;
          const classes = `flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors duration-200 ${
            active
              ? "bg-white/[0.06] text-white ring-1 ring-white/10"
              : item.to
                ? "text-neutral-400 hover:text-white"
                : "cursor-not-allowed text-neutral-600"
          }`;
          const content = (
            <>
              <item.icon className="h-4 w-4" />
              {item.label}
              {!item.to && (
                <span className="ml-auto rounded bg-white/5 px-1.5 py-0.5 text-[9px] uppercase text-neutral-600">
                  em breve
                </span>
              )}
            </>
          );

          if (item.to) {
            return (
              <Link
                key={item.label}
                to={item.to}
                onMouseEnter={(e) => onEnter(e.currentTarget)}
                onMouseLeave={(e) => onLeave(e.currentTarget)}
                className={classes}
              >
                {content}
              </Link>
            );
          }

          return (
            <div key={item.label} className={classes}>
              {content}
            </div>
          );
        })}
      </nav>

      <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] p-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-purple-700 text-xs font-medium text-white">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs text-white">{teacherName}</p>
          <p className="text-[11px] text-neutral-500">Professora</p>
        </div>
        <Link to="/login" onClick={clearToken} className="text-neutral-500 transition-colors hover:text-white" aria-label="Sair">
          <LogOutIcon className="h-4 w-4" />
        </Link>
      </div>
    </aside>
  );
}
