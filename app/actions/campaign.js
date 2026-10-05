"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/app/actions/auth";
import { buildAnnouncementEmail } from "@/lib/email/announcement-email";
import { AUDIENCES, normalizeCampaignInput, recipientsWhere } from "@/lib/email/campaign";
import { sendMail } from "@/lib/email/transport";
import { unsubscribeHeaders, unsubscribeUrl } from "@/lib/email/unsubscribe";
import { translate } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/server";
import { PUBLIC_TEMPLATE_WHERE } from "@/lib/landing/data";
import { templateLook } from "@/lib/templates/look";
import { toEditableConfig } from "@/lib/templates/validation";

// ──────────────────────────────────────────────
// E-mails d'annonce : un admin écrit à tous les utilisateurs (nouveau
// modèle, nouveauté). Chaque action commence par requireAdmin() : une server
// action est appelable depuis n'importe quel navigateur.
//
// L'envoi part par lots, appelés l'un après l'autre par la page d'envoi
// (CampaignSender) : une fonction serveur a une durée limitée, et Gmail
// limite le nombre d'e-mails par jour. Chaque destinataire garde son état
// en base ; un envoi interrompu reprend sans écrire deux fois à quelqu'un.
// ──────────────────────────────────────────────

/** Destinataires traités par appel : une dizaine de secondes d'envoi. */
const BATCH_SIZE = 10;

/** Pause entre deux e-mails, comme sendBulkInvitationEmails (Gmail). */
const PAUSE_MS = 300;

/**
 * Un destinataire resté « en cours » plus longtemps a été abandonné par une
 * fonction interrompue : il est repris.
 */
const STALE_MS = 10 * 60 * 1000;

const STATUSES = ["pending", "sending", "sent", "failed", "skipped"];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Erreurs qui touchent tout l'envoi et pas un destinataire : quota du jour
 * atteint, serveur SMTP injoignable ou identifiants refusés. L'envoi se met
 * en pause au lieu de marquer chaque destinataire en échec.
 */
function blockingError(error) {
  const code = error?.code;
  if (["EAUTH", "ECONNECTION", "ETIMEDOUT", "ESOCKET", "EDNS"].includes(code)) {
    return "Le serveur d'envoi ne répond pas ou refuse la connexion. Vérifiez la configuration SMTP, puis reprenez l'envoi.";
  }
  const details = `${error?.response ?? ""} ${error?.message ?? ""}`;
  if (
    [421, 450, 451, 452, 454, 550, 552, 554].includes(error?.responseCode) &&
    /quota|limit|rate|too many|exceeded/i.test(details)
  ) {
    return "Quota d'envoi atteint sur le serveur SMTP. Reprenez l'envoi plus tard (avec Gmail, la limite se réinitialise en 24 heures).";
  }
  return null;
}

/**
 * Le modèle annoncé, avec ce qu'il faut pour l'e-mail : nom, catégorie (en
 * français, comme l'e-mail) et photo principale. Seul un modèle public peut
 * être annoncé : sa page doit exister pour que le lien mène quelque part.
 */
async function templateForEmail(templateId) {
  if (!templateId) return null;
  const template = await prisma.template.findFirst({
    where: { id: templateId, ...PUBLIC_TEMPLATE_WHERE },
    select: { id: true, name: true, category: true, config: true },
  });
  if (!template) return null;

  return {
    id: template.id,
    name: template.name,
    categoryLabel: template.category
      ? translate(getDictionary("fr"), `portal.templates.categories.${template.category}`)
      : "",
    imageUrl: templateLook(toEditableConfig(template.config)).image || "",
  };
}

function emailFor(campaign, template, recipient) {
  return buildAnnouncementEmail({
    name: recipient.name,
    email: recipient.email,
    subject: campaign.subject,
    preheader: campaign.preheader,
    heading: campaign.heading,
    message: campaign.message,
    ctaLabel: campaign.ctaLabel,
    ctaUrl: campaign.ctaUrl,
    template,
    unsubscribeUrl: unsubscribeUrl(recipient.userId),
  });
}

/** Saisie validée et modèle vérifié, pour l'aperçu, le test et le lancement. */
async function prepare(input) {
  const campaign = normalizeCampaignInput(input);
  const template = await templateForEmail(campaign.templateId);
  if (campaign.templateId && !template) {
    throw new Error("Ce modèle n'est pas publié : il ne peut pas être annoncé.");
  }
  return { campaign, template };
}

async function countByStatus(campaignId) {
  const rows = await prisma.emailCampaignRecipient.groupBy({
    by: ["status"],
    where: { campaignId },
    _count: { _all: true },
  });
  const counts = Object.fromEntries(STATUSES.map((status) => [status, 0]));
  for (const row of rows) counts[row.status] = row._count._all;
  return counts;
}

// ─── Préparation ─────────────────────────────────────────────────────────────

/** Nombre de destinataires de chaque audience. */
export async function getAudienceCounts() {
  await requireAdmin();
  const counts = await Promise.all(
    AUDIENCES.map((audience) => prisma.user.count({ where: recipientsWhere(audience) })),
  );
  return Object.fromEntries(AUDIENCES.map((audience, index) => [audience, counts[index]]));
}

/** Modèles publics, ceux qu'un e-mail peut annoncer. Les plus récents d'abord. */
export async function getAnnounceableTemplates() {
  await requireAdmin();
  return prisma.template.findMany({
    where: PUBLIC_TEMPLATE_WHERE,
    select: { id: true, name: true, category: true },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });
}

/** Rendu de l'e-mail tel que le recevra l'admin, pour l'aperçu. */
export async function previewCampaign(input) {
  const session = await requireAdmin();
  const { campaign, template } = await prepare(input);
  const { subject, html } = emailFor(campaign, template, {
    userId: session.userId,
    email: session.email,
    name: session.name,
  });
  return { subject, html };
}

/** Envoie l'e-mail à l'admin seul, pour le vérifier dans une vraie messagerie. */
export async function sendCampaignTest(input) {
  const session = await requireAdmin();
  const { campaign, template } = await prepare(input);
  const recipient = { userId: session.userId, email: session.email, name: session.name };
  const { subject, text, html } = emailFor(campaign, template, recipient);

  await sendMail({
    to: session.email,
    subject: `[Test] ${subject}`,
    text,
    html,
    headers: unsubscribeHeaders(session.userId),
  });
  return { email: session.email };
}

// ─── Envoi ───────────────────────────────────────────────────────────────────

/**
 * Crée l'envoi et fige ses destinataires : un compte créé pendant l'envoi
 * n'y entre pas, et chaque destinataire n'y figure qu'une fois.
 */
export async function launchCampaign(input) {
  const session = await requireAdmin();
  const { campaign } = await prepare(input);

  const users = await prisma.user.findMany({
    where: recipientsWhere(campaign.audience),
    select: { id: true, email: true, name: true },
    orderBy: { createdAt: "asc" },
  });
  if (users.length === 0) {
    throw new Error("Aucun utilisateur ne correspond à cette audience.");
  }

  const created = await prisma.$transaction(async (tx) => {
    const row = await tx.emailCampaign.create({
      data: {
        ...campaign,
        status: "sending",
        total: users.length,
        createdById: session.userId,
      },
      select: { id: true },
    });
    await tx.emailCampaignRecipient.createMany({
      data: users.map((user) => ({
        campaignId: row.id,
        userId: user.id,
        email: user.email,
        name: user.name,
      })),
      skipDuplicates: true,
    });
    return row;
  });

  return { id: created.id };
}

/**
 * Envoie le lot suivant. La page d'envoi l'appelle en boucle jusqu'à
 * `done`, `paused`, ou un lot vide.
 *
 * @returns {Promise<{ status: string, processed: number, total: number, counts: Record<string, number>, done: boolean, paused: boolean, lastError: string | null }>}
 */
export async function sendCampaignBatch(campaignId) {
  await requireAdmin();

  const campaign = await prisma.emailCampaign.findUnique({ where: { id: campaignId } });
  if (!campaign) throw new Error("Envoi introuvable");

  let processed = 0;
  let blocked = null;

  if (campaign.status !== "sent") {
    const template = await templateForEmail(campaign.templateId);
    const batch = await prisma.emailCampaignRecipient.findMany({
      where: {
        campaignId,
        OR: [
          { status: "pending" },
          { status: "sending", updatedAt: { lt: new Date(Date.now() - STALE_MS) } },
        ],
      },
      orderBy: { id: "asc" },
      take: BATCH_SIZE,
      include: { user: { select: { marketingEmails: true, suspended: true } } },
    });

    for (const recipient of batch) {
      // Réservation : si un autre onglet a pris ce destinataire entre-temps,
      // son état ou sa date ont changé et rien n'est mis à jour.
      const claimed = await prisma.emailCampaignRecipient.updateMany({
        where: { id: recipient.id, status: recipient.status, updatedAt: recipient.updatedAt },
        data: { status: "sending" },
      });
      if (claimed.count !== 1) continue;
      processed++;

      // Désabonné, suspendu ou supprimé depuis le lancement : on n'écrit pas.
      const { user } = recipient;
      if (!user || !user.marketingEmails || user.suspended) {
        await prisma.emailCampaignRecipient.update({
          where: { id: recipient.id },
          data: { status: "skipped" },
        });
        continue;
      }

      const { subject, text, html } = emailFor(campaign, template, recipient);
      try {
        await sendMail({
          to: recipient.email,
          subject,
          text,
          html,
          headers: unsubscribeHeaders(recipient.userId),
        });
        await prisma.emailCampaignRecipient.update({
          where: { id: recipient.id },
          data: { status: "sent", sentAt: new Date(), error: null },
        });
      } catch (error) {
        blocked = blockingError(error);
        if (blocked) {
          // Pas la faute du destinataire : il sera repris à la reprise.
          await prisma.emailCampaignRecipient.update({
            where: { id: recipient.id },
            data: { status: "pending" },
          });
          console.error("[Annonce] Envoi mis en pause :", error.message);
          break;
        }
        console.error(`[Annonce] Échec pour ${recipient.email} :`, error.message);
        await prisma.emailCampaignRecipient.update({
          where: { id: recipient.id },
          data: { status: "failed", error: String(error.message ?? error).slice(0, 500) },
        });
      }

      await sleep(PAUSE_MS);
    }
  }

  const counts = await countByStatus(campaignId);
  const remaining = counts.pending + counts.sending;
  const status = blocked ? "paused" : remaining === 0 ? "sent" : "sending";

  await prisma.emailCampaign.update({
    where: { id: campaignId },
    data: {
      status,
      sentCount: counts.sent,
      failedCount: counts.failed,
      lastError: blocked,
      ...(status === "sent" && !campaign.completedAt && { completedAt: new Date() }),
    },
  });

  return {
    status,
    processed,
    total: campaign.total,
    counts,
    done: status === "sent",
    paused: status === "paused",
    lastError: blocked,
  };
}

/** Pause demandée par l'admin, une fois le lot en cours terminé. */
export async function pauseCampaign(campaignId) {
  await requireAdmin();
  await prisma.emailCampaign.updateMany({
    where: { id: campaignId, status: "sending" },
    data: { status: "paused" },
  });
  return { success: true };
}

/** Les destinataires en échec repassent en attente, pour un nouvel essai. */
export async function retryFailedRecipients(campaignId) {
  await requireAdmin();
  const { count } = await prisma.emailCampaignRecipient.updateMany({
    where: { campaignId, status: "failed" },
    data: { status: "pending", error: null },
  });
  if (count > 0) {
    await prisma.emailCampaign.update({
      where: { id: campaignId },
      data: { status: "paused", failedCount: 0, lastError: null, completedAt: null },
    });
  }
  return { count };
}

// ─── Historique ──────────────────────────────────────────────────────────────

/** Les derniers envois, du plus récent au plus ancien. */
export async function getCampaigns() {
  await requireAdmin();
  return prisma.emailCampaign.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      subject: true,
      audience: true,
      status: true,
      total: true,
      sentCount: true,
      failedCount: true,
      createdAt: true,
      completedAt: true,
      createdBy: { select: { name: true, email: true } },
      template: { select: { id: true, name: true } },
    },
  });
}

/** Un envoi, son avancement et ses derniers échecs. */
export async function getCampaign(campaignId) {
  await requireAdmin();
  if (typeof campaignId !== "string" || campaignId.length > 64) return null;

  const campaign = await prisma.emailCampaign.findUnique({
    where: { id: campaignId },
    include: {
      createdBy: { select: { name: true, email: true } },
      template: { select: { id: true, name: true } },
    },
  });
  if (!campaign) return null;

  const [counts, failures] = await Promise.all([
    countByStatus(campaignId),
    prisma.emailCampaignRecipient.findMany({
      where: { campaignId, status: "failed" },
      select: { id: true, email: true, error: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: 50,
    }),
  ]);

  return { ...campaign, counts, failures };
}
