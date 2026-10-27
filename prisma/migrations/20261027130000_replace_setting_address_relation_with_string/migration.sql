-- DropForeignKey
ALTER TABLE "setting" DROP CONSTRAINT "setting_company_address_id_fkey";

-- AlterTable
ALTER TABLE "setting" DROP COLUMN "company_address_id",
ADD COLUMN     "company_address" TEXT;
