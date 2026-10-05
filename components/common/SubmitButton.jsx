"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Bouton d'envoi d'un formulaire à server action (`<form action={…}>`) : il
 * se désactive et affiche un indicateur le temps de la requête. La page
 * autour reste un Server Component.
 */
export default function SubmitButton({ icon: Icon, children, ...props }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} {...props}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : Icon && <Icon className="h-4 w-4" />}
      {children}
    </Button>
  );
}
