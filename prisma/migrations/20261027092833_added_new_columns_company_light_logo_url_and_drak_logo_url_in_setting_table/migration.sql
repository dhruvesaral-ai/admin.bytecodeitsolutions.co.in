/*
  Warnings:

  - You are about to drop the column `companyLogoUrl` on the `setting` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "setting" DROP COLUMN "companyLogoUrl",
ADD COLUMN     "companyDarkThemedLogoUrl" TEXT,
ADD COLUMN     "companyLightThemedLogoUrl" TEXT;
