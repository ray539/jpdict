/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `Card` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `name` to the `Card` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `card` ADD COLUMN `name` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Card_name_key` ON `Card`(`name`);
