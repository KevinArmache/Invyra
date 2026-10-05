"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, X } from "lucide-react";
import { toast } from "sonner";

import { voteTemplate } from "@/app/actions/feedback";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import TemplateComments from "@/components/templates/TemplateComments";
import VoteButtons from "@/components/templates/VoteButtons";
import { useTranslation } from "@/lib/i18n/Context";

/** Compteurs après le passage de `current.myVote` à `next`. */
function applyVote(current, next) {
  const counts = { likes: current.likes, dislikes: current.dislikes };
  if (current.myVote === "like") counts.likes -= 1;
  if (current.myVote === "dislike") counts.dislikes -= 1;
  if (next === "like") counts.likes += 1;
  if (next === "dislike") counts.dislikes += 1;
  return { ...counts, myVote: next };
}

/**
 * Avis sur un modèle, dans la barre de sa page publique : les votes (à
 * partir de md) et un bouton qui ouvre le panneau d'avis, avec les votes et
 * les commentaires. Sur téléphone, seul ce bouton tient dans la barre.
 *
 * Le vote s'affiche tout de suite, puis prend les compteurs renvoyés par le
 * serveur ; s'il échoue, l'affichage revient à l'état précédent.
 *
 * @param {{ id: string, name: string }} props.template
 * @param {object}  props.initial  voir getTemplateFeedback (lib/templates/feedback.js)
 * @param {boolean} props.isAuthenticated
 */
export default function TemplateFeedback({ template, initial, isAuthenticated }) {
  const { t } = useTranslation();
  const f = (key) => t(`template_feedback.${key}`);
  const router = useRouter();
  const [votes, setVotes] = useState({
    likes: initial.likes,
    dislikes: initial.dislikes,
    myVote: initial.myVote,
  });
  const [comments, setComments] = useState(initial.comments);
  const [commentCount, setCommentCount] = useState(initial.commentCount);
  // Un vote à la fois : un double clic ne doit pas croiser deux requêtes.
  const voting = useRef(false);

  const loginHref = `/login?redirect=${encodeURIComponent(`/templates/${template.id}`)}`;

  function promptLogin() {
    toast(f("login_required"), {
      action: { label: f("login"), onClick: () => router.push(loginHref) },
    });
  }

  async function handleVote(kind) {
    if (!isAuthenticated) {
      promptLogin();
      return;
    }
    if (voting.current) return;
    voting.current = true;

    const previous = votes;
    const next = previous.myVote === kind ? null : kind;
    setVotes(applyVote(previous, next));
    try {
      const result = await voteTemplate(template.id, next);
      if (result.error) {
        setVotes(previous);
        if (result.error === "auth") promptLogin();
        else if (result.error === "not_found") toast.error(f("unavailable"));
        else toast.error(t("common.error"));
        return;
      }
      setVotes(result);
    } catch {
      setVotes(previous);
      toast.error(t("common.error"));
    } finally {
      voting.current = false;
    }
  }

  function handlePosted(comment) {
    setComments((current) => [comment, ...current]);
    setCommentCount((current) => current + 1);
  }

  function handleDeleted(id) {
    setComments((current) => current.filter((comment) => comment.id !== id));
    setCommentCount((current) => Math.max(0, current - 1));
  }

  return (
    <Sheet>
      <VoteButtons
        {...votes}
        onVote={handleVote}
        className="hidden shrink-0 md:flex"
      />

      <SheetTrigger asChild>
        <button
          type="button"
          title={f("open")}
          className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-border px-3 text-xs text-ink-300 transition-[color,border-color,translate] duration-300 hover:-translate-y-0.5 hover:border-gold/30 hover:text-ink-100 focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none"
        >
          <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="sr-only">{f("open")}</span>
          <span data-numeric>{commentCount}</span>
        </button>
      </SheetTrigger>

      <SheetContent>
        <div
          className="flex shrink-0 items-start gap-3 border-b border-border/60 px-5 pt-5 pb-4"
          style={{ paddingTop: "max(1.25rem, env(safe-area-inset-top, 0px))" }}
        >
          <div className="min-w-0 flex-1">
            <SheetDescription className="truncate text-[10px] tracking-[0.18em] text-gold/80 uppercase">
              {template.name}
            </SheetDescription>
            <SheetTitle className="mt-1 text-2xl">{f("title")}</SheetTitle>
          </div>
          <SheetClose asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0 text-ink-300 hover:text-ink-50"
              aria-label={t("common.close")}
            >
              <X className="h-5 w-5" />
            </Button>
          </SheetClose>
        </div>

        <div
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pt-5"
          style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom, 0px))" }}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-ink-300">{f("vote_question")}</p>
            <VoteButtons {...votes} onVote={handleVote} />
          </div>

          <hr className="rule-gold-left mt-5 mb-6 w-16" />

          <TemplateComments
            templateId={template.id}
            comments={comments}
            count={commentCount}
            isAuthenticated={isAuthenticated}
            loginHref={loginHref}
            onPosted={handlePosted}
            onDeleted={handleDeleted}
            onAuthRequired={promptLogin}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
