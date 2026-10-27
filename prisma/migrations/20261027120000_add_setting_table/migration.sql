-- CreateTable
CREATE TABLE "setting" (
    "id" TEXT NOT NULL,
    "companyLogoUrl" TEXT,
    "companyName" TEXT,
    "company_address_id" TEXT,
    "company_whatsapp_number" TEXT,
    "company_contact_number" TEXT,
    "company_secondary_contact_number" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "setting_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "setting" ADD CONSTRAINT "setting_company_address_id_fkey" FOREIGN KEY ("company_address_id") REFERENCES "Address"("id") ON DELETE SET NULL ON UPDATE CASCADE;
