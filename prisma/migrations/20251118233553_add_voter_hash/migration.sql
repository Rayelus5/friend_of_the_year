/*
  Warnings:

  - You are about to drop the column `sessionHash` on the `Vote` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[pollId,voterHash]` on the table `Vote` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `voterHash` to the `Vote` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Vote" DROP COLUMN "sessionHash",
ADD COLUMN     "voterHash" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "Vote_pollId_idx" ON "Vote"("pollId");

-- CreateIndex
CREATE UNIQUE INDEX "Vote_pollId_voterHash_key" ON "Vote"("pollId", "voterHash");
