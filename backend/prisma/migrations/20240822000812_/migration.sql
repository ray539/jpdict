-- AlterTable
ALTER TABLE `account` ADD COLUMN `TDeckSelectionStrat` ENUM('HIGHESTPRIO', 'RANDOM') NOT NULL DEFAULT 'HIGHESTPRIO';
