import { AlertCircle } from "lucide-react";

/**
 * `role="alert"` fait annoncer le message par les lecteurs d'écran dès son
 * apparition : sans lui, un échec de connexion passe inaperçu pour qui ne voit
 * pas l'écran.
 */
export default function FormError({ message }) {
  if (!message) return null;

  return (
    <div
      role="alert"
      className="flex items-start gap-2.5 rounded-md border border-destructive/30 bg-destructive/10 px-3.5 py-3 text-sm text-destructive"
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <span className="leading-relaxed">{message}</span>
    </div>
  );
}
