import {
  BarChart3,
  Images,
  LockKeyhole,
  Mail,
  MailOpen,
  MousePointerClick,
  Music2,
  Route,
  ScanLine,
  Ticket,
  UserPlus,
  Users,
} from "lucide-react";

import { getTranslations } from "@/lib/i18n/server";
import { SITE_URL } from "@/lib/site";
import {
  CheckInVisual,
  DirectionsVisual,
  GuestsVisual,
  MemoriesVisual,
  MusicVisual,
  NoCodeVisual,
  OpeningVisual,
  PrivacyVisual,
  SendingVisual,
  TeamVisual,
  TicketVisual,
  TrackingVisual,
} from "@/components/landing/FeatureVisuals";

/**
 * Grille « bento » : la taille d'une carte suit l'importance de la fonction.
 * Sur grand écran (4 colonnes), de l'invitation au jour J :
 *
 *   [ ouverture 2×2 ][ sans code   2 ]
 *   [               ][musique][invités]
 *   [ envoi       2 ][ suivi       2 ]
 *   [ billet      2 ][ accueil     2 ]
 *   [ itinéraire  2 ][ souvenirs   2 ]
 *   [ liens       2 ][ à plusieurs 2 ]
 */
const FEATURES = [
  { key: "opening", icon: MailOpen, span: "md:col-span-2 lg:row-span-2", tall: true },
  { key: "nocode", icon: MousePointerClick, span: "md:col-span-2" },
  { key: "music", icon: Music2, span: "" },
  { key: "guests", icon: UserPlus, span: "" },
  { key: "sending", icon: Mail, span: "lg:col-span-2" },
  { key: "tracking", icon: BarChart3, span: "lg:col-span-2" },
  { key: "ticket", icon: Ticket, span: "lg:col-span-2" },
  { key: "checkin", icon: ScanLine, span: "lg:col-span-2" },
  { key: "directions", icon: Route, span: "lg:col-span-2" },
  { key: "memories", icon: Images, span: "lg:col-span-2" },
  { key: "privacy", icon: LockKeyhole, span: "lg:col-span-2" },
  { key: "team", icon: Users, span: "lg:col-span-2" },
];

export default async function FeaturesSection() {
  const { t } = await getTranslations();
  const visual = (key) => t(`landing.features.visual.${key}`);
  const domain = new URL(SITE_URL).host;

  const visuals = {
    opening: (
      <OpeningVisual
        labels={{
          envelope: t("portal.editor.options.style.envelope"),
          seal: t("portal.editor.options.style.seal"),
          curtain: t("portal.editor.options.style.curtain"),
        }}
      />
    ),
    music: <MusicVisual />,
    nocode: (
      <NoCodeVisual
        labels={{
          title: visual("title_label"),
          typed: visual("typed"),
          colors: visual("colors_label"),
        }}
      />
    ),
    guests: <GuestsVisual labels={{ file: visual("csv_file") }} />,
    sending: (
      <SendingVisual
        labels={{
          email: t("portal.events.details.guests.table.email"),
          whatsapp: t("portal.events.details.guests.table.whatsapp"),
        }}
      />
    ),
    tracking: (
      <TrackingVisual
        labels={{ opened: visual("opened"), confirmed: visual("confirmed") }}
      />
    ),
    ticket: (
      <TicketVisual
        labels={{
          eyebrow: t("invite.ticket.eyebrow"),
          guest: t("landing.hero.scene.guest"),
          pass: t("invite.ticket.pass_other").replace("{count}", "2"),
        }}
      />
    ),
    checkin: (
      <CheckInVisual
        labels={{
          welcome: t("checkin.result.ok_title"),
          arrived: t("checkin.people_label"),
        }}
      />
    ),
    directions: (
      <DirectionsVisual
        labels={{
          apps: [
            t("invite.directions.google"),
            t("invite.directions.waze"),
            t("invite.directions.apple"),
          ],
        }}
      />
    ),
    memories: (
      <MemoriesVisual
        labels={{
          guestbook: t("invite.memories.guestbook_title"),
          note: visual("guestbook_note"),
        }}
      />
    ),
    privacy: (
      <PrivacyVisual
        labels={{ preview: visual("preview_title") }}
        domain={domain}
      />
    ),
    team: (
      <TeamVisual
        labels={{
          editor: t("portal.events.details.role_editor"),
          viewer: t("portal.events.details.role_viewer"),
        }}
      />
    ),
  };

  return (
    <section
      id="features"
      aria-labelledby="features-title"
      className="relative scroll-mt-20 border-t border-border/60 px-4 py-24 sm:px-6 lg:px-8 lg:py-32"
    >
      <div className="mx-auto max-w-7xl">
        <header data-reveal className="mx-auto max-w-2xl text-center">
          <p className="eyebrow text-gold/80">{t("landing.features.eyebrow")}</p>
          <h2
            id="features-title"
            className="mt-4 text-4xl leading-tight text-balance text-ink-50 sm:text-5xl"
          >
            {t("landing.features.title")}
            <em className="text-gold not-italic">
              {t("landing.features.title_highlight")}
            </em>
          </h2>
          <hr className="rule-gold mx-auto mt-7 w-24" />
          <p className="mt-7 text-lg leading-relaxed text-pretty text-ink-300">
            {t("landing.features.subtitle")}
          </p>
        </header>

        <ul className="mt-16 grid gap-4 md:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          {FEATURES.map((feature, index) => (
            <li
              key={feature.key}
              data-reveal="scale"
              style={{ "--i": index % 4 }}
              className={feature.span}
            >
              <article className="group spotlight surface-interactive flex h-full flex-col overflow-hidden rounded-xl">
                <div
                  className={`border-b border-border/50 bg-ink-900/40 ${
                    feature.tall ? "min-h-56 flex-1 lg:min-h-0" : "h-44"
                  }`}
                >
                  {visuals[feature.key]}
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-gold/25 bg-gold/5 transition-colors duration-300 group-hover:border-gold/50 group-hover:bg-gold/10">
                      <feature.icon
                        className="h-4 w-4 text-gold transition-transform duration-500 group-hover:scale-110"
                        strokeWidth={1.6}
                      />
                    </span>
                    <h3 className="text-lg leading-snug text-ink-50">
                      {t(`landing.features.items.${feature.key}.title`)}
                    </h3>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-pretty text-ink-300">
                    {t(`landing.features.items.${feature.key}.desc`)}
                  </p>
                </div>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
