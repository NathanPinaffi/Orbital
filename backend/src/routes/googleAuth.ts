import { Router } from "express";
import { google } from "googleapis";
import { createOAuthClient, getAuthUrl, classroomClient } from "../lib/google.js";
import { prisma } from "../lib/prisma.js";
import { signUserToken } from "../lib/jwt.js";
import { importAllCourses } from "../lib/importClassroom.js";

export const googleAuthRouter = Router();

const FRONTEND_URL = process.env.FRONTEND_URL ?? "http://localhost:5173";

// 1) Front-end redireciona o usuário para cá.
googleAuthRouter.get("/google", (req, res) => {
  const redirect = typeof req.query.redirect === "string" ? req.query.redirect : undefined;
  res.redirect(getAuthUrl(redirect));
});

// 2) Google redireciona de volta para cá com ?code=...
googleAuthRouter.get("/google/callback", async (req, res) => {
  const code = req.query.code;
  if (typeof code !== "string") {
    return res.status(400).send("Código de autorização ausente.");
  }

  try {
    const oauthClient = createOAuthClient();
    const { tokens } = await oauthClient.getToken(code);
    oauthClient.setCredentials(tokens);

    const oauth2 = google.oauth2({ version: "v2", auth: oauthClient });
    const { data: profile } = await oauth2.userinfo.get();

    if (!profile.email || !profile.id) {
      throw new Error("Perfil do Google incompleto");
    }

    // Uma turma pode ter sido importada antes de o aluno/professor logar pela
    // primeira vez (registro criado a partir do roster, sem googleId ainda).
    // Nesse caso vinculamos a conta Google existente em vez de duplicar o usuário.
    const existing =
      (await prisma.user.findUnique({ where: { googleId: profile.id } })) ??
      (await prisma.user.findUnique({ where: { email: profile.email } }));

    const user = await prisma.user.upsert({
      where: { id: existing?.id ?? "__none__" },
      update: {
        name: profile.name ?? profile.email,
        email: profile.email,
        googleId: profile.id,
        ...(profile.picture ? { avatarUrl: profile.picture } : {}),
        ...(tokens.refresh_token ? { googleRefreshToken: tokens.refresh_token } : {}),
      },
      create: {
        googleId: profile.id,
        name: profile.name ?? profile.email,
        email: profile.email,
        avatarUrl: profile.picture ?? undefined,
        googleRefreshToken: tokens.refresh_token ?? undefined,
      },
    });

    const refreshToken = tokens.refresh_token ?? user.googleRefreshToken;
    if (user.role === "TEACHER" && refreshToken) {
      importAllCourses(classroomClient(refreshToken), user.id).catch((err) => {
        console.error("Falha ao pré-importar turmas após login:", err);
      });
    }

    const jwtToken = signUserToken(user);
    const state = typeof req.query.state === "string" ? req.query.state : undefined;
    const redirectParam = state ? `&redirect=${encodeURIComponent(state)}` : "";
    res.redirect(`${FRONTEND_URL}/auth/callback?token=${jwtToken}${redirectParam}`);
  } catch (err) {
    console.error("Falha na autenticação Google:", err);
    res.redirect(`${FRONTEND_URL}/login?error=google_auth_failed`);
  }
});
