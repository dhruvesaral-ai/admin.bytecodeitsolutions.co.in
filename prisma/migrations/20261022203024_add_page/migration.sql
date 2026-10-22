-- AlterTable
ALTER TABLE "leads" ALTER COLUMN "status" SET DEFAULT 'hot';

-- CreateTable
CREATE TABLE "page" (
    "id" TEXT NOT NULL,
    "heading" TEXT NOT NULL,
    "subheading" TEXT NOT NULL,
    "route_name" TEXT NOT NULL,

    CONSTRAINT "page_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "page_route_name_key" ON "page"("route_name");
