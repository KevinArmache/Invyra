-- ─────────────────────────────────────────────────────────────────────────────
-- Migration : itinéraire de l'événement
--
-- Entièrement additive : une colonne sur events.
--
--   · itinerary   étapes de l'événement, dans l'ordre (cérémonie, réception…),
--                 chacune avec son lieu et, si l'hôte l'a placée sur la
--                 carte, ses coordonnées. Forme et validation dans
--                 lib/itinerary.js.
--
-- events.location reste rempli : c'est le résumé de la première étape, lu par
-- les e-mails, les PDF, les modèles d'invitation et les listes. Un événement
-- sans itinéraire (créé avant) garde son lieu en texte.
--
-- Rejouable : IF NOT EXISTS.
--
-- Appliquée avec :  node --env-file=.env prisma/scripts/apply-sql.mjs prisma/migrations-sql/007-event-itinerary.sql
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "itinerary" JSONB;
