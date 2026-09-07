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
  UsersIcon,
  XIcon,
} from "../ui/dashboardIcons";

type NavItem = {
  label: string;
  icon: (p: { className?: string }) => ReactNode;
  to?: string;
};

const TEACHER_ITEMS: NavItem[] = [
  { label: "Visão geral", icon: LayoutGridIcon, to: "/dashboard" },
  { label: "Avaliações", icon: FileTextIcon, to: "/avaliacoes" },
  { label: "Banco de questões", icon: BookOpenIcon, to: "/banco-de-questoes" },
  { label: "Turmas", icon: UsersIcon, to: "/turmas" },
];

const STUDENT_ITEMS: NavItem[] = [
  { label: "Visão geral", icon: LayoutGridIcon, to: "/dashboard" },
  { label: "Minhas turmas", icon: UsersIcon, to: "/minhas-turmas" },
];

const ROLE_LABEL: Record<string, string> = {
  TEACHER: "Professor(a)",
  STUDENT: "Aluno(a)",
  ADMIN: "Administrador(a)",
};

export function Sidebar({
  teacherName,
  initials,
  avatarUrl,
  role,
  open = false,
  onClose,
}: {
  teacherName: string;
  initials: string;
  avatarUrl?: string | null;
  role?: string;
  open?: boolean;
  onClose?: () => void;
}) {
  const { pathname } = useLocation();
  const navItems = role === "STUDENT" ? STUDENT_ITEMS : TEACHER_ITEMS;

  function onEnter(target: EventTarget) {
    gsap.to(target as Element, { x: 4, duration: 0.25, ease: "power2.out" });
  }
  function onLeave(target: EventTarget) {
    gsap.to(target as Element, { x: 0, duration: 0.25, ease: "power2.out" });
  }

  return (
    // No mobile o menu ocupa a tela inteira (fixed inset-0 + w-full), então não precisa
    // de um backdrop separado por trás — o próprio aside já cobre tudo. A partir de "md"
    // ele volta a ser a coluna fixa de sempre, sticky ao lado do conteúdo.
    <aside
      className={`fixed inset-0 z-50 flex h-[100dvh] w-full flex-col overflow-y-auto border-r border-white/5 bg-[#0A0A0A] px-6 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] transition-transform duration-300 ease-out md:sticky md:inset-auto md:top-0 md:z-auto md:h-screen md:w-64 md:translate-x-0 md:bg-white/[0.02] md:px-4 md:py-6 md:backdrop-blur-xl ${
        open ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="mb-10 flex items-center justify-between px-2">
        <img src={logo} alt="Orbital" width={600} height={193} className="h-11 w-auto md:h-14" />
        <button
          onClick={onClose}
          className="-mr-2 rounded-full p-2.5 text-neutral-400 transition-colors hover:bg-white/5 hover:text-white md:hidden"
          aria-label="Fechar menu"
        >
          <XIcon className="h-6 w-6" />
        </button>
      </div>

      <nav className="flex-1 space-y-1.5 md:space-y-1">
        {navItems.map((item) => {
          const active = item.to ? pathname.startsWith(item.to) : false;
          const classes = `flex w-full items-center gap-3 rounded-xl px-3 py-3.5 text-base transition-colors duration-200 md:py-2.5 md:text-sm ${
            active
              ? "bg-white/[0.06] text-white ring-1 ring-white/10"
              : item.to
                ? "text-neutral-400 hover:bg-orange-500/10 hover:text-orange-400"
                : "cursor-not-allowed text-neutral-600"
          }`;
          const content = (
            <>
              <item.icon className="h-5 w-5 md:h-4 md:w-4" />
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

      <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] p-3.5 md:p-3">
        {avatarUrl ? (
          <img src={avatarUrl} alt={teacherName} className="h-10 w-10 shrink-0 rounded-full object-cover md:h-9 md:w-9" />
        ) : (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-purple-700 text-sm font-medium text-white md:h-9 md:w-9 md:text-xs">
            {initials}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-white md:text-xs">{teacherName}</p>
          <p className="text-xs text-neutral-500 md:text-[11px]">{role ? ROLE_LABEL[role] ?? role : "—"}</p>
        </div>
        <Link
          to="/login"
          onClick={clearToken}
          className="rounded-full p-2 text-neutral-500 transition-colors hover:bg-white/5 hover:text-white"
          aria-label="Sair"
        >
          <LogOutIcon className="h-5 w-5 md:h-4 md:w-4" />
        </Link>
      </div>
    </aside>
  );
}
