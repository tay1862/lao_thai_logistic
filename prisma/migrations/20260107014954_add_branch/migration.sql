-- CreateEnum
CREATE TYPE "Branch" AS ENUM ('THAI', 'LAOS');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "branch" "Branch" NOT NULL DEFAULT 'LAOS';
