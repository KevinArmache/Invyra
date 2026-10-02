-- ─────────────────────────────────────────────────────────────────────────────
-- Migration : places, billet d'entrée et accueil le jour J
--
-- Entièrement additive : des colonnes et deux index uniques.
--
--   · guests.seats           places réservées par l'hôte (l'invité compris) ;
--   · guests.attendingCount  personnes annoncées par l'invité dans sa réponse ;
--   · guests.ticketCode      code du billet, distinct du jeton d'invitation ;
--   · guests.checkedInAt / checkedInCount   arrivée le jour J ;
--   · events.checkInToken    lien secret de l'équipe d'accueil.
--
-- Reprise : un invité « +1 » reçoit 2 places, et chaque invité un code de
-- billet (même alphabet que lib/tickets.js).
--
-- Rejouable : IF NOT EXISTS, et les UPDATE ne visent que les lignes encore à
-- reprendre.
--
-- Appliquée avec :  node --env-file=.env prisma/scripts/apply-sql.mjs prisma/migrations-sql/004-guest-ticket-checkin.sql
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE "guests" ADD COLUMN IF NOT EXISTS "seats" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "guests" ADD COLUMN IF NOT EXISTS "attendingCount" INTEGER;
ALTER TABLE "guests" ADD COLUMN IF NOT EXISTS "ticketCode" TEXT;
ALTER TABLE "guests" ADD COLUMN IF NOT EXISTS "checkedInAt" TIMESTAMP(3);
ALTER TABLE "guests" ADD COLUMN IF NOT EXISTS "checkedInCount" INTEGER;

CREATE UNIQUE INDEX IF NOT EXISTS "guests_ticketCode_key" ON "guests" ("ticketCode");

ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "checkInToken" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "events_checkInToken_key" ON "events" ("checkInToken");

-- « +1 » devient une seconde place. plusOne repasse à false : la place est
-- désormais portée par seats, et rejouer ce fichier ne la rajoute pas.
UPDATE "guests" SET "seats" = GREATEST("seats", 2), "plusOne" = false
WHERE "plusOne" = true;

-- Un code par invité. La sous-requête fait référence à la ligne en cours
-- ("guests"."id") : sans cela, PostgreSQL la calculerait une seule fois et
-- tous les invités recevraient le même code.
UPDATE "guests" SET "ticketCode" = (
  SELECT string_agg(
    substr('23456789ABCDEFGHJKMNPQRSTUVWXYZ', 1 + floor(random() * 31)::int, 1),
    ''
  )
  FROM generate_series(1, 12)
  WHERE "guests"."id" IS NOT NULL
)
WHERE "ticketCode" IS NULL;
