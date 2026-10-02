-- ─────────────────────────────────────────────────────────────────────────────
-- Migration : numéro de contact d'un événement
--
-- Entièrement additive : une colonne NULLable. Le numéro est saisi dans le
-- formulaire de l'événement et affiché sur chaque invitation.
--
-- Rejouable : IF NOT EXISTS.
--
-- Appliquée avec :  node --env-file=.env prisma/scripts/apply-sql.mjs prisma/migrations-sql/003-event-contact-phone.sql
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "contactPhone" TEXT;
