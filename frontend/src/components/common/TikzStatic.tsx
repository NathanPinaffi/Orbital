import { TikzFigure } from "./TikzFigure";

// A maioria das questões já carrega o SVG compilado uma vez (no momento em que o
// professor salvou a figura, via TikzFigure + onRendered no QuestionFormModal), então
// aqui é só desenhar esse SVG direto — sem baixar o TikZJax nem recompilar TeX. Isso é
// o que torna instantâneo o carregamento no banco de questões, na prova e na correção.
// Questões antigas (criadas antes desse cache existir) caem no fallback e compilam ao vivo.
export function TikzStatic({
  svg,
  source,
  className,
}: {
  svg?: string | null;
  source: string;
  className?: string;
}) {
  if (svg) {
    return (
      <div
        className={`tikzjax-container flex min-h-24 items-center justify-center overflow-x-auto rounded-lg border border-white/10 bg-white p-3 ${className ?? ""}`}
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    );
  }
  return <TikzFigure source={source} className={className} />;
}
