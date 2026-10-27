-- CreateTable
CREATE TABLE "page_stats" (
    "id" TEXT NOT NULL,
    "page_id" TEXT NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "page_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "page_clicks" (
    "id" TEXT NOT NULL,
    "page_id" TEXT NOT NULL,
    "field_name" TEXT NOT NULL,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "page_clicks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "page_stats_page_id_key" ON "page_stats"("page_id");

-- AddForeignKey
ALTER TABLE "page_stats" ADD CONSTRAINT "page_stats_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "page"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "page_clicks" ADD CONSTRAINT "page_clicks_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "page_stats"("id") ON DELETE CASCADE ON UPDATE CASCADE;
