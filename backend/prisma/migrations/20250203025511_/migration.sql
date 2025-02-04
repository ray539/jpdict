/*
  Warnings:

  - A unique constraint covering the columns `[accountId,name]` on the table `Card` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `Card_accountId_name_key` ON `Card`(`accountId`, `name`);
