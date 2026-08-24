import PDFDocument from "pdfkit";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOGO_PATH = path.join(__dirname, "..", "..", "assets", "logo.png");
const LOGO_ASPECT_RATIO = 300 / 933;

const LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H"];

interface AlternativeInput {
  content: string;
  isCorrect: boolean;
}

interface QuestionInput {
  content: string;
  type: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER" | "ESSAY";
  points: number;
  alternatives: AlternativeInput[];
  requiresSketch: boolean;
}

interface AssessmentPdfInput {
  title: string;
  teacherName: string;
  className: string;
  questions: QuestionInput[];
}

/**
 * Monta o PDF da prova em tipografia serifada (estilo LaTeX), com nome do
 * professor no cabeçalho e uma marca d'água translúcida do logo da Orbital
 * repetida em toda página (inclusive as adicionadas automaticamente pelo
 * fluxo de texto do pdfkit quando o conteúdo ultrapassa uma página).
 */
export function generateAssessmentPdf({ title, teacherName, className, questions }: AssessmentPdfInput) {
  const doc = new PDFDocument({ size: "A4", margin: 56 });

  function drawWatermark() {
    const width = 320;
    const height = width * LOGO_ASPECT_RATIO;
    doc.opacity(0.06);
    doc.image(LOGO_PATH, (doc.page.width - width) / 2, (doc.page.height - height) / 2, { width });
    doc.opacity(1);
  }

  doc.on("pageAdded", drawWatermark);
  drawWatermark();

  doc.font("Times-Bold").fontSize(18).text(title, { align: "center" });
  doc.moveDown(0.4);
  doc.font("Times-Roman").fontSize(11);
  doc.text(`Professor(a): ${teacherName}`, { align: "center" });
  doc.text(`Turma: ${className}`, { align: "center" });
  doc.moveDown(1);

  doc.fontSize(11).text("Nome do aluno: ________________________________________________", { align: "left" });
  doc.moveDown(1.2);

  questions.forEach((question, index) => {
    doc.font("Times-Bold").fontSize(12).text(`${index + 1}. `, { continued: true });
    const pointsLabel = question.points === 1 ? "ponto" : "pontos";
    doc.font("Times-Roman").fontSize(12).text(`${question.content} (${question.points} ${pointsLabel})`);
    doc.moveDown(0.4);

    if (question.type === "MULTIPLE_CHOICE" || question.type === "TRUE_FALSE") {
      question.alternatives.forEach((alt, altIndex) => {
        doc.font("Times-Roman").fontSize(11).text(`${LETTERS[altIndex] ?? "?"}) ${alt.content}`, { indent: 20 });
      });
    } else {
      const lineCount = question.requiresSketch ? 2 : 5;
      for (let i = 0; i < lineCount; i++) {
        doc.moveDown(1.1);
        doc
          .moveTo(doc.x, doc.y)
          .lineTo(doc.page.width - doc.page.margins.right, doc.y)
          .strokeColor("#aaaaaa")
          .stroke();
      }

      if (question.requiresSketch) {
        doc.moveDown(0.8);
        doc.font("Times-Italic").fontSize(10).fillColor("#666666").text("Espaço para o esboço do gráfico:");
        doc.fillColor("black");
        const boxWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
        doc.rect(doc.x, doc.y + 4, boxWidth, 140).strokeColor("#aaaaaa").stroke();
        doc.moveDown(8.5);
      }
    }

    doc.moveDown(1);
  });

  doc.end();
  return doc;
}
