import { google } from "googleapis";

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

export function getAuthUrl() {
  const client = createOAuthClient();
  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent", // garante o retorno de refresh_token mesmo em re-consentimentos
    scope: CLASSROOM_SCOPES,
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
