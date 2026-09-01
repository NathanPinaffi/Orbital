import { useLayoutEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import gsap from "gsap";
import { AuthBackground } from "../components/layout/AuthBackground";
import { Button } from "../components/ui/Button";
import { TextField } from "../components/ui/TextField";
import { GoogleIcon, LockIcon, MailIcon } from "../components/ui/icons";
import { loginWithGoogle } from "../lib/api";
import { safeRedirectPath } from "../lib/safeRedirect";

import logo from "../assets/logo.png";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [params] = useSearchParams();
  const googleAuthFailed = params.get("error") === "google_auth_failed";
  const redirect = safeRedirectPath(params.get("redirect"));

  const splashLogoRef = useRef<HTMLImageElement>(null);
  const finalLogoRef = useRef<HTMLImageElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLParagraphElement>(null);

  useLayoutEffect(() => {
    const splash = splashLogoRef.current;
    const final = finalLogoRef.current;
    const card = cardRef.current;
    const footer = footerRef.current;
    if (!splash || !final || !card || !footer) return;

    // Estado inicial: logo grande e centralizada na tela, card/rodapé ocultos.
    gsap.set(splash, { opacity: 1, x: 0, y: 0, scale: 1 });
    gsap.set(final, { opacity: 0 });
    gsap.set(card, { opacity: 0, y: 24, filter: "blur(10px)" });
    gsap.set(footer, { opacity: 0, y: 12 });

    // Se o usuário voltou de uma falha de OAuth, pula a introdução.
    const delay = googleAuthFailed ? 0 : 1000;

    const timer = setTimeout(() => {
      const splashRect = splash.getBoundingClientRect();
      const finalRect = final.getBoundingClientRect();
      const scale = finalRect.width / splashRect.width;
      const dx = finalRect.left + finalRect.width / 2 - (splashRect.left + splashRect.width / 2);
      const dy = finalRect.top + finalRect.height / 2 - (splashRect.top + splashRect.height / 2);

      const tl = gsap.timeline();
      tl.to(splash, { x: dx, y: dy, scale, duration: 0.9, ease: "power3.inOut" })
        .to(splash, { opacity: 0, duration: 0.25 }, "-=0.25")
        .to(final, { opacity: 1, duration: 0.25 }, "<")
        .to(card, { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.7, ease: "power3.out" }, "-=0.15")
        .to(footer, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }, "-=0.35");
    }, delay);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthBackground>
      <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center">
        <img ref={splashLogoRef} src={logo} alt="Orbital" className="h-16 w-auto rounded-md" />
      </div>

      <div className="mb-8 sm:mb-10">
        <img ref={finalLogoRef} src={logo} alt="Orbital" className="h-14 w-auto max-w-full rounded-md sm:h-20 md:h-24" />
      </div>

      <div
        ref={cardRef}
        className="electric-card relative max-h-[800px] w-full max-w-[400px] overflow-hidden rounded-[32px] bg-neutral-900 p-[2px]"
      >
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-yellow-300 via-orange-500 to-purple-700 opacity-60" />
        <div className="relative z-10 h-full rounded-[30px] bg-[#0A0A0A] p-8 sm:p-10">
          <div className="mb-8 text-center">
            <h1 className="font-bricolage mb-2 text-3xl font-light tracking-tight text-white">
              Bem-vindo!
            </h1>
          </div>

          {googleAuthFailed && (
            <p className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-center text-xs text-red-400">
              Não foi possível entrar com o Google. Tente novamente.
            </p>
          )}

          <Button type="button" variant="secondary" className="mb-6" onClick={() => loginWithGoogle(redirect)}>
            <GoogleIcon />
            Entrar com Google Sala de Aula
          </Button>


          <p className="mt-8 text-center text-xs text-neutral-500">
            Ainda não tem conta?{" "}
            <a href="#" className="text-white transition-colors hover:text-orange-400">
              Fale com a sua instituição
            </a>
          </p>
        </div>
      </div>

      <p ref={footerRef} className="mt-8 max-w-sm text-center text-[11px] text-neutral-600">
        Ao entrar, você concorda com os Termos de Uso e a Política de Privacidade da Orbital.
      </p>
    </AuthBackground>
  );
}
