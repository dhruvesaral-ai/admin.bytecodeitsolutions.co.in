/*
  Warnings:

  - You are about to drop the column `auth_session_id` on the `user` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "user" DROP COLUMN "auth_session_id";
