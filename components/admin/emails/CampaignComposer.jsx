"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AtSign, Eye, LayoutTemplate, Loader2, PenLine, Send, UserRound } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Panel } from "@/components/shell/primitives";
import { launchCampaign, previewCampaign, sendCampaignTest } from "@/app/actions/campaign";
import { CAMPAIGN_LIMITS, GROUP_AUDIENCES, templateAnnouncement } from "@/lib/email/campaign";
import RecipientPicker, { canReceive } from "@/components/admin/emails/RecipientPicker";
import { useTranslation } from "@/lib/i18n/Context";

const EMPTY_FIELDS = {
  subject: "",
  preheader: "",
  heading: "",
  message: "",
  ctaLabel: "",
  ctaUrl: "",
};

const KINDS = [
  { value: "template", icon: LayoutTemplate, key: "portal.campaigns.kind_template" },
  { value: "free", icon: PenLine, key: "portal.campaigns.kind_free" },
];

/** Libellé, champ et aide, avec l'aide reliée au champ. */
function Field({ id, label, hint, children }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint && (
        <p id={`${id}-hint`} className="text-xs leading-relaxed text-ink-400">
          {hint}
        </p>
      )}
    </div>
  );
}

/** Pilule d'un groupe de choix exclusifs (role="radio"). */
function Choice({ active, onSelect, children, className = "" }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onSelect}
      className={`rounded-full border px-3.5 py-1.5 text-xs transition-colors ${
        active
          ? "border-gold bg-gold/10 text-ink-50"
          : "border-border text-ink-300 hover:border-gold/40"
      } ${className}`}
    >
      {children}
    </button>
  );
}

/**
 * Rédaction d'un e-mail d'annonce : un modèle à annoncer (le texte se
 * préremplit) ou un message libre, l'audience, puis aperçu, test et envoi.
 * L'envoi lui-même se déroule sur la page de l'envoi (CampaignSender).
 *
 * @param {Array<{id: string, name: string, category: string|null}>} props.templates  modèles publics
 * @param {{all: number, free: number, premium: number}} props.audienceCounts
 * @param {string} [props.initialTemplateId]  modèle choisi depuis la galerie
 * @param {object|null} [props.initialRecipient]  personne choisie depuis la
 *   liste des utilisateurs (audience « une personne »)
 */
export default function CampaignComposer({
  templates,
  audienceCounts,
  initialTemplateId,
  initialRecipient,
}) {
  const { t } = useTranslation();
  const router = useRouter();

  const initialTemplate = templates.find((item) => item.id === initialTemplateId) ?? null;
  const [kind, setKind] = useState(
    initialTemplate || templates.length > 0 ? "template" : "free",
  );
  const [templateId, setTemplateId] = useState(initialTemplate?.id ?? "");
  const [fields, setFields] = useState(() =>
    initialTemplate ? templateAnnouncement(initialTemplate) : EMPTY_FIELDS,
  );
  const [audience, setAudience] = useState(initialRecipient ? "user" : "all");
  // Un compte désabonné n'est pas retenu : le sélecteur le montre, grisé,
  // avec la raison (sa recherche part de son adresse).
  const [recipient, setRecipient] = useState(
    canReceive(initialRecipient) ? initialRecipient : null,
  );
  const [pending, setPending] = useState(null); // "preview" | "test" | "launch"
  const [preview, setPreview] = useState(null); // { subject, html }
  const [confirmOpen, setConfirmOpen] = useState(false);

  const toPerson = audience === "user";
  const count = toPerson ? (recipient ? 1 : 0) : (audienceCounts[audience] ?? 0);
  const personName = recipient ? recipient.name || recipient.email : "";
  const ready = Boolean(
    fields.subject.trim() && fields.heading.trim() && fields.message.trim(),
  );
  const busy = pending !== null;
  const input = {
    ...fields,
    templateId: kind === "template" ? templateId : "",
    audience,
    recipientId: toPerson ? (recipient?.id ?? "") : "",
  };

  function update(name) {
    return (event) => setFields((current) => ({ ...current, [name]: event.target.value }));
  }

  function chooseTemplate(id) {
    setTemplateId(id);
    const template = templates.find((item) => item.id === id);
    if (template) setFields(templateAnnouncement(template));
  }

  // Le texte saisi est gardé d'un type à l'autre ; seul le lien au modèle
  // disparaît en message libre.
  function chooseKind(next) {
    setKind(next);
    if (next === "free") setTemplateId("");
  }

  async function run(name, action) {
    setPending(name);
    try {
      return await action();
    } catch (caught) {
      toast.error(caught.message || t("common.error"));
      return null;
    } finally {
      setPending(null);
    }
  }

  async function handlePreview() {
    const result = await run("preview", () => previewCampaign(input));
    if (result) setPreview(result);
  }

  async function handleTest() {
    const result = await run("test", () => sendCampaignTest(input));
    if (result) {
      toast.success(t("portal.campaigns.test_sent").replace("{email}", result.email));
    }
  }

  async function handleLaunch() {
    const result = await run("launch", () => launchCampaign(input));
    if (result) {
      setConfirmOpen(false);
      router.push(`/admin/emails/${result.id}?start=1`);
    }
  }

  const sendLabel = recipient && toPerson
    ? t("portal.campaigns.send_to_person").replace("{name}", personName)
    : t("portal.campaigns.send").replace("{count}", String(count));

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
      <div className="min-w-0 space-y-6">
        {/* ── Type d'envoi ─────────────────────────────────────────────── */}
        <Panel
          delay={100}
          title={t("portal.campaigns.kind_title")}
          description={t("portal.campaigns.kind_desc")}
        >
          <div className="space-y-5 p-5">
            <div
              role="radiogroup"
              aria-label={t("portal.campaigns.kind_title")}
              className="flex flex-wrap gap-2"
            >
              {KINDS.map(({ value, icon: Icon, key }) => (
                <Choice
                  key={value}
                  active={kind === value}
                  onSelect={() => chooseKind(value)}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm"
                >
                  <Icon className="h-4 w-4 text-gold/80" strokeWidth={1.75} aria-hidden="true" />
                  {t(key)}
                </Choice>
              ))}
            </div>

            {kind === "template" &&
              (templates.length === 0 ? (
                <p className="text-sm text-ink-400">{t("portal.campaigns.no_templates")}</p>
              ) : (
                <Field
                  id="campaign-template"
                  label={t("portal.campaigns.template_label")}
                  hint={t("portal.campaigns.template_hint")}
                >
                  <Select value={templateId} onValueChange={chooseTemplate}>
                    <SelectTrigger
                      id="campaign-template"
                      aria-describedby="campaign-template-hint"
                      className="w-full sm:max-w-md"
                    >
                      <SelectValue placeholder={t("portal.campaigns.template_placeholder")} />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                          {template.category && (
                            <span className="text-ink-400">
                              {" · "}
                              {t(`portal.templates.categories.${template.category}`)}
                            </span>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              ))}
          </div>
        </Panel>

        {/* ── Contenu ──────────────────────────────────────────────────── */}
        <Panel
          delay={180}
          title={t("portal.campaigns.content_title")}
          description={t("portal.campaigns.content_desc")}
        >
          <div className="space-y-5 p-5">
            <Field id="campaign-subject" label={t("portal.campaigns.subject")}>
              <Input
                id="campaign-subject"
                value={fields.subject}
                onChange={update("subject")}
                maxLength={CAMPAIGN_LIMITS.subject}
                placeholder={t("portal.campaigns.subject_placeholder")}
                required
              />
            </Field>

            <Field
              id="campaign-preheader"
              label={t("portal.campaigns.preheader")}
              hint={t("portal.campaigns.preheader_hint")}
            >
              <Input
                id="campaign-preheader"
                value={fields.preheader}
                onChange={update("preheader")}
                maxLength={CAMPAIGN_LIMITS.preheader}
                aria-describedby="campaign-preheader-hint"
              />
            </Field>

            <Field id="campaign-heading" label={t("portal.campaigns.heading")}>
              <Input
                id="campaign-heading"
                value={fields.heading}
                onChange={update("heading")}
                maxLength={CAMPAIGN_LIMITS.heading}
                required
              />
            </Field>

            <Field
              id="campaign-message"
              label={t("portal.campaigns.message")}
              hint={t("portal.campaigns.message_hint")}
            >
              <Textarea
                id="campaign-message"
                value={fields.message}
                onChange={update("message")}
                maxLength={CAMPAIGN_LIMITS.message}
                aria-describedby="campaign-message-hint"
                className="min-h-40"
                required
              />
            </Field>

            <div className="space-y-2">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field id="campaign-cta-label" label={t("portal.campaigns.cta_label")}>
                  <Input
                    id="campaign-cta-label"
                    value={fields.ctaLabel}
                    onChange={update("ctaLabel")}
                    maxLength={CAMPAIGN_LIMITS.ctaLabel}
                    aria-describedby="campaign-cta-hint"
                  />
                </Field>
                <Field id="campaign-cta-url" label={t("portal.campaigns.cta_url")}>
                  <Input
                    id="campaign-cta-url"
                    value={fields.ctaUrl}
                    onChange={update("ctaUrl")}
                    maxLength={CAMPAIGN_LIMITS.ctaUrl}
                    placeholder="/templates/…"
                    inputMode="url"
                    aria-describedby="campaign-cta-hint"
                  />
                </Field>
              </div>
              <p id="campaign-cta-hint" className="text-xs leading-relaxed text-ink-400">
                {t("portal.campaigns.cta_hint")}
              </p>
            </div>
          </div>
        </Panel>
      </div>

      {/* ── Destinataires et envoi ─────────────────────────────────────── */}
      <aside className="lg:sticky lg:top-6">
        <Panel
          delay={260}
          title={t("portal.campaigns.audience_title")}
          description={t("portal.campaigns.audience_desc")}
        >
          <div className="space-y-5 p-5">
            <div
              role="radiogroup"
              aria-label={t("portal.campaigns.audience")}
              className="space-y-2"
            >
              {GROUP_AUDIENCES.map((value) => (
                <Choice
                  key={value}
                  active={audience === value}
                  onSelect={() => setAudience(value)}
                  className="flex w-full items-center justify-between gap-3 rounded-lg px-3.5 py-2.5 text-left text-sm"
                >
                  <span>{t(`portal.campaigns.audience_${value}`)}</span>
                  <span data-numeric className="inline-flex items-center gap-1 text-ink-400">
                    <UserRound className="h-3.5 w-3.5" aria-hidden="true" />
                    {audienceCounts[value] ?? 0}
                  </span>
                </Choice>
              ))}
              <Choice
                active={toPerson}
                onSelect={() => setAudience("user")}
                className="flex w-full items-center justify-between gap-3 rounded-lg px-3.5 py-2.5 text-left text-sm"
              >
                <span>{t("portal.campaigns.audience_user")}</span>
                <AtSign className="h-3.5 w-3.5 text-ink-400" aria-hidden="true" />
              </Choice>
            </div>

            {toPerson ? (
              <RecipientPicker
                value={recipient}
                onChange={setRecipient}
                initialQuery={recipient ? "" : (initialRecipient?.email ?? "")}
              />
            ) : (
              <p className="text-xs leading-relaxed text-ink-400">
                {t("portal.campaigns.quota_hint")}
              </p>
            )}

            <div className="flex flex-col gap-2.5 border-t border-border/60 pt-5">
              <Button
                type="button"
                variant="outline"
                onClick={handlePreview}
                disabled={!ready || busy}
              >
                {pending === "preview" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
                {t("portal.campaigns.preview")}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={handleTest}
                disabled={!ready || busy}
              >
                {pending === "test" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserRound className="h-4 w-4" />
                )}
                {t("portal.campaigns.send_test")}
              </Button>

              <Button
                type="button"
                className="group"
                onClick={() => setConfirmOpen(true)}
                disabled={!ready || busy || count === 0}
              >
                <Send className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                {sendLabel}
              </Button>

              {count === 0 && (
                <p className="text-xs text-caution">
                  {t(toPerson ? "portal.campaigns.person_required" : "portal.campaigns.no_recipients")}
                </p>
              )}
            </div>
          </div>
        </Panel>
      </aside>

      {/* ── Aperçu ─────────────────────────────────────────────────────── */}
      <Dialog open={preview !== null} onOpenChange={(open) => !open && setPreview(null)}>
        <DialogContent className="max-h-[92dvh] sm:max-w-[680px]">
          <DialogHeader>
            <DialogTitle>{t("portal.campaigns.preview_title")}</DialogTitle>
            <DialogDescription className="truncate">
              {t("portal.campaigns.subject")} : {preview?.subject}
            </DialogDescription>
          </DialogHeader>
          {preview && (
            // Isolé du site : pas de script, les liens s'ouvrent dans un onglet.
            <iframe
              title={t("portal.campaigns.preview_frame")}
              srcDoc={preview.html}
              sandbox="allow-popups allow-popups-to-escape-sandbox"
              className="h-[68dvh] w-full rounded-lg border border-border bg-ink-900"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* ── Confirmation d'envoi ───────────────────────────────────────── */}
      <AlertDialog open={confirmOpen} onOpenChange={(open) => !busy && setConfirmOpen(open)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {toPerson
                ? t("portal.campaigns.confirm_title_person").replace("{name}", personName)
                : t("portal.campaigns.confirm_title").replace("{count}", String(count))}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t(toPerson ? "portal.campaigns.confirm_body_person" : "portal.campaigns.confirm_body")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                // Le dialogue reste ouvert le temps de créer l'envoi.
                event.preventDefault();
                handleLaunch();
              }}
              disabled={busy}
            >
              {pending === "launch" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {t("portal.campaigns.confirm_send")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
