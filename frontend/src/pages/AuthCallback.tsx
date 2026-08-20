import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { saveToken } from "../lib/api";

export default function AuthCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = params.get("token");
    if (token) {
      saveToken(token);
      navigate("/dashboard", { replace: true });
    } else {
      navigate("/login?error=google_auth_failed", { replace: true });
    }
  }, [params, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#050505] text-neutral-400">
      Entrando…
    </div>
  );
}
