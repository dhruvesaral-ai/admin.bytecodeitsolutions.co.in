/*
  Warnings:

  - Changed the type of `position` on the `carousal` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "CarousalPosition" AS ENUM ('homepage', 'offer-banner', 'development', 'programs', 'training');

-- AlterTable
ALTER TABLE "carousal" DROP COLUMN "position",
ADD COLUMN     "position" "CarousalPosition" NOT NULL;
