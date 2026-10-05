/**
 * Télécharge un fichier généré par une route (PDF…), côté navigateur.
 *
 * Le fichier est récupéré puis enregistré, plutôt qu'ouvert par un simple
 * lien : la page peut montrer la génération en cours et signaler un échec
 * au lieu de télécharger une page d'erreur. Le nom vient de l'en-tête
 * Content-Disposition de la réponse, sinon de `fallbackName`.
 *
 * @throws {Error} si la réponse n'est pas un succès
 */
export async function downloadFile(url, fallbackName) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  const blob = await response.blob();
  const filename =
    /filename="([^"]+)"/.exec(response.headers.get("content-disposition") ?? "")?.[1] ??
    fallbackName;
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Laisse au navigateur le temps de lancer le téléchargement.
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}
