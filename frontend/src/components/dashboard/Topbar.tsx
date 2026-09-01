import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { BellIcon, SearchIcon } from "../ui/dashboardIcons";
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationItem,
} from "../../lib/api";
import { timeAgo } from "../../lib/time";

const POLL_INTERVAL_MS = 60_000;
const DROPDOWN_WIDTH = 320;

export function Topbar() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number } | null>(null);
  const bellRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  function load() {
    fetchNotifications()
      .then((data) => {
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      })
      .catch(() => {});
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  function toggleOpen() {
    if (!open && bellRef.current) {
      const rect = bellRef.current.getBoundingClientRect();
      const left = Math.min(rect.right - DROPDOWN_WIDTH, window.innerWidth - DROPDOWN_WIDTH - 16);
      setDropdownPos({ top: rect.bottom + 8, left: Math.max(16, left) });
    }
    setOpen((o) => !o);
  }

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (bellRef.current?.contains(target) || dropdownRef.current?.contains(target)) return;
      setOpen(false);
    }
    function handleScrollOrResize() {
      setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [open]);

  async function handleOpenNotification(n: NotificationItem) {
    if (!n.readAt) {
      setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, readAt: new Date().toISOString() } : x)));
      setUnreadCount((c) => Math.max(0, c - 1));
      markNotificationRead(n.id).catch(() => {});
    }
  }

  async function handleMarkAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })));
    setUnreadCount(0);
    markAllNotificationsRead().catch(() => {});
  }

  return (
    <header
      data-animate
      className="mb-6 flex w-full flex-col gap-4 bg-transparent sm:mb-8 sm:flex-row sm:items-center sm:justify-between"
    >
      <div>
        <h1 className="font-bricolage text-xl font-light tracking-tight text-white sm:text-2xl md:text-3xl">
          Visão geral
        </h1>
        <p className="text-sm text-neutral-500">
          <br />
        Orbital - Plataforma de Ensino
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden flex-1 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 backdrop-blur-md md:flex">
          <SearchIcon className="h-3.5 w-3.5 shrink-0 text-neutral-500" />
          <input
            placeholder="Buscar avaliação, turma..."
            className="w-full min-w-0 bg-transparent text-xs text-neutral-300 placeholder-neutral-600 focus:outline-none md:w-48"
          />
        </div>

        <button
          ref={bellRef}
          onClick={toggleOpen}
          className="relative shrink-0 rounded-full border border-white/10 bg-white/5 p-2.5 text-neutral-300 transition-colors hover:bg-orange-500/20 hover:text-orange-400"
          aria-label="Notificações"
        >
          <BellIcon className="h-4 w-4" />
          {unreadCount > 0 && <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-orange-500" />}
        </button>

        {open &&
          dropdownPos &&
          createPortal(
            <div
              ref={dropdownRef}
              style={{ top: dropdownPos.top, left: dropdownPos.left, width: DROPDOWN_WIDTH }}
              className="fixed z-[1000] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-white/10 bg-[#0A0A0A] shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
                <p className="text-sm text-white">Notificações</p>
                {unreadCount > 0 && (
                  <button onClick={handleMarkAllRead} className="text-xs text-orange-400 hover:text-orange-300">
                    Marcar todas como lidas
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="px-4 py-6 text-center text-xs text-neutral-500">Nenhuma notificação ainda.</p>
                ) : (
                  notifications.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => handleOpenNotification(n)}
                      className={`block w-full border-b border-white/5 px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-white/[0.03] ${
                        n.readAt ? "" : "bg-orange-500/5"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {!n.readAt && <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500" />}
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-white">{n.title}</p>
                          <p className="mt-0.5 line-clamp-2 text-xs text-neutral-500">{n.body}</p>
                          <p className="mt-1 text-[10px] text-neutral-600">{timeAgo(n.createdAt)}</p>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>,
            document.body,
          )}
      </div>
    </header>
  );
}
