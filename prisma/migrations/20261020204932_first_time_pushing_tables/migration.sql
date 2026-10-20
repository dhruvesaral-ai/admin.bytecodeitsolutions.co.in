-- CreateEnum
CREATE TYPE "GeneralStatus" AS ENUM ('active', 'inactive');

-- CreateTable
CREATE TABLE "carousal" (
    "id" TEXT NOT NULL,
    "carousal_slide_ids" TEXT[],
    "position" INTEGER NOT NULL,

    CONSTRAINT "carousal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "carousel_slide" (
    "id" TEXT NOT NULL,
    "bg_img_url" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "btn_href_link" TEXT,
    "text_container_align" TEXT,
    "img_url" TEXT,
    "banner_href_link" TEXT,

    CONSTRAINT "carousel_slide_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "originalPrice" DECIMAL(10,2),
    "discountedPrice" DECIMAL(10,2),
    "rating" DOUBLE PRECISION,
    "technology_tags" TEXT[],
    "duration" TEXT,
    "status" "GeneralStatus" NOT NULL DEFAULT 'active',
    "course_img_url" TEXT,
    "syllabus" TEXT,
    "course_categorie_id" TEXT,
    "is_placement_gurranted" BOOLEAN NOT NULL DEFAULT false,
    "is_in_sale" BOOLEAN NOT NULL DEFAULT false,
    "course_module_ids" TEXT[],

    CONSTRAINT "course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_categorie" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "course_categorie_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_module" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "course_module_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "testimonials" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "profile_img" TEXT,
    "company_name" TEXT,

    CONSTRAINT "testimonials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SuccessStories" (
    "id" TEXT NOT NULL,
    "videoids" TEXT[],

    CONSTRAINT "SuccessStories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Batch" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,

    CONSTRAINT "Batch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "class" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "date_and_time" TIMESTAMP(3) NOT NULL,
    "meet_link" TEXT,
    "recording_link" TEXT,
    "notes_link" TEXT,
    "course_ids" TEXT[],
    "batch_ids" TEXT[],

    CONSTRAINT "class_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "profileid" TEXT,
    "status" "GeneralStatus" NOT NULL DEFAULT 'active',
    "auth_session_id" TEXT,
    "role_id" TEXT,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "role_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "course_categorie_slug_key" ON "course_categorie"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "user_username_key" ON "user"("username");

-- CreateIndex
CREATE UNIQUE INDEX "role_slug_key" ON "role"("slug");

-- AddForeignKey
ALTER TABLE "course" ADD CONSTRAINT "course_course_categorie_id_fkey" FOREIGN KEY ("course_categorie_id") REFERENCES "course_categorie"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "role"("id") ON DELETE SET NULL ON UPDATE CASCADE;
