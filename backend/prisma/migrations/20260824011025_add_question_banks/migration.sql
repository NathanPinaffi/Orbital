-- CreateExtension (garante gen_random_uuid() para o backfill abaixo)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- CreateEnum
CREATE TYPE "BankVisibility" AS ENUM ('PRIVATE', 'PUBLIC');

-- CreateTable
CREATE TABLE "QuestionBank" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "visibility" "BankVisibility" NOT NULL DEFAULT 'PRIVATE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuestionBank_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "QuestionBank_ownerId_idx" ON "QuestionBank"("ownerId");

-- AddForeignKey
ALTER TABLE "QuestionBank" ADD CONSTRAINT "QuestionBank_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterTable (nullable por enquanto, preenchido pelo backfill abaixo)
ALTER TABLE "Question" ADD COLUMN "bankId" TEXT;

-- Backfill: cria um banco "Meu banco" privado por autor que já tem questões
INSERT INTO "QuestionBank" ("id", "name", "ownerId", "visibility", "createdAt")
SELECT gen_random_uuid()::text, 'Meu banco', q."authorId", 'PRIVATE', now()
FROM (SELECT DISTINCT "authorId" FROM "Question") q;

-- Backfill: aponta cada questão existente para o banco recém-criado do seu autor
UPDATE "Question" q
SET "bankId" = qb."id"
FROM "QuestionBank" qb
WHERE qb."ownerId" = q."authorId" AND qb."name" = 'Meu banco' AND q."bankId" IS NULL;

-- AlterTable: agora que todo mundo tem bankId, torna obrigatório
ALTER TABLE "Question" ALTER COLUMN "bankId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_bankId_fkey" FOREIGN KEY ("bankId") REFERENCES "QuestionBank"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
