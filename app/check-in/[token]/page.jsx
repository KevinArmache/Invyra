import { ScanLine } from "lucide-react";

import { getCheckInState } from "@/app/actions/checkin";
import CheckInStation from "@/components/checkin/CheckInStation";
import InvalidLink from "@/components/invitation/InvalidLink";
import InvitationUnavailable from "@/components/invitation/InvitationUnavailable";
import { getTranslations } from "@/lib/i18n/server";

/**
 * Accueil des invités le jour J, ouvert par l'équipe d'accueil avec le lien
 * secret que l'hôte lui a confié (voir app/actions/checkin.js). Pas de
 * compte : le jeton du lien suffit, et l'hôte peut le régénérer.
 */

export async function generateMetadata() {
  const { t } = await getTranslations();
  return {
    title: t("checkin.meta_title"),
    // Page de travail privée : jamais indexée (voir aussi robots.js).
    robots: { index: false, follow: false },
  };
}

export default async function CheckInPage({ params }) {
  const { token } = await params;

  let state;
  try {
    state = await getCheckInState(token);
  } catch (error) {
    // La base n'a pas répondu : surtout pas « lien invalide », l'agent doit
    // pouvoir réessayer.
    console.error("[check-in] Chargement impossible :", error.message);
    return <InvitationUnavailable />;
  }

  if (!state) {
    const { t } = await getTranslations();
    return (
      <InvalidLink
        title={t("checkin.invalid_title")}
        description={t("checkin.invalid_desc")}
        icon={ScanLine}
      />
    );
  }

  return <CheckInStation token={token} initialState={state} />;
}
