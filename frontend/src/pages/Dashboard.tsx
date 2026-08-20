import { AppShell } from "../components/layout/AppShell";
import { Topbar } from "../components/dashboard/Topbar";
import { ClassroomCoursesCard } from "../components/dashboard/ClassroomCoursesCard";
import { StudentDashboard } from "../components/dashboard/StudentDashboard";
import { useGsapEntrance } from "../hooks/useGsapEntrance";
import { useMe } from "../hooks/useMe";

export default function Dashboard() {
  const containerRef = useGsapEntrance<HTMLDivElement>();
  const me = useMe();

  return (
    <AppShell>
      <div ref={containerRef}>
        <Topbar />
        {me?.role === "STUDENT" ? <StudentDashboard /> : <ClassroomCoursesCard />}
      </div>
    </AppShell>
  );
}
