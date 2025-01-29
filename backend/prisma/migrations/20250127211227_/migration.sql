/*
  Warnings:

  - You are about to alter the column `knownLevel` on the `wordknownlevel` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.

*/
-- AlterTable
ALTER TABLE `wordknownlevel` MODIFY `knownLevel` INTEGER NOT NULL;
