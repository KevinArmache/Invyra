-- ─────────────────────────────────────────────────────────────────────────────
-- Migration : vidéos des invités
--
-- Entièrement additive : trois colonnes sur event_photos, qui accueille
-- désormais les photos et les vidéos partagées par les invités.
--
--   · kind        "photo" | "video" ; les lignes existantes sont des photos ;
--   · posterUrl   image d'aperçu d'une vidéo (Vercel Blob), si le navigateur
--                 de l'invité a pu la produire ;
--   · duration    durée d'une vidéo, en secondes.
--
-- Pas de contrainte CHECK sur kind : Postgres n'a pas d'ADD CONSTRAINT IF NOT
-- EXISTS, ce fichier ne serait plus rejouable. L'application valide la valeur
-- (voir app/actions/memories.js).
--
-- Rejouable : IF NOT EXISTS partout.
--
-- Appliquée avec :  node --env-file=.env prisma/scripts/apply-sql.mjs prisma/migrations-sql/006-event-photo-videos.sql
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE "event_photos" ADD COLUMN IF NOT EXISTS "kind" TEXT NOT NULL DEFAULT 'photo';
ALTER TABLE "event_photos" ADD COLUMN IF NOT EXISTS "posterUrl" TEXT;
ALTER TABLE "event_photos" ADD COLUMN IF NOT EXISTS "duration" INTEGER;
