import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";

import { getTemplatesPage } from "@/app/actions/template";
import { getCurrentUser } from "@/app/actions/auth";
import { getTranslations } from "@/lib/i18n/server";
import { withVoteCounts } from "@/lib/templates/feedback";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shell/primitives";
import TemplatesBrowser from "@/components/templates/TemplatesBrowser";

export async function generateMetadata() {
  const { t } = await getTranslations();
  return { title: t("portal.templates.list.title") };
}

/**
 * Galerie des modèles, paginée. Filtre et recherche vivent dans l'URL
 * (?category=wedding&q=…&page=2) : un lien ou un retour arrière retrouve la
 * même vue, et seul le serveur trie les modèles.
 */
export default async function TemplatesPage({ searchParams }) {
  const { page, category, q } = await searchParams;
  const [result, user, { t }] = await Promise.all([
    getTemplatesPage({ page, category, query: q }),
    getCurrentUser(),
    getTranslations(),
  ]);

  if (!user) redirect("/login");

  // Votes des cartes, comme sur la collection publique (le layout du
  // tableau de bord écarte déjà les comptes suspendus).
  const templates = await withVoteCounts(result.templates, {
    userId: user.id,
    role: user.role ?? "user",
  });

  return (
    <>
      <PageHeader
        title={t("portal.templates.list.title")}
        // Les clients choisissent un modèle ; seuls les admins en créent.
        subtitle={t(
          user.role === "admin"
            ? "portal.templates.list.subtitle_admin"
            : "portal.templates.list.subtitle",
        )}
        action={
          // La création de modèles est réservée aux administrateurs.
          user.role === "admin" ? (
            <Button asChild size="lg" className="group">
              <Link href="/dashboard/templates/new">
                <Plus size={18} className="transition-transform duration-300 group-hover:rotate-90" />
                {t("portal.templates.list.new_btn")}
              </Link>
            </Button>
          ) : undefined
        }
      />

      <TemplatesBrowser
        {...result}
        templates={templates}
        activeCategory={typeof category === "string" ? category : ""}
        query={typeof q === "string" ? q : ""}
        currentUser={{ id: user.id, role: user.role }}
      />
    </>
  );
}
