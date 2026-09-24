-- ─────────────────────────────────────────────────────────────────────────────
-- Migration : catégorie des modèles
--
-- Entièrement additive : une colonne NULLable et son index, puis l'affectation
-- d'une catégorie aux modèles réutilisables existants (eventId NULL). Les
-- copies propres à un événement ne sont pas touchées.
--
-- Rejouable : IF NOT EXISTS, et les UPDATE ne visent que les modèles encore
-- sans catégorie.
--
-- Appliquée avec :  node --env-file=.env prisma/apply-sql.mjs prisma/migrations-sql/002-template-category.sql
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE "templates" ADD COLUMN IF NOT EXISTS "category" TEXT;

CREATE INDEX IF NOT EXISTS "templates_category_idx" ON "templates" ("category");

-- Modèles de la galerie existants.
UPDATE "templates" SET "category" = 'wedding'
WHERE "eventId" IS NULL AND "category" IS NULL
  AND ("name" ILIKE '%mariage%' OR "config"->>'themeId' IN ('eclat', 'origami'));

UPDATE "templates" SET "category" = 'birthday'
WHERE "eventId" IS NULL AND "category" IS NULL AND "name" ILIKE '%anniversaire%';

UPDATE "templates" SET "category" = 'party'
WHERE "eventId" IS NULL AND "category" IS NULL
  AND ("name" ILIKE '%rooftop%' OR "name" ILIKE '%cocktail%' OR "name" ILIKE '%soir%');

UPDATE "templates" SET "category" = 'other'
WHERE "eventId" IS NULL AND "category" IS NULL;
