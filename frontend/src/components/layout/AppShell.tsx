import type { ReactNode } from "react";
import { Sidebar } from "../dashboard/Sidebar";
import { teacher } from "../../data/mockDashboard";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#050505] text-white">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="stars absolute inset-0" />
        <div className="absolute top-0 left-1/3 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-orange-900/10 blur-[130px]" />
        <div className="absolute bottom-0 right-0 h-[500px] w-[500px] rounded-full bg-orange-950/20 blur-[110px]" />
      </div>

      <Sidebar teacherName={teacher.name} initials={teacher.initials} />

      <main className="relative z-10 flex-1 overflow-y-auto px-6 py-8 sm:px-10">{children}</main>
    </div>
  );
}
