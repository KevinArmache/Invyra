import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";

import { getTemplatesPage } from "@/app/actions/template";
import { getCurrentUser } from "@/app/actions/auth";
import { getTranslations } from "@/utils/i18n/server";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/dashboard/ui";
import TemplatesBrowser from "@/components/dashboard/templates/TemplatesBrowser";

export const metadata = { title: "Modèles" };

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

  return (
    <>
      <PageHeader
        title={t("portal.templates.list.title")}
        subtitle={t("portal.templates.list.subtitle")}
        action={
          // La création de modèles est réservée aux administrateurs.
          user.role === "admin" ? (
            <Button asChild size="lg">
              <Link href="/dashboard/templates/new">
                <Plus size={18} className="mr-2" />
                {t("portal.templates.list.new_btn")}
              </Link>
            </Button>
          ) : undefined
        }
      />

      <TemplatesBrowser
        {...result}
        activeCategory={typeof category === "string" ? category : ""}
        query={typeof q === "string" ? q : ""}
        currentUser={{ id: user.id, role: user.role }}
      />
    </>
  );
}
