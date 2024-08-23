/*
  Warnings:

  - You are about to drop the column `ownerId` on the `card` table. All the data in the column will be lost.
  - You are about to drop the column `ownerId` on the `worddeck` table. All the data in the column will be lost.
  - Added the required column `accountId` to the `Card` table without a default value. This is not possible if the table is not empty.
  - Added the required column `accountId` to the `WordDeck` table without a default value. This is not possible if the table is not empty.
  - Added the required column `priority` to the `WordDeck` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `card` DROP FOREIGN KEY `Card_ownerId_fkey`;

-- DropForeignKey
ALTER TABLE `worddeck` DROP FOREIGN KEY `WordDeck_ownerId_fkey`;

-- AlterTable
ALTER TABLE `card` DROP COLUMN `ownerId`,
    ADD COLUMN `accountId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `worddeck` DROP COLUMN `ownerId`,
    ADD COLUMN `accountId` VARCHAR(191) NOT NULL,
    ADD COLUMN `priority` INTEGER NOT NULL;

-- CreateTable
CREATE TABLE `SimilarWord` (
    `accountId` VARCHAR(191) NOT NULL,
    `word1Id` VARCHAR(191) NOT NULL,
    `word2Id` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`accountId`, `word1Id`, `word2Id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `WordDeck` ADD CONSTRAINT `WordDeck_accountId_fkey` FOREIGN KEY (`accountId`) REFERENCES `Account`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SimilarWord` ADD CONSTRAINT `SimilarWord_accountId_fkey` FOREIGN KEY (`accountId`) REFERENCES `Account`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SimilarWord` ADD CONSTRAINT `SimilarWord_word1Id_fkey` FOREIGN KEY (`word1Id`) REFERENCES `Word`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SimilarWord` ADD CONSTRAINT `SimilarWord_word2Id_fkey` FOREIGN KEY (`word2Id`) REFERENCES `Word`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Card` ADD CONSTRAINT `Card_accountId_fkey` FOREIGN KEY (`accountId`) REFERENCES `Account`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
