import { AppShell } from "../components/layout/AppShell";
import { Topbar } from "../components/dashboard/Topbar";
import { ClassroomCoursesCard } from "../components/dashboard/ClassroomCoursesCard";
import { useGsapEntrance } from "../hooks/useGsapEntrance";

export default function Dashboard() {
  const containerRef = useGsapEntrance<HTMLDivElement>();

  return (
    <AppShell>
      <div ref={containerRef}>
        <Topbar />
        <ClassroomCoursesCard />
      </div>
    </AppShell>
  );
}
