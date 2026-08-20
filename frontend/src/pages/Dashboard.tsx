import { AppShell } from "../components/layout/AppShell";
import { Topbar } from "../components/dashboard/Topbar";
import { StatCard } from "../components/dashboard/StatCard";
import { ScoreTrendCard } from "../components/dashboard/ScoreTrendCard";
import { BloomChart } from "../components/dashboard/BloomChart";
import { AssessmentsList } from "../components/dashboard/AssessmentsList";
import { ActivityFeed } from "../components/dashboard/ActivityFeed";
import { ClassesPanel } from "../components/dashboard/ClassesPanel";
import { useGsapEntrance } from "../hooks/useGsapEntrance";
import { activity, assessments, bloomDistribution, classes, scoreTrend, stats } from "../data/mockDashboard";

export default function Dashboard() {
  const containerRef = useGsapEntrance<HTMLDivElement>();

  return (
    <AppShell>
      <div ref={containerRef}>
        <Topbar />

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((s) => (
            <StatCard
              key={s.id}
              label={s.label}
              value={s.value}
              decimals={s.id === "avgScore" ? 1 : 0}
              delta={s.delta}
              trend={s.trend}
            />
          ))}
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-12">
          <div className="xl:col-span-5">
            <ScoreTrendCard values={scoreTrend} current={stats[2].value} />
          </div>
          <div className="xl:col-span-7">
            <BloomChart data={bloomDistribution} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          <div className="xl:col-span-7">
            <AssessmentsList items={assessments} />
          </div>
          <div className="space-y-4 xl:col-span-5">
            <ClassesPanel items={classes} />
            <ActivityFeed items={activity} />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
