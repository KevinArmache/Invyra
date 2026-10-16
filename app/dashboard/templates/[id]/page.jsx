import { notFound } from "next/navigation";

import { getSession } from "@/app/actions/auth";
import {
  getUserTemplateById,
  updatePrintTemplate,
  updateUserTemplate,
} from "@/app/actions/template";
import TemplateEditorForm from "@/components/templates/TemplateEditorForm";
import PrintTemplateEditor from "@/components/stationery/PrintTemplateEditor";
import { toEditableConfig } from "@/lib/templates/validation";
import { normalizePrintConfig } from "@/lib/print/config";
import { getTranslations } from "@/lib/i18n/server";

export async function generateMetadata({ params }) {
  const { id } = await params;
  try {
    const template = await getUserTemplateById(id);
    return { title: template.name };
  } catch {
    const { t } = await getTranslations();
    return { title: t("portal.templates.list.title") };
  }
}

export default async function EditTemplatePage({ params }) {
  const { id } = await params;

  let template;
  try {
    template = await getUserTemplateById(id);
  } catch {
    // Modèle inexistant, ou appartenant à quelqu'un d'autre.
    notFound();
  }

  const session = await getSession();

  // Invitation papier : son propre éditeur, réservé aux admins (voir
  // updatePrintTemplate).
  if (template.medium === "print") {
    const config = normalizePrintConfig(template.config);
    if (session?.role !== "admin" || !config) notFound();
    return (
      <PrintTemplateEditor
        initialName={template.name}
        initialStatus={template.status ?? "draft"}
        initialCategory={template.category}
        initialConfig={config}
        onSave={updatePrintTemplate.bind(null, id)}
      />
    );
  }

  // `bind` fige l'identifiant côté serveur : le client ne peut pas le
  // remplacer pour écrire dans le modèle d'un autre utilisateur.
  const saveTemplate = updateUserTemplate.bind(null, id);

  return (
    <TemplateEditorForm
      isEditing
      initialName={template.name}
      initialStatus={template.status ?? "draft"}
      initialCategory={template.category}
      initialConfig={toEditableConfig(template.config)}
      // Le code est réservé aux admins (voir updateUserTemplate) ; les autres
      // modifient textes, images, liens et couleurs dans l'éditeur visuel.
      allowCode={session?.role === "admin"}
      onSave={saveTemplate}
    />
  );
}
