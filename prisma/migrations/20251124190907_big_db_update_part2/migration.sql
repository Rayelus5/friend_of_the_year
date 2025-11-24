/*
  Warnings:

  - You are about to drop the column `isAnonymousVoting` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `reviewReason` on the `Event` table. All the data in the column will be lost.
  - You are about to alter the column `title` on the `Event` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.
  - You are about to alter the column `subtitle` on the `Option` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.
  - You are about to alter the column `name` on the `Participant` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.
  - You are about to drop the column `maxChoices` on the `Poll` table. All the data in the column will be lost.
  - You are about to alter the column `title` on the `Poll` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.
  - The primary key for the `VerificationToken` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `email` on the `VerificationToken` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `VerificationToken` table. All the data in the column will be lost.
  - You are about to drop the `PasswordResetToken` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[accessKey]` on the table `Event` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[identifier,token]` on the table `VerificationToken` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[voteId,optionId]` on the table `VoteOption` will be added. If there are existing duplicate values, this will fail.
  - Made the column `description` on table `Event` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `updatedAt` to the `Poll` table without a default value. This is not possible if the table is not empty.
  - Made the column `endAt` on table `Poll` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `identifier` to the `VerificationToken` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ReportReason" AS ENUM ('SPAM', 'INAPPROPRIATE_CONTENT', 'HARASSMENT', 'SCAM', 'OTHER');

-- DropForeignKey
ALTER TABLE "Event" DROP CONSTRAINT "Event_userId_fkey";

-- DropForeignKey
ALTER TABLE "Vote" DROP CONSTRAINT "Vote_userId_fkey";

-- DropIndex
DROP INDEX "VerificationToken_email_token_key";

-- AlterTable
ALTER TABLE "Event" DROP COLUMN "isAnonymousVoting",
DROP COLUMN "reviewReason",
ALTER COLUMN "title" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "description" SET NOT NULL,
ALTER COLUMN "galaDate" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Option" ALTER COLUMN "subtitle" SET DATA TYPE VARCHAR(100);

-- AlterTable
ALTER TABLE "Participant" ALTER COLUMN "name" SET DATA TYPE VARCHAR(100);

-- AlterTable
ALTER TABLE "Poll" DROP COLUMN "maxChoices",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "maxOptions" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "title" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "isPublished" SET DEFAULT false,
ALTER COLUMN "endAt" SET NOT NULL;

-- AlterTable
ALTER TABLE "VerificationToken" DROP CONSTRAINT "VerificationToken_pkey",
DROP COLUMN "email",
DROP COLUMN "id",
ADD COLUMN     "identifier" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Vote" ALTER COLUMN "userId" DROP NOT NULL;

-- DropTable
DROP TABLE "PasswordResetToken";

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "reason" "ReportReason" NOT NULL,
    "details" TEXT NOT NULL,
    "isReviewed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModerationLog" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "eventId" TEXT,

    CONSTRAINT "ModerationLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Report_eventId_idx" ON "Report"("eventId");

-- CreateIndex
CREATE INDEX "Report_reporterId_idx" ON "Report"("reporterId");

-- CreateIndex
CREATE INDEX "Report_isReviewed_idx" ON "Report"("isReviewed");

-- CreateIndex
CREATE INDEX "ModerationLog_adminId_idx" ON "ModerationLog"("adminId");

-- CreateIndex
CREATE INDEX "ModerationLog_targetId_idx" ON "ModerationLog"("targetId");

-- CreateIndex
CREATE INDEX "ModerationLog_eventId_idx" ON "ModerationLog"("eventId");

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Event_accessKey_key" ON "Event"("accessKey");

-- CreateIndex
CREATE INDEX "Event_userId_idx" ON "Event"("userId");

-- CreateIndex
CREATE INDEX "Event_slug_idx" ON "Event"("slug");

-- CreateIndex
CREATE INDEX "Event_status_idx" ON "Event"("status");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE INDEX "Vote_userId_idx" ON "Vote"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "VoteOption_voteId_optionId_key" ON "VoteOption"("voteId", "optionId");

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModerationLog" ADD CONSTRAINT "ModerationLog_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModerationLog" ADD CONSTRAINT "ModerationLog_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;
