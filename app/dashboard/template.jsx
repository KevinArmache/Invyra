/**
 * Enveloppe remontée à chaque navigation (c'est le rôle d'un template, à
 * la différence du layout) : chaque page de l'espace connecté arrive en
 * fondu, avec un léger glissement.
 */
export default function DashboardTemplate({ children }) {
  return <div className="animate-page-in">{children}</div>;
}
