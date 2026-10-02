import { redirect } from "next/navigation";

import { saveUserTemplate } from "@/app/actions/template";
import { getSession } from "@/app/actions/auth";
import TemplateEditorForm from "@/components/templates/TemplateEditorForm";
import { getTranslations } from "@/lib/i18n/server";

export async function generateMetadata() {
  const { t } = await getTranslations();
  return { title: t("portal.templates.editor.title_new") };
}

export default async function NewTemplatePage() {
  const session = await getSession();
  // La création de modèles est réservée aux administrateurs.
  if (session?.role !== "admin") redirect("/dashboard/templates");

  // `saveUserTemplate` est une server action : elle se passe telle quelle au
  // composant client, qui l'appellera depuis le navigateur.
  return (
    <TemplateEditorForm
      onSave={saveUserTemplate}
      allowCode
    />
  );
}
