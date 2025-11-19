/*
  Warnings:

  - The values [SUBSET] on the enum `VotingType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `imageUrl` on the `Option` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Option` table. All the data in the column will be lost.
  - You are about to drop the column `allowMultipleSelection` on the `Poll` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[pollId,participantId]` on the table `Option` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `participantId` to the `Option` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "VotingType_new" AS ENUM ('SINGLE', 'MULTIPLE', 'LIMITED_MULTIPLE');
ALTER TABLE "Poll" ALTER COLUMN "votingType" TYPE "VotingType_new" USING ("votingType"::text::"VotingType_new");
ALTER TYPE "VotingType" RENAME TO "VotingType_old";
ALTER TYPE "VotingType_new" RENAME TO "VotingType";
DROP TYPE "public"."VotingType_old";
COMMIT;

-- DropIndex
DROP INDEX "Option_pollId_idx";

-- DropIndex
DROP INDEX "Vote_pollId_idx";

-- DropIndex
DROP INDEX "VoteOption_optionId_idx";

-- DropIndex
DROP INDEX "VoteOption_voteId_idx";

-- AlterTable
ALTER TABLE "Option" DROP COLUMN "imageUrl",
DROP COLUMN "name",
ADD COLUMN     "participantId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Poll" DROP COLUMN "allowMultipleSelection",
ALTER COLUMN "votingType" SET DEFAULT 'SINGLE',
ALTER COLUMN "startAt" SET DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "Participant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Participant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Option_pollId_participantId_key" ON "Option"("pollId", "participantId");

-- AddForeignKey
ALTER TABLE "Option" ADD CONSTRAINT "Option_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
