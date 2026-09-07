import { useEffect, useRef, useState } from "react";

// TikZJax roda um TeX real compilado pra WebAssembly no navegador (lib "@drgrice1/tikzjax",
// arquivos servidos de /public/tikzjax) e converte <script type="text/tikz"> em SVG. Os
// assets (~9MB: WASM do TeX + fontes) só são baixados na primeira vez que uma figura em TikZ
// aparece na tela — nunca entram no bundle JS nem pesam nas páginas que não usam TikZ.
let tikzJaxPromise: Promise<void> | null = null;

function loadTikzJax(): Promise<void> {
  if (tikzJaxPromise) return tikzJaxPromise;

  tikzJaxPromise = new Promise((resolve, reject) => {
    if (!document.querySelector('link[data-tikzjax-fonts]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "/tikzjax/fonts.css";
      link.setAttribute("data-tikzjax-fonts", "true");
      document.head.appendChild(link);
    }

    const script = document.createElement("script");
    script.src = "/tikzjax/tikzjax.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Não foi possível carregar o TikZJax."));
    document.head.appendChild(script);
  });

  return tikzJaxPromise;
}

// Bibliotecas TikZ mais usadas em figuras escolares (geometria, setas, posicionamento,
// ângulos/legendas) já disponíveis de cara, sem o professor precisar saber que existe
// um mecanismo de "libraries" por trás.
const DEFAULT_LIBRARIES = "arrows.meta,calc,positioning,angles,quotes,patterns,decorations.pathmorphing";

export function TikzFigure({ source, className }: { source: string; className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");

    loadTikzJax()
      .then(() => {
        if (cancelled || !containerRef.current) return;
        containerRef.current.innerHTML = "";
        const script = document.createElement("script");
        script.type = "text/tikz";
        script.setAttribute("data-tikz-libraries", DEFAULT_LIBRARIES);
        script.textContent = source;
        containerRef.current.appendChild(script);
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [source]);

  useEffect(() => {
    function onFinished(e: Event) {
      if (containerRef.current?.contains(e.target as Node)) setStatus("ready");
    }
    function onError(e: Event) {
      if (containerRef.current?.contains(e.target as Node)) setStatus("error");
    }
    document.addEventListener("tikzjax-load-finished", onFinished);
    document.addEventListener("tikzjax-error", onError);
    return () => {
      document.removeEventListener("tikzjax-load-finished", onFinished);
      document.removeEventListener("tikzjax-error", onError);
    };
  }, []);

  return (
    <div
      className={`tikzjax-container relative flex min-h-24 items-center justify-center overflow-x-auto rounded-lg border border-white/10 bg-white p-3 ${className ?? ""}`}
    >
      {status !== "ready" && (
        <p className="text-xs text-neutral-500">
          {status === "error" ? "Não foi possível renderizar a figura em TikZ." : "Renderizando figura…"}
        </p>
      )}
      <div ref={containerRef} className={status === "ready" ? "" : "hidden"} />
    </div>
  );
}
