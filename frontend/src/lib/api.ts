export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3333";

export function loginWithGoogle(redirect?: string) {
  const query = redirect ? `?redirect=${encodeURIComponent(redirect)}` : "";
  window.location.href = `${API_URL}/auth/google${query}`;
}

export function saveToken(token: string) {
  localStorage.setItem("orbital_token", token);
}

export function getToken() {
  return localStorage.getItem("orbital_token");
}

export function clearToken() {
  localStorage.removeItem("orbital_token");
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function authFetch(path: string, init?: RequestInit) {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(body.error ?? `Erro ${res.status}`, res.status);
  }

  if (res.status === 204) return undefined;
  return res.json();
}

export interface Me {
  id: string;
  name: string;
  email: string;
  role: "TEACHER" | "STUDENT" | "ADMIN";
}

export function fetchMe(): Promise<Me> {
  return authFetch("/auth/me");
}

export interface ClassroomCourse {
  id: string;
  name: string;
  section?: string;
  room?: string;
}

export function fetchClassroomCourses(): Promise<ClassroomCourse[]> {
  return authFetch("/classroom/courses");
}

export function importClassroomCourse(
  googleCourseId: string,
): Promise<{ classSection: { id: string; name: string }; studentsImported: number }> {
  return authFetch(`/classroom/courses/${googleCourseId}/import`, { method: "POST" });
}

export type QuestionType = "MULTIPLE_CHOICE" | "TRUE_FALSE" | "ESSAY";
export type Difficulty = "EASY" | "MEDIUM" | "HARD";
export type BloomLevel = "REMEMBER" | "UNDERSTAND" | "APPLY" | "ANALYZE" | "EVALUATE" | "CREATE";

export interface Alternative {
  id: string;
  content: string;
  isCorrect: boolean;
}

export interface Question {
  id: string;
  subject: string;
  topic: string;
  content: string;
  type: QuestionType;
  difficulty: Difficulty;
  bloomLevel: BloomLevel;
  alternatives: Alternative[];
  createdAt: string;
}

export type QuestionInput =
  | {
      type: "MULTIPLE_CHOICE";
      subject: string;
      topic: string;
      content: string;
      difficulty: Difficulty;
      bloomLevel: BloomLevel;
      alternatives: { content: string; isCorrect: boolean }[];
    }
  | {
      type: "TRUE_FALSE";
      subject: string;
      topic: string;
      content: string;
      difficulty: Difficulty;
      bloomLevel: BloomLevel;
      correctAnswer: boolean;
    }
  | {
      type: "ESSAY";
      subject: string;
      topic: string;
      content: string;
      difficulty: Difficulty;
      bloomLevel: BloomLevel;
    };

export function fetchQuestions(): Promise<Question[]> {
  return authFetch("/questions");
}

export function createQuestion(input: QuestionInput): Promise<Question> {
  return authFetch("/questions", { method: "POST", body: JSON.stringify(input) });
}

export function updateQuestion(id: string, input: QuestionInput): Promise<Question> {
  return authFetch(`/questions/${id}`, { method: "PUT", body: JSON.stringify(input) });
}

export function deleteQuestion(id: string): Promise<void> {
  return authFetch(`/questions/${id}`, { method: "DELETE" });
}

export interface ClassSummary {
  id: string;
  name: string;
  studentCount: number;
  googleClassroomId: string | null;
}

export function fetchClasses(): Promise<ClassSummary[]> {
  return authFetch("/classes");
}

export type AssessmentStatus = "DRAFT" | "PUBLISHED" | "CLOSED";

export interface AssessmentSummary {
  id: string;
  title: string;
  status: AssessmentStatus;
  durationMinutes: number;
  className: string;
  questionCount: number;
  createdAt: string;
}

export interface CreateAssessmentInput {
  title: string;
  durationMinutes: number;
  classIds: string[];
  questionIds: string[];
}

export interface CreatedAssessment {
  id: string;
  className: string;
  courseWorkId?: string | null;
  alternateLink?: string | null;
}

export function fetchAssessments(): Promise<AssessmentSummary[]> {
  return authFetch("/assessments");
}

export function createAssessment(input: CreateAssessmentInput): Promise<CreatedAssessment[]> {
  return authFetch("/assessments", { method: "POST", body: JSON.stringify(input) });
}

export interface ExamAlternative {
  id: string;
  content: string;
}

export interface ExamQuestion {
  id: string;
  content: string;
  type: QuestionType;
  alternatives: ExamAlternative[];
}

export type ExamState =
  | { status: "not_started"; title: string; durationMinutes: number; questionCount: number }
  | { status: "in_progress"; title: string; remainingSeconds: number; questions: ExamQuestion[] }
  | { status: "submitted"; score: number | null };

export function fetchExam(assessmentId: string): Promise<ExamState> {
  return authFetch(`/exams/${assessmentId}`);
}

export function startExam(assessmentId: string): Promise<{ startedAt: string }> {
  return authFetch(`/exams/${assessmentId}/start`, { method: "POST" });
}

export function submitExam(
  assessmentId: string,
  answers: { questionId: string; response: string }[],
): Promise<{ status: "submitted"; score: number | null }> {
  return authFetch(`/exams/${assessmentId}/submit`, { method: "POST", body: JSON.stringify({ answers }) });
}
