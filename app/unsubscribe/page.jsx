import Link from "next/link";
import { ArrowLeft, BellOff, BellRing, Settings } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { verifyUnsubscribeToken } from "@/lib/email/unsubscribe";
import { updateSubscription } from "@/app/actions/unsubscribe";
import { getTranslations } from "@/lib/i18n/server";
import { Button } from "@/components/ui/button";
import BrandMark from "@/components/common/BrandMark";
import SubmitButton from "@/components/common/SubmitButton";

export async function generateMetadata() {
  const { t } = await getTranslations();
  return {
    title: t("unsubscribe.meta_title"),
    robots: { index: false, follow: false },
  };
}

/**
 * Adresse à demi masquée : le lien peut avoir été transféré, il n'a pas à
 * dévoiler l'adresse complète.
 */
function maskEmail(email) {
  const [local, domain] = String(email).split("@");
  if (!domain) return email;
  const visible = local.slice(0, Math.min(2, local.length));
  const hidden = Math.max(1, Math.min(6, local.length - visible.length));
  return `${visible}${"•".repeat(hidden)}@${domain}`;
}

/**
 * Désabonnement des e-mails d'annonce, ouvert depuis le pied d'un e-mail
 * (voir lib/email/unsubscribe.js). Sans connexion : le jeton signé désigne
 * le compte.
 *
 * Ouvrir la page ne change rien : c'est le bouton qui désabonne. Les
 * antivirus de messagerie ouvrent les liens d'eux-mêmes, un désabonnement
 * au premier affichage désabonnerait des gens qui n'ont rien demandé.
 */
export default async function UnsubscribePage({ searchParams }) {
  const { token, updated } = await searchParams;
  const tokenValue = typeof token === "string" ? token : "";
  const userId = verifyUnsubscribeToken(tokenValue);
  const [user, { t }] = await Promise.all([
    userId
      ? prisma.user.findUnique({
          where: { id: userId },
          select: { email: true, marketingEmails: true },
        })
      : null,
    getTranslations(),
  ]);

  const email = user ? maskEmail(user.email) : "";
  let title;
  let description;
  if (!user) {
    title = t("unsubscribe.invalid_title");
    description = t("unsubscribe.invalid_desc");
  } else if (!user.marketingEmails) {
    title = t("unsubscribe.unsubscribed_title");
    description = t("unsubscribe.unsubscribed_desc").replace("{email}", email);
  } else if (updated === "1") {
    title = t("unsubscribe.resubscribed_title");
    description = t("unsubscribe.resubscribed_desc").replace("{email}", email);
  } else {
    title = t("unsubscribe.subscribed_title");
    description = t("unsubscribe.subscribed_desc").replace("{email}", email);
  }

  return (
    <main
      id="main"
      className="grain relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden px-4 py-24 sm:px-6"
    >
      <div
        aria-hidden="true"
        className="animate-breathe pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 50% 45% at 50% 40%, color-mix(in oklch, var(--gold) 11%, transparent), transparent 70%)",
        }}
      />

      <div className="animate-fade-in absolute top-6 left-1/2 -translate-x-1/2">
        <BrandMark href="/" size="sm" priority />
      </div>

      <section className="surface animate-rise relative w-full max-w-lg rounded-2xl px-6 py-10 text-center sm:px-10">
        <span className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full border border-gold/25 bg-gold/5">
          {user?.marketingEmails === false ? (
            <BellOff className="h-5 w-5 text-gold/80" strokeWidth={1.5} aria-hidden="true" />
          ) : (
            <BellRing className="h-5 w-5 text-gold/80" strokeWidth={1.5} aria-hidden="true" />
          )}
        </span>

        <p className="eyebrow text-gold/80">{t("unsubscribe.eyebrow")}</p>
        <h1 className="mt-3 text-3xl text-balance text-ink-50 sm:text-4xl">{title}</h1>
        <hr className="rule-gold animate-draw-x mx-auto mt-5 w-20" />
        <p className="mx-auto mt-5 max-w-sm text-sm leading-relaxed text-pretty text-ink-300">
          {description}
        </p>

        {user && (
          <form action={updateSubscription} className="mt-8">
            <input type="hidden" name="token" value={tokenValue} />
            <input type="hidden" name="subscribe" value={user.marketingEmails ? "0" : "1"} />
            {user.marketingEmails ? (
              <SubmitButton size="lg" icon={BellOff}>
                {t("unsubscribe.unsubscribe_btn")}
              </SubmitButton>
            ) : (
              <SubmitButton size="lg" variant="outline" icon={BellRing}>
                {t("unsubscribe.resubscribe_btn")}
              </SubmitButton>
            )}
          </form>
        )}

        {user && (
          <p className="mx-auto mt-6 max-w-sm text-xs leading-relaxed text-ink-400">
            {t("unsubscribe.events_note")}
          </p>
        )}

        <div className="mt-8 flex flex-col items-center justify-center gap-2 border-t border-border/60 pt-6 sm:flex-row sm:gap-4">
          <Button asChild variant="ghost" size="sm" className="text-ink-300 hover:text-ink-50">
            <Link href="/dashboard/settings">
              <Settings className="h-4 w-4" />
              {t("unsubscribe.settings_link")}
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm" className="text-ink-300 hover:text-ink-50">
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
              {t("unsubscribe.home")}
            </Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
