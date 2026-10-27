-- Idempotent repair for the setting table.
--
-- 20261027125000_added_new_columns_company_light_logo_url_and_drak_logo_url_in_setting_table
-- and 20261027130000_replace_setting_address_relation_with_string are single-shot
-- ALTERs: they fail (and roll back) when the column/constraint they touch is
-- already gone or never existed, which is what blocked production with P3009.
-- This migration reaches the same end state from any starting point and is a
-- no-op on databases where those two migrations already succeeded.

-- 1. Table itself (skipped when it already exists)
CREATE TABLE IF NOT EXISTS "setting" (
    "id" TEXT NOT NULL,
    "companyLightThemedLogoUrl" TEXT,
    "companyDarkThemedLogoUrl" TEXT,
    "companyName" TEXT,
    "company_address" TEXT,
    "company_whatsapp_number" TEXT,
    "company_contact_number" TEXT,
    "company_secondary_contact_number" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "setting_pkey" PRIMARY KEY ("id")
);

-- 2. Themed logos replace the single company logo
ALTER TABLE "setting" ADD COLUMN IF NOT EXISTS "companyLightThemedLogoUrl" TEXT;
ALTER TABLE "setting" ADD COLUMN IF NOT EXISTS "companyDarkThemedLogoUrl" TEXT;
ALTER TABLE "setting" DROP COLUMN IF EXISTS "companyLogoUrl";

-- 3. Address is a plain string now, not an Address relation
ALTER TABLE "setting" ADD COLUMN IF NOT EXISTS "company_address" TEXT;
ALTER TABLE "setting" DROP CONSTRAINT IF EXISTS "setting_company_address_id_fkey";
ALTER TABLE "setting" DROP COLUMN IF EXISTS "company_address_id";
