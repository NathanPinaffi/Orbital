-- AlterTable
ALTER TABLE "Answer" ADD COLUMN     "sketchData" TEXT;

-- AlterTable
ALTER TABLE "Question" ADD COLUMN     "requiresSketch" BOOLEAN NOT NULL DEFAULT false;
