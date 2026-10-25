/*
  Warnings:

  - You are about to drop the column `carousal_slide_ids` on the `carousal` table. All the data in the column will be lost.
  - You are about to drop the column `batch_ids` on the `class` table. All the data in the column will be lost.
  - You are about to drop the column `course_ids` on the `class` table. All the data in the column will be lost.
  - You are about to drop the column `course_module_ids` on the `course` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `enrollment` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `registration` table. All the data in the column will be lost.
  - You are about to drop the column `profileid` on the `user` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[registration_id]` on the table `enrollment` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `profile_id` to the `enrollment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `registration_id` to the `enrollment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `profile_id` to the `payment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `profile_id` to the `registration` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "enrollment" DROP CONSTRAINT "enrollment_user_id_fkey";

-- DropForeignKey
ALTER TABLE "registration" DROP CONSTRAINT "registration_user_id_fkey";

-- AlterTable
ALTER TABLE "carousal" DROP COLUMN "carousal_slide_ids";

-- AlterTable
ALTER TABLE "carousel_slide" ADD COLUMN     "carousal_id" TEXT;

-- AlterTable
ALTER TABLE "class" DROP COLUMN "batch_ids",
DROP COLUMN "course_ids";

-- AlterTable
ALTER TABLE "course" DROP COLUMN "course_module_ids";

-- AlterTable
ALTER TABLE "enrollment" DROP COLUMN "user_id",
ADD COLUMN     "profile_id" TEXT NOT NULL,
ADD COLUMN     "registration_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "payment" ADD COLUMN     "profile_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "registration" DROP COLUMN "user_id",
ADD COLUMN     "profile_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "user" DROP COLUMN "profileid";

-- CreateTable
CREATE TABLE "Profile" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "status" "GeneralStatus" NOT NULL DEFAULT 'active',
    "profile_img_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Address" (
    "id" TEXT NOT NULL,
    "address_line" TEXT NOT NULL,
    "pincode" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Address_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_CourseToCourseModule" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CourseToCourseModule_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_BatchToClass" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_BatchToClass_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Profile_user_id_key" ON "Profile"("user_id");

-- CreateIndex
CREATE INDEX "_CourseToCourseModule_B_index" ON "_CourseToCourseModule"("B");

-- CreateIndex
CREATE INDEX "_BatchToClass_B_index" ON "_BatchToClass"("B");

-- CreateIndex
CREATE UNIQUE INDEX "enrollment_registration_id_key" ON "enrollment"("registration_id");

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Address" ADD CONSTRAINT "Address_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registration" ADD CONSTRAINT "registration_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollment" ADD CONSTRAINT "enrollment_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollment" ADD CONSTRAINT "enrollment_registration_id_fkey" FOREIGN KEY ("registration_id") REFERENCES "registration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment" ADD CONSTRAINT "payment_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carousel_slide" ADD CONSTRAINT "carousel_slide_carousal_id_fkey" FOREIGN KEY ("carousal_id") REFERENCES "carousal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CourseToCourseModule" ADD CONSTRAINT "_CourseToCourseModule_A_fkey" FOREIGN KEY ("A") REFERENCES "course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CourseToCourseModule" ADD CONSTRAINT "_CourseToCourseModule_B_fkey" FOREIGN KEY ("B") REFERENCES "course_module"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BatchToClass" ADD CONSTRAINT "_BatchToClass_A_fkey" FOREIGN KEY ("A") REFERENCES "Batch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BatchToClass" ADD CONSTRAINT "_BatchToClass_B_fkey" FOREIGN KEY ("B") REFERENCES "class"("id") ON DELETE CASCADE ON UPDATE CASCADE;
