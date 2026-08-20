import { Link } from "react-router-dom";
import { GlassCard } from "./GlassCard";
import { Button } from "../ui/Button";
import { GoogleIcon } from "../ui/icons";
import { UsersIcon } from "../ui/dashboardIcons";
import { useClassroomCourses } from "../../hooks/useClassroomCourses";
import { loginWithGoogle } from "../../lib/api";

export function ClassroomCoursesCard() {
  const { status, courses } = useClassroomCourses();

  return (
    <GlassCard data-animate className="p-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h3 className="font-bricolage text-lg font-light tracking-tight text-white">
            Turmas do Google Sala de Aula
          </h3>
          <p className="text-xs text-neutral-500">Sincronizadas diretamente da sua conta</p>
        </div>
        {status === "ready" && (
          <Link to="/turmas" className="text-xs text-orange-400 transition-colors hover:text-orange-300">
            Ver todas
          </Link>
        )}
      </div>

      {status === "loading" && (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-xl bg-white/[0.03]" />
          ))}
        </div>
      )}

      {status === "not_connected" && (
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5 text-center">
          <p className="mb-4 text-sm text-neutral-400">
            Conecte sua conta para ver as turmas do Google Sala de Aula aqui.
          </p>
          <Button type="button" variant="secondary" onClick={() => loginWithGoogle()}>
            <GoogleIcon />
            Conectar com Google
          </Button>
        </div>
      )}

      {status === "error" && (
        <p className="text-sm text-red-400">Não foi possível carregar suas turmas agora.</p>
      )}

      {status === "ready" && courses.length === 0 && (
        <p className="text-sm text-neutral-500">Nenhuma turma ativa encontrada no seu Google Sala de Aula.</p>
      )}

      {status === "ready" && courses.length > 0 && (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {courses.slice(0, 4).map((course) => (
            <div
              key={course.id}
              className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3 transition-colors duration-200 hover:bg-white/[0.05]"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-500/10 text-orange-400">
                <UsersIcon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm text-white">{course.name}</p>
                <p className="truncate text-xs text-neutral-500">
                  {[course.section, course.room].filter(Boolean).join(" · ") || "Google Sala de Aula"}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  );
}
