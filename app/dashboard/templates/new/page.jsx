import { redirect } from "next/navigation";

import { saveUserTemplate } from "@/app/actions/template";
import { getSession } from "@/app/actions/auth";
import TemplateEditorForm from "@/components/dashboard/templates/TemplateEditorForm";

export const metadata = { title: "Nouveau modèle" };

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
      uploadEnabled={Boolean(process.env.BLOB_READ_WRITE_TOKEN)}
    />
  );
}
