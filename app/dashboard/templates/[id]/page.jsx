import { notFound } from "next/navigation";

import { getSession } from "@/app/actions/auth";
import {
  getUserTemplateById,
  updateUserTemplate,
} from "@/app/actions/template";
import TemplateEditorForm from "@/components/dashboard/templates/TemplateEditorForm";
import { toEditableConfig } from "@/lib/invitation/document";
import { isDesignConfig } from "@/lib/invitation/template-config";

export async function generateMetadata({ params }) {
  const { id } = await params;
  try {
    const template = await getUserTemplateById(id);
    return { title: template.name };
  } catch {
    return { title: "Modèle" };
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

  // `bind` fige l'identifiant côté serveur : le client ne peut pas le
  // remplacer pour écrire dans le modèle d'un autre utilisateur.
  const saveTemplate = updateUserTemplate.bind(null, id);

  const session = await getSession();
  const isDesign = isDesignConfig(template.config);

  return (
    <TemplateEditorForm
      isEditing
      initialName={template.name}
      initialStatus={template.status ?? "draft"}
      initialCategory={template.category}
      initialConfig={toEditableConfig(template.config)}
      // Un modèle code existant reste modifiable par son auteur ; en créer un
      // nouveau est réservé aux admins (voir updateUserTemplate).
      allowCode={session?.role === "admin" || !isDesign}
      uploadEnabled={Boolean(process.env.BLOB_READ_WRITE_TOKEN)}
      onSave={saveTemplate}
    />
  );
}
