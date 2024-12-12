/*
  Warnings:

  - Added the required column `timeDue` to the `Card` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `card` ADD COLUMN `timeDue` DATETIME(3) NOT NULL;
