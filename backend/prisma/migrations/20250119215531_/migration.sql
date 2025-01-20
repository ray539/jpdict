-- CreateTable
CREATE TABLE `CustomSentence` (
    `id` VARCHAR(191) NOT NULL,
    `jpn` VARCHAR(191) NOT NULL,
    `eng` VARCHAR(191) NOT NULL,
    `default_word_wordForm` VARCHAR(191) NOT NULL,
    `default_wordId` VARCHAR(191) NOT NULL,
    `accountId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `CustomSentence` ADD CONSTRAINT `CustomSentence_default_wordId_fkey` FOREIGN KEY (`default_wordId`) REFERENCES `Word`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CustomSentence` ADD CONSTRAINT `CustomSentence_accountId_fkey` FOREIGN KEY (`accountId`) REFERENCES `Account`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
