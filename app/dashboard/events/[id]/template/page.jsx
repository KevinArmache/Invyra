import { notFound } from "next/navigation";

import { getSession } from "@/app/actions/auth";
import { getEventById } from "@/app/actions/event";
import { getTemplates } from "@/app/actions/template";
import EventTemplateEditor from "@/components/events/detail/EventTemplateEditor";
import { getTranslations } from "@/lib/i18n/server";

export async function generateMetadata() {
  const { t } = await getTranslations();
  return { title: t("portal.events.edit.configure_invitation") };
}

export default async function EventTemplatePage({ params }) {
  const { id } = await params;

  let event;
  let templates;
  let session;
  try {
    // La galerie est chargée en même temps que l'événement : elle n'a donc
    // plus à afficher son propre état de chargement à l'ouverture de l'onglet.
    [event, templates, session] = await Promise.all([
      getEventById(id),
      getTemplates(),
      getSession(),
    ]);
  } catch {
    notFound();
  }

  return (
    <EventTemplateEditor
      event={event}
      templates={templates}
      isAdmin={session?.role === "admin"}
      uploadEnabled={Boolean(process.env.BLOB_READ_WRITE_TOKEN)}
    />
  );
}
