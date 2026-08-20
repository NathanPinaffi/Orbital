-- AlterTable
ALTER TABLE "Answer" ADD COLUMN     "gradedAt" TIMESTAMP(3),
ADD COLUMN     "points" DOUBLE PRECISION,
ADD COLUMN     "teacherComment" TEXT;

-- AlterTable
ALTER TABLE "Assessment" ADD COLUMN     "googleCourseWorkId" TEXT;

-- AlterTable
ALTER TABLE "Submission" ADD COLUMN     "gradePublishedAt" TIMESTAMP(3);
