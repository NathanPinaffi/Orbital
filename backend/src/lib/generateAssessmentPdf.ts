import PDFDocument from "pdfkit";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { drawRichText } from "./richText.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOGO_PATH = path.join(__dirname, "..", "..", "assets", "logo-black.png");
const LOGO_ASPECT_RATIO = 300 / 933;

const LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H"];
const MARGIN = 56;

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
  durationMinutes: number;
  dateLabel: string;
  questions: QuestionInput[];
}

function formatPoints(points: number) {
  return Number.isInteger(points) ? String(points) : points.toFixed(1);
}

/**
 * Monta o PDF da prova no estilo de uma prova acadêmica (capa com identificação,
 * quadro de notas e instruções; folhas de questões com cabeçalho corrido).
 * Uma marca d'água translúcida do logo da Orbital fica no canto inferior direito
 * de toda página, adicionada no final via bufferPages para poder numerar as páginas.
 */
export function generateAssessmentPdf({
  title,
  teacherName,
  className,
  durationMinutes,
  dateLabel,
  questions,
}: AssessmentPdfInput) {
  const doc = new PDFDocument({ size: "A4", margin: MARGIN, bufferPages: true });
  const pageWidth = doc.page.width;
  const usableWidth = pageWidth - 2 * MARGIN;

  // ---------- Capa ----------
  const logoWidth = 110;
  const logoHeight = logoWidth * LOGO_ASPECT_RATIO;
  const coverTop = doc.y;
  doc.image(LOGO_PATH, MARGIN, coverTop, { width: logoWidth });

  const textX = MARGIN + logoWidth + 16;
  const textWidth = pageWidth - MARGIN - textX;
  doc.font("Times-Roman").fontSize(10).fillColor("#555").text("Orbital", textX, coverTop, { width: textWidth });
  doc.fillColor("black");
  doc.font("Times-Bold").fontSize(14).text(title, textX, doc.y, { width: textWidth });
  doc.font("Times-Roman").fontSize(10.5);
  doc.text(`Professor(a): ${teacherName}`, textX, doc.y, { width: textWidth });
  doc.text(`Turma: ${className}`, textX, doc.y, { width: textWidth });
  doc.text(dateLabel, textX, doc.y, { width: textWidth });

  doc.y = Math.max(doc.y, coverTop + logoHeight) + 22;

  doc.font("Times-Roman").fontSize(11);
  doc.text("Nome do aluno: ________________________________________________", MARGIN, doc.y, { width: usableWidth });
  doc.moveDown(1.4);

  drawGradeTable(doc, questions, MARGIN, usableWidth);

  doc.moveDown(0.8);
  doc.font("Times-Bold").fontSize(11).text("Instruções para realização e entrega de sua prova:", MARGIN, doc.y, { width: usableWidth });
  doc.moveDown(0.4);
  doc.font("Times-Roman").fontSize(10.5);
  const instructions = [
    `Esta prova terá ${durationMinutes} minutos de duração.`,
    "Escreva de forma clara e legível; respostas ilegíveis podem não ser consideradas.",
    "Não é permitido o uso de celular ou qualquer outro recurso eletrônico durante a prova.",
    "Ao entregar a prova, você atesta que não utilizou nenhum meio fraudulento para realizá-la.",
  ];
  instructions.forEach((text, i) => {
    doc.text(`${i + 1}. ${text}`, MARGIN + 14, doc.y, { width: usableWidth - 14 });
    doc.moveDown(0.3);
  });

  doc.moveDown(1);
  const questionWord = questions.length === 1 ? "questão" : "questões";
  doc
    .font("Times-Bold")
    .fontSize(10.5)
    .text(
      `As questões da prova começam na próxima página. Esta prova tem ${questions.length} ${questionWord}.`,
      MARGIN,
      doc.y,
      { width: usableWidth },
    );

  // ---------- Folhas de questões ----------
  doc.on("pageAdded", () => drawContentHeader(doc, title, className, usableWidth, pageWidth));
  doc.addPage();

  questions.forEach((question, index) => {
    const prefix = `Q${index + 1}. `;
    const questionTop = doc.y;
    doc.font("Times-Bold").fontSize(12).text(prefix, MARGIN, questionTop, { lineBreak: false });
    const prefixWidth = doc.widthOfString(prefix);
    const pointsLabel = question.points === 1 ? "ponto" : "pontos";
    const bodyText = `${question.content} (${formatPoints(question.points)} ${pointsLabel})`;
    doc.y = drawRichText(doc, bodyText, MARGIN + prefixWidth, questionTop, usableWidth - prefixWidth, 12, "Times-Roman");
    doc.moveDown(0.4);

    if (question.type === "MULTIPLE_CHOICE" || question.type === "TRUE_FALSE") {
      question.alternatives.forEach((alt, altIndex) => {
        const label = `${LETTERS[altIndex] ?? "?"}) `;
        const altTop = doc.y;
        doc.font("Times-Roman").fontSize(11).text(label, MARGIN + 20, altTop, { lineBreak: false });
        const labelWidth = doc.widthOfString(label);
        doc.y = drawRichText(doc, alt.content, MARGIN + 20 + labelWidth, altTop, usableWidth - 20 - labelWidth, 11, "Times-Roman");
      });
    } else {
      doc.moveDown(5 * 1.1);
    }

    doc.moveDown(1);
  });

  // ---------- Rodapé (numeração + marca d'água) em todas as páginas ----------
  doc.removeAllListeners("pageAdded");
  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(range.start + i);
    drawFooter(doc, i + 1, range.count);
  }

  doc.end();
  return doc;
}

function drawGradeTable(doc: PDFKit.PDFDocument, questions: QuestionInput[], x: number, width: number) {
  const labelColWidth = 68;
  const dataCols = questions.length + 1;
  const colWidth = (width - labelColWidth) / dataCols;
  const rowHeight = 20;
  const y0 = doc.y;
  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);

  const rowLabels = ["Questão:", "Valor:", "Nota:"];
  const headerCells = questions.map((_, i) => `Q${i + 1}`).concat(["Total"]);
  const valueCells = questions.map((q) => formatPoints(q.points)).concat([formatPoints(totalPoints)]);
  const notaCells = new Array(dataCols).fill("");
  const dataRows: string[][] = [headerCells, valueCells, notaCells];

  doc.lineWidth(0.75).strokeColor("#000");
  for (let r = 0; r <= 3; r++) {
    doc.moveTo(x, y0 + r * rowHeight).lineTo(x + width, y0 + r * rowHeight).stroke();
  }
  doc.moveTo(x, y0).lineTo(x, y0 + 3 * rowHeight).stroke();
  doc.moveTo(x + labelColWidth, y0).lineTo(x + labelColWidth, y0 + 3 * rowHeight).stroke();
  for (let c = 1; c <= dataCols; c++) {
    const cx = x + labelColWidth + c * colWidth;
    doc.moveTo(cx, y0).lineTo(cx, y0 + 3 * rowHeight).stroke();
  }

  for (let r = 0; r < 3; r++) {
    const rowY = y0 + r * rowHeight + 6;
    doc.font("Times-Bold").fontSize(9.5).text(rowLabels[r], x + 6, rowY, { width: labelColWidth - 10, lineBreak: false });
    for (let c = 0; c < dataCols; c++) {
      const cellX = x + labelColWidth + c * colWidth;
      doc
        .font(r === 0 ? "Times-Bold" : "Times-Roman")
        .fontSize(9.5)
        .text(dataRows[r][c], cellX, rowY, { width: colWidth, align: "center", lineBreak: false });
    }
  }

  doc.x = x;
  doc.y = y0 + 3 * rowHeight + 14;
}

function drawContentHeader(
  doc: PDFKit.PDFDocument,
  title: string,
  className: string,
  usableWidth: number,
  pageWidth: number,
) {
  const savedX = doc.x;
  const savedY = doc.y;
  const headerY = 28;
  const halfWidth = usableWidth / 2 - 6;

  doc.font("Times-Roman").fontSize(9).fillColor("#666");
  doc.text(title, MARGIN, headerY, { width: halfWidth, lineBreak: false });
  doc.text(className, MARGIN + halfWidth + 12, headerY, { width: halfWidth, align: "right", lineBreak: false });
  doc.fillColor("black");

  doc
    .moveTo(MARGIN, headerY + 14)
    .lineTo(pageWidth - MARGIN, headerY + 14)
    .strokeColor("#cccccc")
    .lineWidth(0.5)
    .stroke();

  doc.x = savedX;
  doc.y = savedY;
}

function drawFooter(doc: PDFKit.PDFDocument, pageNumber: number, totalPages: number) {
  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;

  // Escrever dentro da margem inferior faria o pdfkit paginar automaticamente
  // (mesmo com coordenadas explícitas), então a margem é zerada temporariamente.
  const originalBottomMargin = doc.page.margins.bottom;
  doc.page.margins.bottom = 0;

  const wmWidth = 90;
  const wmHeight = wmWidth * LOGO_ASPECT_RATIO;
  doc.opacity(0.3);
  doc.image(LOGO_PATH, pageWidth - wmWidth - 30, pageHeight - wmHeight - 30, { width: wmWidth });
  doc.opacity(1);

  doc
    .font("Times-Roman")
    .fontSize(9)
    .fillColor("#555")
    .text(`Página ${pageNumber} de ${totalPages}`, 0, pageHeight - 40, { width: pageWidth, align: "center" });
  doc.fillColor("black");

  doc.page.margins.bottom = originalBottomMargin;
}
