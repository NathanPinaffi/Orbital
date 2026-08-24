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

export type NotificationType = "DUE_SOON" | "NEW_ASSESSMENT";

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  assessmentId: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationsResponse {
  unreadCount: number;
  notifications: NotificationItem[];
}

export function fetchNotifications(): Promise<NotificationsResponse> {
  return authFetch("/notifications");
}

export function markNotificationRead(id: string): Promise<void> {
  return authFetch(`/notifications/${id}/read`, { method: "POST" });
}

export function markAllNotificationsRead(): Promise<void> {
  return authFetch("/notifications/read-all", { method: "POST" });
}

export interface Me {
  id: string;
  name: string;
  email: string;
  role: "TEACHER" | "STUDENT" | "ADMIN";
  avatarUrl: string | null;
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

export interface ImportAllResult {
  imported: Array<{
    courseId: string;
    classSectionId: string;
    className: string;
    studentsImported: number;
    missingEmail: number;
  }>;
  skipped: Array<{ courseId: string; reason: string }>;
}

export function importAllClassroomCourses(): Promise<ImportAllResult> {
  return authFetch("/classroom/courses/import-all", { method: "POST" });
}

export type QuestionType = "MULTIPLE_CHOICE" | "TRUE_FALSE" | "ESSAY";
export type Difficulty = "EASY" | "MEDIUM" | "HARD";
export type BloomLevel = "REMEMBER" | "UNDERSTAND" | "APPLY" | "ANALYZE" | "EVALUATE" | "CREATE";

export interface Alternative {
  id: string;
  content: string;
  isCorrect: boolean;
}

export interface QuestionGraph {
  expression: string;
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

export type BankVisibility = "PRIVATE" | "PUBLIC";

export interface QuestionBankSummary {
  id: string;
  name: string;
  visibility: BankVisibility;
  ownerName: string;
  questionCount: number;
}

export interface QuestionBankLite {
  id: string;
  name: string;
  visibility: BankVisibility;
  ownerId: string;
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
  bank: QuestionBankLite;
  graph: QuestionGraph | null;
  requiresSketch: boolean;
}

export type QuestionInput =
  | {
      type: "MULTIPLE_CHOICE";
      bankId: string;
      subject: string;
      topic: string;
      content: string;
      difficulty: Difficulty;
      bloomLevel: BloomLevel;
      alternatives: { content: string; isCorrect: boolean }[];
      graph?: QuestionGraph | null;
      requiresSketch?: boolean;
    }
  | {
      type: "TRUE_FALSE";
      bankId: string;
      subject: string;
      topic: string;
      content: string;
      difficulty: Difficulty;
      bloomLevel: BloomLevel;
      correctAnswer: boolean;
      graph?: QuestionGraph | null;
      requiresSketch?: boolean;
    }
  | {
      type: "ESSAY";
      bankId: string;
      subject: string;
      topic: string;
      content: string;
      difficulty: Difficulty;
      bloomLevel: BloomLevel;
      graph?: QuestionGraph | null;
      requiresSketch?: boolean;
    };

export function fetchQuestionBanks(): Promise<{ mine: QuestionBankSummary[]; public: QuestionBankSummary[] }> {
  return authFetch("/question-banks");
}

export function createQuestionBank(input: { name: string; visibility: BankVisibility }): Promise<QuestionBankSummary> {
  return authFetch("/question-banks", { method: "POST", body: JSON.stringify(input) });
}

export function updateQuestionBank(
  id: string,
  input: Partial<{ name: string; visibility: BankVisibility }>,
): Promise<QuestionBankSummary> {
  return authFetch(`/question-banks/${id}`, { method: "PATCH", body: JSON.stringify(input) });
}

export function deleteQuestionBank(id: string): Promise<void> {
  return authFetch(`/question-banks/${id}`, { method: "DELETE" });
}

export function fetchQuestions(bankId?: string): Promise<Question[]> {
  return authFetch(bankId ? `/questions?bankId=${bankId}` : "/questions");
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

export interface ClassRankingEntry {
  rank: number;
  studentId: string;
  studentName: string;
  avatarUrl: string | null;
  average: number | null;
  submissionsCount: number;
}

export interface ClassRanking {
  className: string;
  ranking: ClassRankingEntry[];
}

export function fetchClassRanking(classId: string): Promise<ClassRanking> {
  return authFetch(`/classes/${classId}/ranking`);
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
  dueAt: string | null;
}

export interface CreateAssessmentInput {
  title: string;
  durationMinutes: number;
  breakStartMinute?: number;
  breakDurationMinutes?: number;
  classIds: string[];
  questionIds: string[];
  dueAt?: string;
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

export function deleteAssessment(assessmentId: string): Promise<void> {
  return authFetch(`/assessments/${assessmentId}`, { method: "DELETE" });
}

export interface ExamAlternative {
  id: string;
  content: string;
}

export type Stroke = [number, number][];

export interface ExamQuestion {
  id: string;
  content: string;
  type: QuestionType;
  alternatives: ExamAlternative[];
  graph: QuestionGraph | null;
  requiresSketch: boolean;
}

export type ExamState =
  | { status: "not_started"; title: string; durationMinutes: number; questionCount: number }
  | {
      status: "in_progress";
      title: string;
      remainingSeconds: number;
      questions: ExamQuestion[];
      onBreakNow: boolean;
      secondsUntilBreak: number | null;
      breakDurationSeconds: number | null;
    }
  | { status: "submitted"; score: number | null };

export function fetchExam(assessmentId: string): Promise<ExamState> {
  return authFetch(`/exams/${assessmentId}`);
}

export function startExam(assessmentId: string): Promise<{ startedAt: string }> {
  return authFetch(`/exams/${assessmentId}/start`, { method: "POST" });
}

export function submitExam(
  assessmentId: string,
  answers: { questionId: string; response: string; sketch?: Stroke[] }[],
): Promise<{ status: "submitted"; score: number | null }> {
  return authFetch(`/exams/${assessmentId}/submit`, { method: "POST", body: JSON.stringify({ answers }) });
}

export interface StudentDashboardClass {
  id: string;
  name: string;
  teacherName: string;
}

export interface StudentDashboardSubmission {
  id: string;
  assessmentId: string;
  assessmentTitle: string;
  className: string;
  submittedAt: string;
  score: number | null;
}

export interface StudentDashboard {
  classes: StudentDashboardClass[];
  submissions: StudentDashboardSubmission[];
}

export function fetchStudentDashboard(): Promise<StudentDashboard> {
  return authFetch("/dashboard/student");
}

export type SubmissionStatus = "not_started" | "in_progress" | "submitted";

export interface SubmissionListItem {
  submissionId: string | null;
  studentId: string;
  studentName: string;
  avatarUrl: string | null;
  status: SubmissionStatus;
  submittedAt: string | null;
  score: number | null;
  hasUngraded: boolean;
  gradePublishedAt: string | null;
}

export interface AssessmentSubmissionsResponse {
  assessment: { id: string; title: string; status: AssessmentStatus; googleCourseWorkId: string | null };
  submissions: SubmissionListItem[];
}

export function fetchAssessmentSubmissions(assessmentId: string): Promise<AssessmentSubmissionsResponse> {
  return authFetch(`/assessments/${assessmentId}/submissions`);
}

export interface GradingAlternative {
  id: string;
  content: string;
  isCorrect: boolean;
}

export interface GradingAnswer {
  id: string;
  response: string;
  sketchData: Stroke[] | null;
  isCorrect: boolean | null;
  points: number | null;
  teacherComment: string | null;
  gradedAt: string | null;
}

export interface GradingQuestion {
  questionId: string;
  content: string;
  type: QuestionType;
  maxPoints: number;
  alternatives: GradingAlternative[];
  answer: GradingAnswer | null;
  graph: QuestionGraph | null;
  requiresSketch: boolean;
}

export interface SubmissionDetail {
  submission: {
    id: string;
    studentId: string;
    studentName: string;
    avatarUrl: string | null;
    submittedAt: string | null;
    score: number | null;
    gradePublishedAt: string | null;
  };
  questions: GradingQuestion[];
}

export function fetchSubmissionDetail(assessmentId: string, submissionId: string): Promise<SubmissionDetail> {
  return authFetch(`/assessments/${assessmentId}/submissions/${submissionId}`);
}

export function gradeAnswer(
  assessmentId: string,
  submissionId: string,
  answerId: string,
  input: { points: number; teacherComment?: string },
): Promise<{ answer: GradingAnswer; submission: { id: string; score: number | null } }> {
  return authFetch(`/assessments/${assessmentId}/submissions/${submissionId}/answers/${answerId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function voidSubmission(assessmentId: string, submissionId: string): Promise<void> {
  return authFetch(`/assessments/${assessmentId}/submissions/${submissionId}/void`, { method: "POST" });
}

export function voidAllSubmissions(assessmentId: string): Promise<{ deletedCount: number }> {
  return authFetch(`/assessments/${assessmentId}/void-all`, { method: "POST" });
}

export function publishGrade(assessmentId: string, submissionId: string): Promise<{ publishedAt: string }> {
  return authFetch(`/assessments/${assessmentId}/submissions/${submissionId}/publish-grade`, { method: "POST" });
}

export function publishAllGrades(
  assessmentId: string,
): Promise<{ published: string[]; skipped: { studentId: string; reason: string }[] }> {
  return authFetch(`/assessments/${assessmentId}/publish-grades`, { method: "POST" });
}
