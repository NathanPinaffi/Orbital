export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3333";

export function loginWithGoogle() {
  window.location.href = `${API_URL}/auth/google`;
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

  return res.json();
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
