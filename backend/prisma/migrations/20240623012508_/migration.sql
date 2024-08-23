-- CreateTable
CREATE TABLE `Word` (
    `id` VARCHAR(191) NOT NULL,
    `entrySeq` VARCHAR(191) NOT NULL,
    `kanji` VARCHAR(191) NOT NULL,
    `kanjiOther` JSON NOT NULL,
    `reading` VARCHAR(191) NOT NULL,
    `definitions` JSON NOT NULL,
    `exampleSentences` JSON NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
