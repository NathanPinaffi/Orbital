import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Classrooms from "./pages/Classrooms";
import ClassRanking from "./pages/ClassRanking";
import QuestionBank from "./pages/QuestionBank";
import Assessments from "./pages/Assessments";
import AssessmentSubmissions from "./pages/AssessmentSubmissions";
import GradeSubmission from "./pages/GradeSubmission";
import MyClasses from "./pages/MyClasses";
import Exam from "./pages/Exam";
import AuthCallback from "./pages/AuthCallback";
import { ProtectedRoute } from "./components/ProtectedRoute";

import { Analytics } from "@vercel/analytics/react";

export default function App() {
  return (
    <BrowserRouter>
      <Analytics />
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
    </BrowserRouter>
  );
}
