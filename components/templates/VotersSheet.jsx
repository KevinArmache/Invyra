"use client";

import { useState } from "react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import InitialAvatar from "@/components/common/InitialAvatar";
import VoteButtons from "@/components/templates/VoteButtons";
import { useTranslation } from "@/lib/i18n/Context";
import { relativeTime } from "@/lib/i18n/relative-time";

/**
 * Votants d'une liste, du plus récent au plus ancien (la personne connectée
 * en tête). Pour un admin, chaque ligne porte aussi le nom complet et
 * l'email.
 */
function VoterList({ voters, total, empty }) {
  const { t, locale } = useTranslation();
  const f = (key) => t(`template_feedback.${key}`);
  // La liste est montée à chaque ouverture du panneau : l'heure aussi.
  const [now] = useState(() => Date.now());

  if (voters.length === 0) {
    return <p className="py-4 text-sm leading-relaxed text-ink-400">{empty}</p>;
  }

  return (
    <>
      <ul className="divide-y divide-border/60">
        {voters.map((voter, index) => (
          <li
            key={voter.id}
            className="animate-rise flex items-center gap-3 py-3"
            style={{ "--rise-delay": `${Math.min(index, 8) * 40}ms` }}
          >
            <InitialAvatar name={voter.name} className="h-9 w-9 text-sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-ink-100">
                {voter.mine ? f("you") : (voter.fullName ?? voter.name ?? f("anonymous"))}
              </p>
              {voter.email && (
                <p className="truncate text-xs text-ink-400">{voter.email}</p>
              )}
            </div>
            <time
              dateTime={new Date(voter.votedAt).toISOString()}
              className="shrink-0 text-xs text-ink-400"
            >
              {relativeTime(voter.votedAt, now, locale, t)}
            </time>
          </li>
        ))}
      </ul>
      {total > voters.length && (
        <p data-numeric className="pt-3 text-xs text-ink-400">
          {f("and_more").replace("{count}", String(total - voters.length))}
        </p>
      )}
    </>
  );
}

/**
 * Panneau « Qui aime ce modèle » : le vote de la personne, puis la liste
 * des « j'aime », publique. Un admin y voit aussi les « je n'aime pas »,
 * dans un second onglet.
 *
 * @param {object} props.votes   voir getTemplateVotes
 * @param {React.RefObject<HTMLElement>} props.returnFocus  bouton qui a
 *   ouvert le panneau : il reprend le focus à la fermeture
 */
export default function VotersSheet({
  open,
  onOpenChange,
  templateName,
  votes,
  onVote,
  returnFocus,
}) {
  const { t } = useTranslation();
  const f = (key) => t(`template_feedback.${key}`);

  const likers = (
    <VoterList voters={votes.likers} total={votes.likes} empty={f("likers_empty")} />
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        onCloseAutoFocus={(event) => {
          if (!returnFocus.current) return;
          event.preventDefault();
          returnFocus.current.focus();
        }}
      >
        <div
          className="flex shrink-0 items-start gap-3 border-b border-border/60 px-5 pt-5 pb-4"
          style={{ paddingTop: "max(1.25rem, env(safe-area-inset-top, 0px))" }}
        >
          <div className="min-w-0 flex-1">
            <SheetDescription className="truncate text-[10px] tracking-[0.18em] text-gold/80 uppercase">
              {templateName}
            </SheetDescription>
            <SheetTitle className="mt-1 text-2xl">{f("likers_title")}</SheetTitle>
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
            <VoteButtons {...votes} onVote={onVote} />
          </div>
          <p className="mt-3 text-xs leading-relaxed text-ink-400">{f("public_note")}</p>

          <hr className="rule-gold-left mt-5 mb-4 w-16" />

          {votes.isAdmin ? (
            <Tabs defaultValue="likes">
              <TabsList className="w-full">
                <TabsTrigger value="likes">
                  {f("like")} <span data-numeric>{votes.likes}</span>
                </TabsTrigger>
                <TabsTrigger value="dislikes">
                  {f("dislike")} <span data-numeric>{votes.dislikes}</span>
                </TabsTrigger>
              </TabsList>
              <TabsContent value="likes">{likers}</TabsContent>
              <TabsContent value="dislikes">
                <VoterList
                  voters={votes.dislikers}
                  total={votes.dislikes}
                  empty={f("dislikers_empty")}
                />
              </TabsContent>
              <p className="mt-2 text-xs leading-relaxed text-ink-400">{f("admin_note")}</p>
            </Tabs>
          ) : (
            likers
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
