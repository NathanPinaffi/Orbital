import SVGtoPDF from "svg-to-pdfkit";
import { renderMathToSvg } from "./mathRender.js";

interface TextSegment {
  math: boolean;
  block: boolean;
  text: string;
}

function splitMath(text: string): TextSegment[] {
  const parts: TextSegment[] = [];
  const pattern = /\$\$([^$]+)\$\$|\$([^$\n]+)\$/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text))) {
    if (match.index > lastIndex) parts.push({ math: false, block: false, text: text.slice(lastIndex, match.index) });
    const block = match[1];
    parts.push({ math: true, block: block !== undefined, text: block ?? match[2] ?? "" });
    lastIndex = pattern.lastIndex;
  }
  if (lastIndex < text.length) parts.push({ math: false, block: false, text: text.slice(lastIndex) });
  return parts;
}

type Token =
  | { kind: "word"; text: string; width: number }
  | { kind: "math"; svg: string; width: number; height: number }
  | { kind: "blockMath"; svg: string; width: number; height: number };

function buildTokens(doc: PDFKit.PDFDocument, content: string, fontSize: number, font: string): Token[] {
  doc.font(font).fontSize(fontSize);
  const tokens: Token[] = [];
  for (const segment of splitMath(content)) {
    if (!segment.math) {
      for (const word of segment.text.split(/\s+/).filter(Boolean)) {
        tokens.push({ kind: "word", text: word, width: doc.widthOfString(word) });
      }
      continue;
    }
    const rendered = renderMathToSvg(segment.text, fontSize, segment.block);
    if (!rendered) {
      for (const word of segment.text.split(/\s+/).filter(Boolean)) {
        tokens.push({ kind: "word", text: word, width: doc.widthOfString(word) });
      }
      continue;
    }
    tokens.push({
      kind: segment.block ? "blockMath" : "math",
      svg: rendered.svg,
      width: rendered.width,
      height: rendered.height,
    });
  }
  return tokens;
}

/** Percorre os tokens simulando a quebra de linha; se `draw` for true, também desenha. */
function walk(
  doc: PDFKit.PDFDocument,
  tokens: Token[],
  x: number,
  startY: number,
  width: number,
  fontSize: number,
  font: string,
  lineHeight: number,
  draw: boolean,
): number {
  doc.font(font).fontSize(fontSize);
  const spaceWidth = doc.widthOfString(" ");
  let cursorX = x;
  let cursorY = startY;

  for (const token of tokens) {
    if (token.kind === "blockMath") {
      if (cursorX !== x) cursorY += lineHeight;
      const scale = Math.min(1, width / token.width);
      const blockWidth = token.width * scale;
      const blockHeight = token.height * scale;
      if (draw) SVGtoPDF(doc, token.svg, x + (width - blockWidth) / 2, cursorY, { width: blockWidth, height: blockHeight });
      cursorY += blockHeight + 6;
      cursorX = x;
      continue;
    }

    if (cursorX !== x && cursorX + token.width > x + width) {
      cursorX = x;
      cursorY += lineHeight;
    }

    if (draw) {
      if (token.kind === "word") {
        doc.font(font).fontSize(fontSize).text(token.text, cursorX, cursorY, { lineBreak: false });
      } else {
        const yOffset = (lineHeight - token.height) / 2;
        SVGtoPDF(doc, token.svg, cursorX, cursorY + yOffset, { width: token.width, height: token.height });
      }
    }
    cursorX += token.width + spaceWidth;
  }

  return cursorY + lineHeight;
}

/**
 * Desenha texto com trechos $...$/$$...$$ renderizados como fórmulas LaTeX reais
 * (vetor, via MathJax — sem depender de navegador ou LaTeX instalado no servidor),
 * quebrando linhas manualmente para intercalar palavras e fórmulas. Se o conteúdo
 * não couber no restante da página, adiciona uma nova página antes de desenhar.
 * Retorna o Y final (abaixo do bloco desenhado).
 */
export function drawRichText(
  doc: PDFKit.PDFDocument,
  content: string,
  x: number,
  startY: number,
  width: number,
  fontSize: number,
  font: string,
): number {
  if (!content.includes("$")) {
    doc.font(font).fontSize(fontSize).text(content, x, startY, { width });
    return doc.y;
  }

  const tokens = buildTokens(doc, content, fontSize, font);
  const lineHeight = fontSize * 1.35;

  let y = startY;
  const neededBottom = walk(doc, tokens, x, y, width, fontSize, font, lineHeight, false);
  const maxY = doc.page.height - doc.page.margins.bottom;
  if (neededBottom > maxY && y > doc.page.margins.top) {
    doc.addPage();
    y = doc.y;
  }

  return walk(doc, tokens, x, y, width, fontSize, font, lineHeight, true);
}
