-- ─────────────────────────────────────────────────────────────────────────────
-- Migration : support des modèles (digital ou papier)
--
-- Entièrement additive : une colonne sur templates.
--
--   · medium   "digital" : invitation électronique (page web, lien envoyé
--              aux invités), comme tous les modèles existants ;
--              "print"   : invitation papier (carte plate, pliée…), rendue
--              à la taille réelle et imprimée (voir lib/print/).
--
-- Toutes les lignes existantes prennent "digital" : la galerie, l'assistant
-- de création et les invitations ne voient aucun changement. Les modèles
-- papier vivent dans la même table, à part (filtre `medium`), et ont leur
-- propre vitrine (/stationery).
--
-- Rejouable : IF NOT EXISTS.
--
-- Appliquée avec :  node --env-file=.env prisma/scripts/apply-sql.mjs prisma/migrations-sql/011-template-medium.sql
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE "templates" ADD COLUMN IF NOT EXISTS "medium" TEXT NOT NULL DEFAULT 'digital';
CREATE INDEX IF NOT EXISTS "templates_medium_idx" ON "templates"("medium");
