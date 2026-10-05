/**
 * Nom de fichier sans accents ni caractères spéciaux. `fallback` sert quand
 * il ne reste rien (un titre écrit tout en emojis, par exemple).
 */
export function slugify(text, fallback = "event") {
  return (
    String(text ?? "")
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || fallback
  );
}
