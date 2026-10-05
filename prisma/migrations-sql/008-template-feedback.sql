-- ─────────────────────────────────────────────────────────────────────────────
-- Migration : avis sur les modèles
--
-- Entièrement additive : deux tables.
--
--   · template_comments   commentaires laissés sur un modèle public ;
--   · template_votes      j'aime / je n'aime pas, un seul vote par
--     utilisateur et par modèle (index unique templateId + userId).
--
-- Supprimer un modèle ou un compte supprime ses commentaires et ses votes.
--
-- Rejouable : IF NOT EXISTS partout. Les contraintes sont déclarées dans le
-- CREATE TABLE : elles ne sont créées qu'avec la table.
--
-- Appliquée avec :  node --env-file=.env prisma/scripts/apply-sql.mjs prisma/migrations-sql/008-template-feedback.sql
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "template_comments" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "template_comments_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "template_comments_templateId_fkey" FOREIGN KEY ("templateId")
        REFERENCES "templates" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "template_comments_userId_fkey" FOREIGN KEY ("userId")
        REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "template_comments_templateId_createdAt_idx"
    ON "template_comments" ("templateId", "createdAt");
CREATE INDEX IF NOT EXISTS "template_comments_userId_idx"
    ON "template_comments" ("userId");

CREATE TABLE IF NOT EXISTS "template_votes" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "template_votes_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "template_votes_templateId_fkey" FOREIGN KEY ("templateId")
        REFERENCES "templates" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "template_votes_userId_fkey" FOREIGN KEY ("userId")
        REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "template_votes_templateId_userId_key"
    ON "template_votes" ("templateId", "userId");
CREATE INDEX IF NOT EXISTS "template_votes_userId_idx"
    ON "template_votes" ("userId");
