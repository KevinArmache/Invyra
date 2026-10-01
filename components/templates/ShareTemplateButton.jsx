"use client";

import { useState } from "react";
import { Link2, Mail, MessageCircle, Share2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from "@/lib/i18n/Context";

/**
 * Partage d'un modèle hors du site : le lien mène à sa page publique
 * (/templates/[id]), où n'importe qui peut l'ouvrir sans compte.
 *
 * Sur téléphone, « Partager… » ouvre la feuille de partage du système
 * (Messages, WhatsApp, Instagram…). Partout, le lien se copie ou part
 * directement par WhatsApp ou par email.
 *
 * Le lien est construit au clic, avec l'origine de la page : il vaut en
 * local comme en production, et rien ne dépend du rendu serveur.
 *
 * N'affichez ce bouton que pour un modèle publié (terminé ou mis en avant) :
 * la page publique refuse les autres.
 *
 * @param {{ id: string, name: string }} props.template
 * @param {"icon"|"button"} [props.variant]
 */
export default function ShareTemplateButton({
  template,
  variant = "icon",
  align = "end",
  className = "",
}) {
  const { t } = useTranslation();
  const [canShareNatively, setCanShareNatively] = useState(false);

  const label = t("share.button_label").replace("{name}", template.name);

  function link() {
    return `${window.location.origin}/templates/${template.id}`;
  }

  function message() {
    return t("share.message").replace("{name}", template.name);
  }

  async function shareNatively() {
    try {
      await navigator.share({ title: template.name, text: message(), url: link() });
    } catch {
      // Feuille de partage refermée sans choix : rien à signaler.
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link());
      toast.success(t("share.copied"));
    } catch {
      toast.error(t("common.error"));
    }
  }

  function shareOnWhatsApp() {
    window.open(
      `https://wa.me/?text=${encodeURIComponent(`${message()} ${link()}`)}`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  function shareByEmail() {
    const subject = t("share.email_subject").replace("{name}", template.name);
    window.location.href = `mailto:?subject=${encodeURIComponent(
      subject,
    )}&body=${encodeURIComponent(`${message()}\n\n${link()}`)}`;
  }

  return (
    <DropdownMenu
      onOpenChange={(open) => {
        if (open) setCanShareNatively(typeof navigator.share === "function");
      }}
    >
      <DropdownMenuTrigger asChild>
        {variant === "icon" ? (
          <Button
            variant="ghost"
            size="icon"
            aria-label={label}
            title={label}
            className={`group/share h-8 w-8 text-ink-400 hover:text-gold ${className}`}
          >
            <Share2
              size={15}
              className="transition-transform duration-300 group-hover/share:-translate-y-0.5"
            />
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            aria-label={label}
            className={`group/share ${className}`}
          >
            <Share2 className="transition-transform duration-300 group-hover/share:-translate-y-0.5" />
            {t("share.button")}
          </Button>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent align={align} className="w-56">
        <DropdownMenuLabel className="truncate text-xs font-normal text-ink-400">
          {template.name}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {canShareNatively && (
          <DropdownMenuItem onSelect={shareNatively} className="cursor-pointer">
            <Share2 className="h-4 w-4 text-gold" />
            {t("share.native")}
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onSelect={copyLink} className="cursor-pointer">
          <Link2 className="h-4 w-4 text-gold" />
          {t("share.copy")}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={shareOnWhatsApp} className="cursor-pointer">
          <MessageCircle className="h-4 w-4 text-gold" />
          {t("share.whatsapp")}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={shareByEmail} className="cursor-pointer">
          <Mail className="h-4 w-4 text-gold" />
          {t("share.email")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
