-- ─────────────────────────────────────────────────────────────────────────────
-- Migration : livre d'or et photos des invités
--
-- Entièrement additive : deux colonnes sur events et deux tables.
--
--   · events.guestbookEnabled / photosEnabled   l'hôte peut couper l'un ou
--     l'autre ;
--   · guestbook_messages   messages laissés par les invités ;
--   · event_photos         photos partagées par les invités (Vercel Blob).
--
-- Supprimer un événement ou un invité supprime ses messages et ses photos.
--
-- Rejouable : IF NOT EXISTS partout. Les contraintes sont déclarées dans le
-- CREATE TABLE : elles ne sont créées qu'avec la table.
--
-- Appliquée avec :  node --env-file=.env prisma/scripts/apply-sql.mjs prisma/migrations-sql/005-guestbook-photos.sql
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "guestbookEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "photosEnabled" BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE IF NOT EXISTS "guestbook_messages" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "guestbook_messages_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "guestbook_messages_eventId_fkey" FOREIGN KEY ("eventId")
        REFERENCES "events" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "guestbook_messages_guestId_fkey" FOREIGN KEY ("guestId")
        REFERENCES "guests" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "guestbook_messages_eventId_createdAt_idx"
    ON "guestbook_messages" ("eventId", "createdAt");
CREATE INDEX IF NOT EXISTS "guestbook_messages_guestId_idx"
    ON "guestbook_messages" ("guestId");

CREATE TABLE IF NOT EXISTS "event_photos" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "pathname" TEXT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_photos_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "event_photos_eventId_fkey" FOREIGN KEY ("eventId")
        REFERENCES "events" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "event_photos_guestId_fkey" FOREIGN KEY ("guestId")
        REFERENCES "guests" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "event_photos_eventId_createdAt_idx"
    ON "event_photos" ("eventId", "createdAt");
CREATE INDEX IF NOT EXISTS "event_photos_guestId_idx"
    ON "event_photos" ("guestId");
