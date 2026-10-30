-- CreateTable
CREATE TABLE "auth_session" (
    "id" TEXT NOT NULL,
    "user_agent" TEXT,
    "ip_address" TEXT,
    "user_id" TEXT NOT NULL,
    "refresh_token" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "auth_session_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "auth_session_user_id_key" ON "auth_session"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "auth_session_refresh_token_key" ON "auth_session"("refresh_token");

-- AddForeignKey
ALTER TABLE "auth_session" ADD CONSTRAINT "auth_session_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
