/*
  Warnings:

  - Added the required column `cardType` to the `Card` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `card` ADD COLUMN `cardType` ENUM('VOCAB', 'SENTENCE') NOT NULL;
