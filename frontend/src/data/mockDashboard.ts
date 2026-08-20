export const teacher = {
  name: "Profª. Camila Duarte",
  email: "camila.duarte@escola.edu.br",
  initials: "CD",
};

export const stats = [
  { id: "assessments", label: "Avaliações ativas", value: 12, delta: "+3", trend: "up" as const },
  { id: "students", label: "Alunos alcançados", value: 341, delta: "+18", trend: "up" as const },
  { id: "avgScore", label: "Nota média geral", value: 7.8, suffix: "", delta: "+0.4", trend: "up" as const },
  { id: "pending", label: "Correções pendentes", value: 27, delta: "-9", trend: "down" as const },
];

export const bloomDistribution = [
  { level: "Lembrar", value: 18, color: "#fde68a" },
  { level: "Compreender", value: 24, color: "#fbbf24" },
  { level: "Aplicar", value: 21, color: "#f59e0b" },
  { level: "Analisar", value: 16, color: "#f97316" },
  { level: "Avaliar", value: 12, color: "#ea580c" },
  { level: "Criar", value: 9, color: "#c2410c" },
];

export type AssessmentStatus = "Rascunho" | "Publicada" | "Corrigindo" | "Concluída";

export const assessments: Array<{
  id: string;
  title: string;
  className: string;
  status: AssessmentStatus;
  progress: number;
  dueDate: string;
  bloomFocus: string;
}> = [
  { id: "a1", title: "Revolução Industrial — Prova 2", className: "9º Ano B — História", status: "Corrigindo", progress: 72, dueDate: "22 ago", bloomFocus: "Analisar" },
  { id: "a2", title: "Funções Quadráticas", className: "1ª Série A — Matemática", status: "Publicada", progress: 45, dueDate: "25 ago", bloomFocus: "Aplicar" },
  { id: "a3", title: "Interpretação de Texto — Conto", className: "8º Ano A — Português", status: "Concluída", progress: 100, dueDate: "18 ago", bloomFocus: "Compreender" },
  { id: "a4", title: "Ciclo da Água e Biomas", className: "6º Ano C — Ciências", status: "Rascunho", progress: 0, dueDate: "30 ago", bloomFocus: "Lembrar" },
  { id: "a5", title: "Projeto: Redação Dissertativa", className: "3ª Série A — Redação", status: "Publicada", progress: 61, dueDate: "27 ago", bloomFocus: "Criar" },
];

export const activity: Array<{
  id: string;
  actor: string;
  action: string;
  target: string;
  time: string;
}> = [
  { id: "e1", actor: "IA de Correção", action: "corrigiu 14 respostas discursivas de", target: "Revolução Industrial — Prova 2", time: "há 6 min" },
  { id: "e2", actor: "Lucas Ferreira", action: "enviou a resposta de", target: "Funções Quadráticas", time: "há 22 min" },
  { id: "e3", actor: "Monitoramento", action: "sinalizou padrão incomum em", target: "Interpretação de Texto — Conto", time: "há 41 min" },
  { id: "e4", actor: "Você", action: "publicou", target: "Projeto: Redação Dissertativa", time: "há 2 h" },
  { id: "e5", actor: "Banco de Questões", action: "recebeu 8 novas questões em", target: "Ciências — 6º Ano", time: "há 5 h" },
];

export const classes = [
  { id: "c1", name: "9º Ano B", subject: "História", students: 32 },
  { id: "c2", name: "1ª Série A", subject: "Matemática", students: 29 },
  { id: "c3", name: "8º Ano A", subject: "Português", students: 34 },
  { id: "c4", name: "6º Ano C", subject: "Ciências", students: 27 },
];

export const scoreTrend = [42, 48, 45, 55, 60, 58, 66, 70, 68, 74, 71, 78];
