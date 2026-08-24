import { mathjax } from "mathjax-full/js/mathjax.js";
import { TeX } from "mathjax-full/js/input/tex.js";
import { SVG } from "mathjax-full/js/output/svg.js";
import { liteAdaptor } from "mathjax-full/js/adaptors/liteAdaptor.js";
import { RegisterHTMLHandler } from "mathjax-full/js/handlers/html.js";
import { AllPackages } from "mathjax-full/js/input/tex/AllPackages.js";

const adaptor = liteAdaptor();
RegisterHTMLHandler(adaptor);
const texInput = new TeX({ packages: AllPackages });
const svgOutput = new SVG({ fontCache: "none" });
const mathDocument = mathjax.document("", { InputJax: texInput, OutputJax: svgOutput });

// MathJax reports SVG width/height/vertical-align in "ex" units meant for a
// surrounding CSS context where 1ex == 0.5em. Since we render headless (no
// browser/CSS), we apply that same convention ourselves to size the output
// in points relative to the font size used in the surrounding PDF text.
const EX_TO_EM = 0.5;

export interface RenderedMath {
  svg: string;
  width: number;
  height: number;
  /** Parte da imagem abaixo da linha de base do texto (em pt), para alinhamento vertical. */
  depth: number;
}

/** Renderiza uma expressão LaTeX para SVG (vetor, sem dependência de navegador/LaTeX no sistema). */
export function renderMathToSvg(latex: string, fontSizePt: number, display: boolean): RenderedMath | null {
  try {
    const node = mathDocument.convert(latex, { display });
    const svgNode = adaptor.firstChild(node) as unknown;
    let svg = adaptor.outerHTML(svgNode as never);

    const widthMatch = /width="([\d.]+)ex"/.exec(svg);
    const heightMatch = /height="([\d.]+)ex"/.exec(svg);
    const alignMatch = /vertical-align:\s*(-?[\d.]+)ex/.exec(svg);
    if (!widthMatch || !heightMatch) return null;

    const exToPt = fontSizePt * EX_TO_EM;
    const width = parseFloat(widthMatch[1]) * exToPt;
    const height = parseFloat(heightMatch[1]) * exToPt;
    const verticalAlign = alignMatch ? parseFloat(alignMatch[1]) * exToPt : 0;
    const depth = Math.max(0, -verticalAlign);

    svg = svg.replace(/currentColor/g, "black");

    return { svg, width, height, depth };
  } catch {
    return null;
  }
}
