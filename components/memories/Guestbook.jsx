"use client";

import { useState } from "react";
import { Loader2, PenLine, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { deleteMyMessage, postGuestbookMessage } from "@/app/actions/memories";
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

const MESSAGE_MAX = 500;

/**
 * Livre d'or de l'événement, vu par un invité : il écrit, lit les messages
 * des autres invités et peut supprimer les siens.
 */
export default function Guestbook({ token, initialMessages, enabled }) {
  const { t, locale } = useTranslation();
  const m = (key) => t(`invite.memories.${key}`);
  const [messages, setMessages] = useState(initialMessages);
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!text.trim()) return;
    setPosting(true);
    try {
      const message = await postGuestbookMessage(token, text);
      setMessages((current) => [message, ...current]);
      setText("");
      toast.success(m("guestbook_posted"));
    } catch {
      toast.error(m("error"));
    } finally {
      setPosting(false);
    }
  }

  async function handleDelete(id) {
    try {
      await deleteMyMessage(token, id);
      setMessages((current) => current.filter((message) => message.id !== id));
      toast.success(m("deleted"));
    } catch {
      toast.error(m("error"));
    }
  }

  const remaining = MESSAGE_MAX - text.length;

  return (
    <div>
      <h2
        id="guestbook-title"
        className="flex items-center gap-2.5 font-display text-2xl text-ink-50"
      >
        <PenLine className="h-5 w-5 text-gold/80" strokeWidth={1.5} aria-hidden="true" />
        {m("guestbook_title")}
      </h2>

      {enabled ? (
        <form
          onSubmit={handleSubmit}
          className="mt-5 rounded-2xl border border-border/70 bg-ink-850 p-4"
        >
          <label htmlFor="guestbook-message" className="sr-only">
            {m("guestbook_placeholder")}
          </label>
          <Textarea
            id="guestbook-message"
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder={m("guestbook_placeholder")}
            maxLength={MESSAGE_MAX}
            rows={4}
            className="border-0 bg-transparent px-1 shadow-none focus-visible:ring-0 dark:bg-transparent"
          />
          <div className="mt-3 flex items-center justify-between gap-3 border-t border-border/60 pt-3">
            <span
              data-numeric
              className={`text-xs ${remaining < 40 ? "text-caution" : "text-ink-400"}`}
            >
              {m("guestbook_remaining").replace("{count}", String(remaining))}
            </span>
            <Button type="submit" size="sm" disabled={posting || !text.trim()}>
              {posting && <Loader2 className="animate-spin" />}
              {posting ? m("guestbook_posting") : m("guestbook_submit")}
            </Button>
          </div>
        </form>
      ) : (
        <p className="mt-5 rounded-2xl border border-border/60 bg-ink-850/60 px-5 py-4 text-sm text-ink-400">
          {m("guestbook_disabled")}
        </p>
      )}

      {enabled && messages.length === 0 && (
        <p className="mt-6 text-sm text-ink-400">{m("guestbook_empty")}</p>
      )}

      {messages.length > 0 && (
        <ul className="mt-6 grid gap-3">
          {messages.map((message, index) => (
            <li
              key={message.id}
              className="animate-rise rounded-2xl border border-border/60 bg-ink-850 px-5 py-4"
              style={{ "--rise-delay": `${Math.min(index, 8) * 50}ms` }}
            >
              <p className="font-display text-[1.05rem] leading-relaxed whitespace-pre-line text-ink-100 wrap-break-word">
                {message.message}
              </p>
              <div className="mt-3 flex items-center justify-between gap-3">
                <p className="min-w-0 truncate text-xs text-ink-400">
                  <span className="text-gold">{message.mine ? m("you") : message.name}</span>
                  {" · "}
                  {new Date(message.createdAt).toLocaleDateString(
                    locale === "en" ? "en-US" : "fr-FR",
                    { day: "numeric", month: "long" },
                  )}
                </p>
                {message.mine && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-ink-400 hover:text-destructive"
                        aria-label={m("delete")}
                      >
                        <Trash2 />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent aria-describedby={undefined}>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{m("delete_message_confirm")}</AlertDialogTitle>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(message.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {m("delete")}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
