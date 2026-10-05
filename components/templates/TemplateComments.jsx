"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, MessageSquare, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { deleteTemplateComment, postTemplateComment } from "@/app/actions/feedback";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useTranslation } from "@/lib/i18n/Context";
import { relativeTime } from "@/lib/i18n/relative-time";

const COMMENT_MAX = 500;

/** Clé de traduction du refus renvoyé par une action d'avis. */
const ERROR_KEYS = {
  limit: "template_feedback.limit",
  not_found: "template_feedback.unavailable",
};

/**
 * Commentaires d'un modèle, dans le panneau d'avis : le champ d'écriture
 * (ou l'invitation à se connecter), puis les commentaires, du plus récent
 * au plus ancien. Chacun peut supprimer les siens ; un admin, tous.
 *
 * @param {Array<object>} props.comments   voir commentView (lib/templates/feedback.js)
 * @param {number}        props.count      total, au-delà des commentaires chargés
 * @param {boolean}       props.isAuthenticated
 * @param {string}        props.loginHref  connexion, avec retour sur la page
 * @param {() => void}    props.onAuthRequired  session expirée
 */
export default function TemplateComments({
  templateId,
  comments,
  count,
  isAuthenticated,
  loginHref,
  onPosted,
  onDeleted,
  onAuthRequired,
}) {
  const { t, locale } = useTranslation();
  const f = (key) => t(`template_feedback.${key}`);
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);
  // Le panneau est monté à chaque ouverture : l'heure de référence aussi.
  const [now] = useState(() => Date.now());

  function handleRefusal(error) {
    if (error === "auth") onAuthRequired();
    else toast.error(t(ERROR_KEYS[error] ?? "common.error"));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!text.trim() || posting) return;
    setPosting(true);
    try {
      const result = await postTemplateComment(templateId, text);
      if (result.error) {
        handleRefusal(result.error);
        return;
      }
      onPosted(result.comment);
      setText("");
      toast.success(f("posted"));
    } catch {
      toast.error(t("common.error"));
    } finally {
      setPosting(false);
    }
  }

  async function handleDelete(id) {
    try {
      const result = await deleteTemplateComment(id);
      if (result.error) {
        handleRefusal(result.error);
        return;
      }
      onDeleted(id);
      toast.success(f("deleted"));
    } catch {
      toast.error(t("common.error"));
    }
  }

  const remaining = COMMENT_MAX - text.length;

  return (
    <section aria-labelledby="template-comments-title">
      <h3
        id="template-comments-title"
        className="flex items-center gap-2 font-display text-lg text-ink-50"
      >
        <MessageSquare className="h-4 w-4 text-gold/80" strokeWidth={1.5} aria-hidden="true" />
        {f("comments_title")}
        <span data-numeric className="text-sm text-ink-400">
          {count}
        </span>
      </h3>

      {isAuthenticated ? (
        <form
          onSubmit={handleSubmit}
          className="mt-4 rounded-2xl border border-border/70 bg-ink-850 p-4"
        >
          <label htmlFor="template-comment" className="sr-only">
            {f("placeholder")}
          </label>
          <Textarea
            id="template-comment"
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder={f("placeholder")}
            maxLength={COMMENT_MAX}
            rows={3}
            className="border-0 bg-transparent px-1 shadow-none focus-visible:ring-0 dark:bg-transparent"
          />
          <div className="mt-3 flex items-center justify-between gap-3 border-t border-border/60 pt-3">
            <span
              data-numeric
              className={`text-xs ${remaining < 40 ? "text-caution" : "text-ink-400"}`}
            >
              {f("remaining").replace("{count}", String(remaining))}
            </span>
            <Button type="submit" size="sm" disabled={posting || !text.trim()}>
              {posting && <Loader2 className="animate-spin" />}
              {posting ? f("posting") : f("submit")}
            </Button>
          </div>
        </form>
      ) : (
        <div className="mt-4 rounded-2xl border border-border/60 bg-ink-850/60 px-5 py-4">
          <p className="text-sm leading-relaxed text-ink-300">{f("login_prompt")}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild size="sm">
              <Link href={loginHref}>{f("login")}</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/register">{f("register")}</Link>
            </Button>
          </div>
        </div>
      )}

      {comments.length === 0 ? (
        <p className="mt-6 text-sm leading-relaxed text-ink-400">{f("empty")}</p>
      ) : (
        <ul className="mt-5 grid gap-3">
          {comments.map((comment, index) => {
            const name = comment.mine ? f("you") : (comment.name ?? f("anonymous"));
            return (
              <li
                key={comment.id}
                className="animate-rise rounded-2xl border border-border/60 bg-ink-850 px-4 py-3.5"
                style={{ "--rise-delay": `${Math.min(index, 8) * 50}ms` }}
              >
                <div className="flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gold/25 bg-gold/10 font-display text-sm text-gold"
                  >
                    {(comment.name ?? "?").charAt(0).toUpperCase()}
                  </span>
                  <p className="min-w-0 flex-1 truncate text-xs text-ink-400">
                    <span className="text-sm text-ink-100">{name}</span>
                    {" · "}
                    <time dateTime={new Date(comment.createdAt).toISOString()}>
                      {relativeTime(comment.createdAt, now, locale, t)}
                    </time>
                  </p>
                  {comment.canDelete && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="shrink-0 text-ink-400 hover:text-destructive"
                          aria-label={f("delete")}
                        >
                          <Trash2 />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent aria-describedby={undefined}>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{f("delete_confirm")}</AlertDialogTitle>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(comment.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            {f("delete")}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
                <p className="mt-2.5 text-[0.95rem] leading-relaxed whitespace-pre-line text-ink-100 wrap-break-word">
                  {comment.message}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
