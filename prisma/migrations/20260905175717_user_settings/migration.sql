-- CreateEnum
CREATE TYPE "UserLocale" AS ENUM ('en', 'ru', 'de', 'es', 'ar');

-- CreateEnum
CREATE TYPE "UserAppearance" AS ENUM ('system', 'light', 'dark');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "appearance" "UserAppearance" NOT NULL DEFAULT 'system',
ADD COLUMN     "locale" "UserLocale" NOT NULL DEFAULT 'en';
