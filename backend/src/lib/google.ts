import { google } from "googleapis";
import { prisma } from "./prisma.js";
import type { AuthedRequest } from "./authMiddleware.js";

export const CLASSROOM_SCOPES = [
  "openid",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
  "https://www.googleapis.com/auth/classroom.courses.readonly",
  "https://www.googleapis.com/auth/classroom.rosters.readonly",
  "https://www.googleapis.com/auth/classroom.coursework.students",
];

export function createOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI,
  );
}

export function getAuthUrl(state?: string) {
  const client = createOAuthClient();
  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent", // garante o retorno de refresh_token mesmo em re-consentimentos
    scope: CLASSROOM_SCOPES,
    ...(state ? { state } : {}),
  });
}

/** Cliente OAuth2 autenticado para um usuário a partir do refresh token salvo. */
export function clientForUser(refreshToken: string) {
  const client = createOAuthClient();
  client.setCredentials({ refresh_token: refreshToken });
  return client;
}

export function classroomClient(refreshToken: string) {
  return google.classroom({ version: "v1", auth: clientForUser(refreshToken) });
}

/** Busca o usuário autenticado e monta um client do Classroom a partir do refresh token salvo. */
export async function classroomForRequest(req: AuthedRequest) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId! } });
  if (!user.googleRefreshToken) {
    const err = new Error("Conta não conectada ao Google Sala de Aula");
    (err as { status?: number }).status = 409;
    throw err;
  }
  return { user, classroom: classroomClient(user.googleRefreshToken) };
}
