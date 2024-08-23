/*
  Warnings:

  - You are about to drop the column `exampleSentences` on the `word` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[entrySeq]` on the table `Word` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `word` DROP COLUMN `exampleSentences`;

-- CreateTable
CREATE TABLE `ExampleSentence` (
    `id` VARCHAR(191) NOT NULL,
    `jpn` VARCHAR(191) NOT NULL,
    `eng` VARCHAR(191) NOT NULL,
    `default_word_wordForm` VARCHAR(191) NOT NULL,
    `default_wordId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Account` (
    `id` VARCHAR(191) NOT NULL,
    `username` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WordDeck` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `ownerId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BelongsToWordDeck` (
    `wordId` VARCHAR(191) NOT NULL,
    `wordDeckId` VARCHAR(191) NOT NULL,
    `seqNum` INTEGER NOT NULL,

    PRIMARY KEY (`wordId`, `wordDeckId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WordKnownLevel` (
    `accountId` VARCHAR(191) NOT NULL,
    `wordId` VARCHAR(191) NOT NULL,
    `knownLevel` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`accountId`, `wordId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Card` (
    `id` VARCHAR(191) NOT NULL,
    `ownerId` VARCHAR(191) NOT NULL,
    `wordId` VARCHAR(191) NOT NULL,
    `cardData` JSON NOT NULL,
    `knownLevel` INTEGER NOT NULL,
    `lastReviewed` DATETIME(3) NOT NULL,
    `dateAdded` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `Word_entrySeq_key` ON `Word`(`entrySeq`);

-- AddForeignKey
ALTER TABLE `ExampleSentence` ADD CONSTRAINT `ExampleSentence_default_wordId_fkey` FOREIGN KEY (`default_wordId`) REFERENCES `Word`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WordDeck` ADD CONSTRAINT `WordDeck_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `Account`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BelongsToWordDeck` ADD CONSTRAINT `BelongsToWordDeck_wordId_fkey` FOREIGN KEY (`wordId`) REFERENCES `Word`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BelongsToWordDeck` ADD CONSTRAINT `BelongsToWordDeck_wordDeckId_fkey` FOREIGN KEY (`wordDeckId`) REFERENCES `WordDeck`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WordKnownLevel` ADD CONSTRAINT `WordKnownLevel_accountId_fkey` FOREIGN KEY (`accountId`) REFERENCES `Account`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WordKnownLevel` ADD CONSTRAINT `WordKnownLevel_wordId_fkey` FOREIGN KEY (`wordId`) REFERENCES `Word`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Card` ADD CONSTRAINT `Card_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `Account`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Card` ADD CONSTRAINT `Card_wordId_fkey` FOREIGN KEY (`wordId`) REFERENCES `Word`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
