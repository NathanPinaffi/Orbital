import { useEffect, useState } from "react";
import { AppShell } from "../components/layout/AppShell";
import { Topbar } from "../components/dashboard/Topbar";
import { ClassroomCoursesCard } from "../components/dashboard/ClassroomCoursesCard";
import { StudentDashboard } from "../components/dashboard/StudentDashboard";
import { RecentActivityCard, UpcomingCard, CalendarCard } from "../components/dashboard/OverviewCards";
import { useGsapEntrance } from "../hooks/useGsapEntrance";
import { useMe } from "../hooks/useMe";
import { fetchAssessments, type AssessmentSummary } from "../lib/api";

function TeacherDashboard() {
  const [assessments, setAssessments] = useState<AssessmentSummary[]>([]);

  useEffect(() => {
    fetchAssessments()
      .then(setAssessments)
      .catch(() => setAssessments([]));
  }, []);

  return (
    <div className="space-y-6">
      <ClassroomCoursesCard />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <RecentActivityCard assessments={assessments} />
        <UpcomingCard assessments={assessments} />
        <CalendarCard assessments={assessments} />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const containerRef = useGsapEntrance<HTMLDivElement>();
  const me = useMe();

  return (
    <AppShell>
      <div ref={containerRef}>
        <Topbar />
        {me?.role === "STUDENT" ? <StudentDashboard /> : <TeacherDashboard />}
      </div>
    </AppShell>
  );
}
