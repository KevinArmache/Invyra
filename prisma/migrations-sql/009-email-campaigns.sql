-- ─────────────────────────────────────────────────────────────────────────────
-- Migration : e-mails d'annonce envoyés depuis l'administration
--
-- Entièrement additive : une colonne et deux tables.
--
--   · users.marketingEmails      l'utilisateur accepte de recevoir les
--     nouveautés d'Invyra (nouveaux modèles…). Vrai par défaut ; le lien de
--     désabonnement de chaque e-mail et la page Paramètres le passent à faux.
--
--   · email_campaigns            un envoi : son contenu, son audience et ses
--     compteurs.
--
--   · email_campaign_recipients  les destinataires de l'envoi, figés au
--     lancement, chacun avec son état : un envoi interrompu reprend là où il
--     s'était arrêté, sans écrire deux fois à la même personne.
--
-- Supprimer un modèle ou un compte ne supprime pas l'historique des envois.
--
-- Rejouable : IF NOT EXISTS partout. Les contraintes sont déclarées dans le
-- CREATE TABLE : elles ne sont créées qu'avec la table.
--
-- Appliquée avec :  node --env-file=.env prisma/scripts/apply-sql.mjs prisma/migrations-sql/009-email-campaigns.sql
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE "users"
    ADD COLUMN IF NOT EXISTS "marketingEmails" BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE IF NOT EXISTS "email_campaigns" (
    "id" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "preheader" TEXT NOT NULL DEFAULT '',
    "heading" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "ctaLabel" TEXT,
    "ctaUrl" TEXT,
    "templateId" TEXT,
    "audience" TEXT NOT NULL DEFAULT 'all',
    "status" TEXT NOT NULL DEFAULT 'sending',
    "total" INTEGER NOT NULL DEFAULT 0,
    "sentCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "email_campaigns_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "email_campaigns_templateId_fkey" FOREIGN KEY ("templateId")
        REFERENCES "templates" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "email_campaigns_createdById_fkey" FOREIGN KEY ("createdById")
        REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "email_campaigns_createdAt_idx"
    ON "email_campaigns" ("createdAt");

CREATE TABLE IF NOT EXISTS "email_campaign_recipients" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "userId" TEXT,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "error" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_campaign_recipients_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "email_campaign_recipients_campaignId_fkey" FOREIGN KEY ("campaignId")
        REFERENCES "email_campaigns" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "email_campaign_recipients_userId_fkey" FOREIGN KEY ("userId")
        REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "email_campaign_recipients_campaignId_email_key"
    ON "email_campaign_recipients" ("campaignId", "email");
CREATE INDEX IF NOT EXISTS "email_campaign_recipients_campaignId_status_idx"
    ON "email_campaign_recipients" ("campaignId", "status");
CREATE INDEX IF NOT EXISTS "email_campaign_recipients_userId_idx"
    ON "email_campaign_recipients" ("userId");
