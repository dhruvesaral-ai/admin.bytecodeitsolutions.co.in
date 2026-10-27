-- DropForeignKey
ALTER TABLE "page_clicks" DROP CONSTRAINT "page_clicks_page_id_fkey";

-- DropForeignKey
ALTER TABLE "page_stats" DROP CONSTRAINT "page_stats_page_id_fkey";

-- AlterTable
ALTER TABLE "page" ADD COLUMN     "visits" INTEGER NOT NULL DEFAULT 0;

-- DropTable
DROP TABLE "page_stats";

-- CreateIndex
CREATE UNIQUE INDEX "page_clicks_page_id_field_name_key" ON "page_clicks"("page_id", "field_name");

-- AddForeignKey
ALTER TABLE "page_clicks" ADD CONSTRAINT "page_clicks_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "page"("id") ON DELETE CASCADE ON UPDATE CASCADE;
