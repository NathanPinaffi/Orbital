import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { getToken, type Me } from "../lib/api";
import { useMe } from "../hooks/useMe";

export function ProtectedRoute({ children, allow }: { children: ReactNode; allow?: Me["role"][] }) {
  const location = useLocation();
  const me = useMe();

  if (!getToken()) {
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirect}`} replace />;
  }

  if (allow && me && !allow.includes(me.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
