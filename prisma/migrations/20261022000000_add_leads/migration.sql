CREATE TYPE "LeadStatus" AS ENUM ('hot', 'medium', 'cold', 'converted');

CREATE TYPE "LeadGeneratedSource" AS ENUM ('online', 'offline');

CREATE TABLE "leads" (
    "id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT,
    "username" TEXT NOT NULL,
    "utm_source" TEXT,
    "course_id" TEXT,
    "has_been_called" BOOLEAN NOT NULL DEFAULT false,
    "next_call_date" TIMESTAMP(3),
    "status" "LeadStatus" NOT NULL DEFAULT 'medium',
    "generated_source" "LeadGeneratedSource" NOT NULL DEFAULT 'online',
    "lead_remark" TEXT,
    "message" TEXT,
    "createdat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedat" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "lead_remarks" (
    "id" TEXT NOT NULL,
    "lead_id" TEXT NOT NULL,
    "remark" TEXT NOT NULL,
    "createdat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedat" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lead_remarks_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "lead_remarks_lead_id_createdat_idx" ON "lead_remarks"("lead_id", "createdat");

ALTER TABLE "leads" ADD CONSTRAINT "leads_course_id_fkey"
FOREIGN KEY ("course_id") REFERENCES "course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "lead_remarks" ADD CONSTRAINT "lead_remarks_lead_id_fkey"
FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
