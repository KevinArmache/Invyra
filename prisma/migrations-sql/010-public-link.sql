-- ─────────────────────────────────────────────────────────────────────────────
-- Migration : lien unique de l'invitation
--
-- L'hôte peut partager un seul lien (/join/<publicToken>) au lieu d'un lien
-- par invité. Chaque personne qui l'ouvre saisit son nom et son téléphone :
-- une ligne guests est créée pour elle, avec son propre jeton, et elle est
-- envoyée vers son invitation personnelle (voir app/actions/public-link.js).
--
--   · events.publicToken        slug du lien unique, créé à la demande et
--                               régénérable (l'ancien cesse de fonctionner)
--   · events.publicLinkEnabled  l'hôte peut couper le lien sans le perdre
--   · events.publicMaxSeats     personnes qu'un inscrit peut annoncer
--   · guests.source             "host" (ajouté par l'hôte) ou "link"
--                               (inscrit par le lien unique)
--   · guests.email              devient facultatif : un inscrit par le lien
--                               donne son téléphone, l'e-mail est en option.
--                               L'unicité (eventId, email) reste : Postgres
--                               accepte plusieurs NULL.
--
-- Rejouable : IF NOT EXISTS, et DROP NOT NULL ne fait rien sur une colonne
-- déjà facultative.
--
-- Appliquée avec :  node --env-file=.env prisma/scripts/apply-sql.mjs prisma/migrations-sql/010-public-link.sql
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "publicToken" TEXT;
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "publicLinkEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "publicMaxSeats" INTEGER NOT NULL DEFAULT 1;
CREATE UNIQUE INDEX IF NOT EXISTS "events_publicToken_key" ON "events"("publicToken");

ALTER TABLE "guests" ADD COLUMN IF NOT EXISTS "source" TEXT NOT NULL DEFAULT 'host';
ALTER TABLE "guests" ALTER COLUMN "email" DROP NOT NULL;
