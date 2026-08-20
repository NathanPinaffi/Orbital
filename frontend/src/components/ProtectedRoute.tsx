import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { getToken } from "../lib/api";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const location = useLocation();
  if (!getToken()) {
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirect}`} replace />;
  }
  return <>{children}</>;
}
