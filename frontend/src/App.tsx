import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Login from "./pages/Login";
import { ProtectedRoute } from "./components/ProtectedRoute";

import { Analytics } from "@vercel/analytics/react";

// Login fica fora do lazy loading (é a primeira tela que a maioria dos usuários vê),
// o resto das páginas só baixa o JS quando o usuário efetivamente navega até lá —
// isso evita carregar mathjs/katex/gsap de páginas do professor no celular de um aluno
// que só vai abrir uma prova, por exemplo.
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Classrooms = lazy(() => import("./pages/Classrooms"));
const ClassRanking = lazy(() => import("./pages/ClassRanking"));
const QuestionBank = lazy(() => import("./pages/QuestionBank"));
const Assessments = lazy(() => import("./pages/Assessments"));
const AssessmentSubmissions = lazy(() => import("./pages/AssessmentSubmissions"));
const GradeSubmission = lazy(() => import("./pages/GradeSubmission"));
const MyClasses = lazy(() => import("./pages/MyClasses"));
const Exam = lazy(() => import("./pages/Exam"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));

function RouteFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#050505]">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-orange-500" />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Analytics />
      <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/minhas-turmas"
          element={
            <ProtectedRoute allow={["STUDENT"]}>
              <MyClasses />
            </ProtectedRoute>
          }
        />
        <Route
          path="/turmas"
          element={
            <ProtectedRoute allow={["TEACHER", "ADMIN"]}>
              <Classrooms />
            </ProtectedRoute>
          }
        />
        <Route
          path="/turmas/:classId/ranking"
          element={
            <ProtectedRoute allow={["TEACHER", "ADMIN"]}>
              <ClassRanking />
            </ProtectedRoute>
          }
        />
        <Route
          path="/banco-de-questoes"
          element={
            <ProtectedRoute allow={["TEACHER", "ADMIN"]}>
              <QuestionBank />
            </ProtectedRoute>
          }
        />
        <Route
          path="/avaliacoes"
          element={
            <ProtectedRoute allow={["TEACHER", "ADMIN"]}>
              <Assessments />
            </ProtectedRoute>
          }
        />
        <Route
          path="/avaliacoes/:assessmentId/submissions"
          element={
            <ProtectedRoute allow={["TEACHER", "ADMIN"]}>
              <AssessmentSubmissions />
            </ProtectedRoute>
          }
        />
        <Route
          path="/avaliacoes/:assessmentId/submissions/:submissionId"
          element={
            <ProtectedRoute allow={["TEACHER", "ADMIN"]}>
              <GradeSubmission />
            </ProtectedRoute>
          }
        />
        <Route
          path="/assessments/:id"
          element={
            <ProtectedRoute>
              <Exam />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
