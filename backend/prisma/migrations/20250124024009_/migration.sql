/*
  Warnings:

  - The primary key for the `belongstoworddeck` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/


ALTER TABLE `belongstoworddeck` DROP FOREIGN KEY `BelongsToWordDeck_wordDeckId_fkey`;
ALTER TABLE `belongstoworddeck` DROP FOREIGN KEY `BelongsToWordDeck_wordId_fkey`;

-- AlterTable
ALTER TABLE `belongstoworddeck` DROP PRIMARY KEY,
    ADD PRIMARY KEY (`wordDeckId`, `wordId`);
CREATE UNIQUE INDEX `BelongsToWordDeck_wordDeckId_seqNum` ON `belongstoworddeck`(`wordDeckId`, `seqNum`);

ALTER TABLE `belongstoworddeck` ADD CONSTRAINT `BelongsToWordDeck_wordDeckId_fkey` FOREIGN KEY (`wordDeckId`) REFERENCES `worddeck` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `belongstoworddeck` ADD CONSTRAINT `BelongsToWordDeck_wordId_fkey` FOREIGN KEY (`wordId`) REFERENCES `word` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

