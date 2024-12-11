/*
  Warnings:

  - A unique constraint covering the columns `[accountId,priority]` on the table `WordDeck` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `card` MODIFY `lastReviewed` DATETIME(3) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `WordDeck_accountId_priority_key` ON `WordDeck`(`accountId`, `priority`);
