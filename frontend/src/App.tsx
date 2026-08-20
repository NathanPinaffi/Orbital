import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Classrooms from "./pages/Classrooms";
import QuestionBank from "./pages/QuestionBank";
import Assessments from "./pages/Assessments";
import Exam from "./pages/Exam";
import AuthCallback from "./pages/AuthCallback";
import { ProtectedRoute } from "./components/ProtectedRoute";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route
          path="/turmas"
          element={
            <ProtectedRoute>
              <Classrooms />
            </ProtectedRoute>
          }
        />
        <Route
          path="/banco-de-questoes"
          element={
            <ProtectedRoute>
              <QuestionBank />
            </ProtectedRoute>
          }
        />
        <Route
          path="/avaliacoes"
          element={
            <ProtectedRoute>
              <Assessments />
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
