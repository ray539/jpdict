/*
  Warnings:

  - Added the required column `readingOther` to the `Word` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `word` ADD COLUMN `readingOther` VARCHAR(191) NOT NULL;
