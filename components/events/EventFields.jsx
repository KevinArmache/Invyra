"use client";

import { Calendar, Clock, MapPin, Phone, Shirt } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "@/lib/i18n/Context";

/**
 * Champs décrivant un événement, partagés par la création et l'édition.
 *
 * Non contrôlés : les valeurs sont lues à la soumission via FormData. Les deux
 * écrans tenaient auparavant chacun leur propre objet d'état et leurs propres
 * gestionnaires de frappe, et avaient fini par diverger.
 */
export default function EventFields({ defaults = {} }) {
  const { t } = useTranslation();

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="event-title">{t("portal.events.new.labels.title")}</Label>
        <Input
          id="event-title"
          name="title"
          defaultValue={defaults.title ?? ""}
          placeholder={t("portal.events.new.placeholders.title")}
          required
        />
      </div>

      <div className="grid items-end gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="event-date" className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-ink-400" />
            {t("portal.events.new.labels.date")}
          </Label>
          <Input
            id="event-date"
            name="event_date"
            type="datetime-local"
            defaultValue={defaults.event_date ?? ""}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="event-time" className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-ink-400" />
            {t("portal.events.new.labels.time")}
          </Label>
          <Input
            id="event-time"
            name="time"
            defaultValue={defaults.time ?? ""}
            placeholder={t("portal.events.new.placeholders.time")}
          />
        </div>
      </div>

      <div className="grid items-end gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="event-location" className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-ink-400" />
            {t("portal.events.new.labels.location")}
          </Label>
          <Input
            id="event-location"
            name="location"
            defaultValue={defaults.location ?? ""}
            placeholder={t("portal.events.new.placeholders.location")}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="event-dress" className="flex items-center gap-1.5">
            <Shirt className="h-3.5 w-3.5 text-ink-400" />
            {t("portal.events.new.labels.dress_code")}
          </Label>
          <Input
            id="event-dress"
            name="dress_code"
            defaultValue={defaults.dress_code ?? ""}
            placeholder={t("portal.events.new.placeholders.dress_code")}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="event-contact-phone" className="flex items-center gap-1.5">
          <Phone className="h-3.5 w-3.5 text-ink-400" />
          {t("portal.events.new.labels.contact_phone")}
        </Label>
        <Input
          id="event-contact-phone"
          name="contact_phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          maxLength={30}
          // Parenthèses, point et tiret échappés : les navigateurs récents
          // compilent `pattern` avec le drapeau `v`, qui les exige.
          pattern="[+0-9 \(\)\.\-]{6,30}"
          defaultValue={defaults.contact_phone ?? ""}
          placeholder={t("portal.events.new.placeholders.contact_phone")}
          aria-describedby="event-contact-phone-hint"
          className="sm:max-w-sm"
        />
        <p id="event-contact-phone-hint" className="text-xs text-ink-400">
          {t("portal.events.new.hints.contact_phone")}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="event-description">
          {t("portal.events.new.labels.description")}
        </Label>
        <Textarea
          id="event-description"
          name="description"
          rows={4}
          defaultValue={defaults.description ?? ""}
          placeholder={t("portal.events.new.placeholders.desc")}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="event-message">
          {t("portal.events.details.overview.message")}
        </Label>
        <Textarea
          id="event-message"
          name="custom_message"
          rows={3}
          defaultValue={defaults.custom_message ?? ""}
        />
      </div>
    </div>
  );
}
