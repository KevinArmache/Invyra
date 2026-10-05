"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Bouton d'envoi d'un formulaire à server action (`<form action={…}>`) : il
 * se désactive et affiche un indicateur le temps de la requête. La page
 * autour reste un Server Component.
 *
 * @param {React.ReactNode} [props.icon]  icône déjà rendue (`<BellOff />`) :
 *   un composant, donc une fonction, ne passe pas d'un Server Component à
 *   un composant client
 */
export default function SubmitButton({ icon, children, ...props }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} {...props}>
      {pending ? <Loader2 className="animate-spin" /> : icon}
      {children}
    </Button>
  );
}
