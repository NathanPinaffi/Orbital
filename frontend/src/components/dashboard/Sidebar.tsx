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
  XIcon,
} from "../ui/dashboardIcons";

const navItems: Array<{
  label: string;
  icon: (p: { className?: string }) => ReactNode;
  to?: string;
}> = [
  { label: "Visão geral", icon: LayoutGridIcon, to: "/dashboard" },
  { label: "Avaliações", icon: FileTextIcon, to: "/avaliacoes" },
  { label: "Banco de questões", icon: BookOpenIcon, to: "/banco-de-questoes" },
  { label: "Turmas", icon: UsersIcon, to: "/turmas" },
  { label: "Configurações", icon: SettingsIcon },
];

const ROLE_LABEL: Record<string, string> = {
  TEACHER: "Professor(a)",
  STUDENT: "Aluno(a)",
  ADMIN: "Administrador(a)",
};

export function Sidebar({
  teacherName,
  initials,
  role,
  open = false,
  onClose,
}: {
  teacherName: string;
  initials: string;
  role?: string;
  open?: boolean;
  onClose?: () => void;
}) {
  const { pathname } = useLocation();

  function onEnter(target: EventTarget) {
    gsap.to(target as Element, { x: 4, duration: 0.25, ease: "power2.out" });
  }
  function onLeave(target: EventTarget) {
    gsap.to(target as Element, { x: 0, duration: 0.25, ease: "power2.out" });
  }

  return (
    <>
      {/* Backdrop — só existe no mobile, quando o drawer está aberto */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-200 md:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-screen w-72 shrink-0 flex-col border-r border-white/5 bg-[#0A0A0A] px-4 py-6 transition-transform duration-300 ease-out md:sticky md:top-0 md:z-auto md:w-64 md:translate-x-0 md:bg-white/[0.02] md:backdrop-blur-xl ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-10 flex items-center justify-between px-2">
          <img src={logo} alt="Orbital" className="h-10 w-auto md:h-14" />
          <button onClick={onClose} className="text-neutral-500 hover:text-white md:hidden" aria-label="Fechar menu">
            <XIcon className="h-5 w-5" />
          </button>
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
                  onClick={onClose}
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
            <p className="text-[11px] text-neutral-500">{role ? ROLE_LABEL[role] ?? role : "—"}</p>
          </div>
          <Link to="/login" onClick={clearToken} className="text-neutral-500 transition-colors hover:text-white" aria-label="Sair">
            <LogOutIcon className="h-4 w-4" />
          </Link>
        </div>
      </aside>
    </>
  );
}
