/*
  Warnings:

  - You are about to alter the column `readingOther` on the `word` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Json`.

*/
-- AlterTable
ALTER TABLE `word` MODIFY `readingOther` JSON NOT NULL;
