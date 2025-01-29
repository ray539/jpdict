/*
  Warnings:

  - Made the column `knownLevel` on table `wordknownlevel` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `wordknownlevel` MODIFY `knownLevel` INTEGER NOT NULL;
