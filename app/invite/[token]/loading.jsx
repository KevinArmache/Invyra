/**
 * Écran envoyé immédiatement, pendant que le serveur lit l'invitation (la
 * base peut mettre quelques secondes à se réveiller). Identique à l'attente
 * d'InvitationExperience : l'invité ne voit qu'un seul écran de chargement,
 * jamais une page blanche.
 */
export default function InvitationLoading() {
  return (
    <main
      className="fixed inset-0 flex items-center justify-center bg-[#0a0a0a]"
      aria-busy="true"
    >
      <span className="sr-only">Chargement de votre invitation</span>
      <span
        aria-hidden="true"
        className="block h-px w-16 animate-pulse bg-[#e2b963]/70"
      />
    </main>
  );
}
