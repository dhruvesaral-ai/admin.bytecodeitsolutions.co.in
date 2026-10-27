-- Idempotent repair for the visit/click tracking schema.
--
-- 20261027120812_page_visits_and_page_clicks assumed page_stats and page_clicks
-- already existed in their original shape. Environments where that assumption
-- did not hold (partially applied history) failed the whole migration, so
-- page.visits never landed. Every statement below is safe to run on a database
-- that already has the final shape, which makes it a no-op there.

-- 1. Page visit counter
ALTER TABLE "page" ADD COLUMN IF NOT EXISTS "visits" INTEGER NOT NULL DEFAULT 0;

-- 2. Click counters table (skipped when it already exists)
CREATE TABLE IF NOT EXISTS "page_clicks" (
    "id" TEXT NOT NULL,
    "page_id" TEXT NOT NULL,
    "field_name" TEXT NOT NULL,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "page_clicks_pkey" PRIMARY KEY ("id")
);

-- 3. Remove the legacy indirection; CASCADE also drops foreign keys on it
DROP TABLE IF EXISTS "page_stats" CASCADE;

-- 4. Detach whatever foreign key page_clicks.page_id still has (legacy -> page_stats)
DO $$
DECLARE
    fk_name text;
BEGIN
    FOR fk_name IN
        SELECT con.conname
        FROM pg_constraint con
        JOIN pg_class rel ON rel.oid = con.conrelid
        JOIN pg_attribute att ON att.attrelid = rel.oid AND att.attnum = ANY (con.conkey)
        WHERE rel.relname = 'page_clicks'
          AND con.contype = 'f'
          AND att.attname = 'page_id'
    LOOP
        EXECUTE format('ALTER TABLE "page_clicks" DROP CONSTRAINT %I', fk_name);
    END LOOP;
END $$;

-- 5. Point page_clicks at page directly
ALTER TABLE "page_clicks"
    DROP CONSTRAINT IF EXISTS "page_clicks_page_id_fkey";

ALTER TABLE "page_clicks"
    ADD CONSTRAINT "page_clicks_page_id_fkey"
    FOREIGN KEY ("page_id") REFERENCES "page"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 6. One counter per field per page
CREATE UNIQUE INDEX IF NOT EXISTS "page_clicks_page_id_field_name_key"
    ON "page_clicks"("page_id", "field_name");
