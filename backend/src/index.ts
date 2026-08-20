import "dotenv/config";
import express from "express";
import cors from "cors";
import { authRouter } from "./routes/auth.js";
import { googleAuthRouter } from "./routes/googleAuth.js";
import { classroomRouter } from "./routes/classroom.js";
import { questionsRouter } from "./routes/questions.js";
import { classesRouter } from "./routes/classes.js";
import { assessmentsRouter } from "./routes/assessments.js";
import { examsRouter } from "./routes/exams.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => res.json({ status: "ok" }));
app.use("/auth", authRouter);
app.use("/auth", googleAuthRouter);
app.use("/classroom", classroomRouter);
app.use("/questions", questionsRouter);
app.use("/classes", classesRouter);
app.use("/assessments", assessmentsRouter);
app.use("/exams", examsRouter);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  const status = (err as { status?: number })?.status ?? 500;
  const message = err instanceof Error ? err.message : "Erro interno";
  res.status(status).json({ error: message });
});

const port = process.env.PORT ?? 3333;
app.listen(port, () => {
  console.log(`Orbital API rodando em http://localhost:${port}`);
});
