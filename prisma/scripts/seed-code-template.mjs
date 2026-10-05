/**
 * Enregistre un modèle écrit en code (dossier de prisma/templates/) comme
 * modèle réutilisable de la galerie : une ligne `templates` au format code
 * (voir lib/templates/config.js).
 *
 *   node --env-file=.env prisma/scripts/seed-code-template.mjs prisma/templates/petit-nuage --dry
 *   node --env-file=.env prisma/scripts/seed-code-template.mjs prisma/templates/petit-nuage
 *
 * Le dossier contient :
 *   template.json   nom, catégorie, polices et réglages d'ouverture ;
 *   index.html, style.css, script.js          l'invitation ;
 *   opening.html, opening.css, opening.js     son ouverture (facultative).
 *
 * Options :
 *   --dry        affiche ce qui serait fait, sans rien écrire ;
 *   --publish    statut « terminé » : visible de tous les utilisateurs.
 *                Sans lui, le modèle est un brouillon que seuls les admins
 *                voient, à relire avant de le publier depuis le tableau de bord ;
 *   --featured   le met en vitrine sur la page d'accueil (publique) ;
 *   --update     remplace la config du modèle de même nom s'il existe déjà.
 *
 * Idempotent : sans --update, un modèle de la galerie qui porte déjà ce nom
 * est laissé tel quel.
 *
 * SQL brut avec `pg`, comme les autres scripts de ce dossier : le client
 * Prisma généré est du TypeScript que Node n'importe pas tel quel.
 */
import { randomUUID } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import pg from "pg";

import { normalizeCategory, TEMPLATE_CATEGORIES } from "../../lib/templates/categories.js";
import { normalizeFonts } from "../../lib/invitation/fonts.js";

/** Même limite que MAX_CODE_LENGTH (lib/templates/config.js). */
const MAX_CODE_LENGTH = 200_000;

const args = process.argv.slice(2);
const flags = new Set(args.filter((arg) => arg.startsWith("--")));
const [dir] = args.filter((arg) => !arg.startsWith("--"));
const dryRun = flags.has("--dry");

if (!dir) {
  console.error(
    "Usage : node --env-file=.env prisma/scripts/seed-code-template.mjs <dossier> [--dry] [--publish] [--featured] [--update]",
  );
  process.exit(1);
}
if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL est absent de l'environnement.");
  process.exit(1);
}

function read(file) {
  const full = path.join(dir, file);
  return existsSync(full) ? readFileSync(full, "utf8") : "";
}

const meta = JSON.parse(read("template.json") || "{}");
if (!meta.name) {
  console.error(`template.json manquant ou sans « name » dans ${dir}`);
  process.exit(1);
}

// Une clé inconnue est refusée ici plutôt que ramenée silencieusement à
// « sans catégorie ».
const category = meta.category ? normalizeCategory(meta.category) : null;
if (meta.category && !category) {
  console.error(
    `Catégorie inconnue : ${meta.category} (attendu : ${TEMPLATE_CATEGORIES.join(", ")})`,
  );
  process.exit(1);
}

const fonts = normalizeFonts(meta.fonts);
const unknownFonts = (meta.fonts ?? []).filter((id) => !fonts.includes(id));
if (unknownFonts.length > 0) {
  console.error(`Polices inconnues (voir lib/invitation/fonts.js) : ${unknownFonts.join(", ")}`);
  process.exit(1);
}

const openingCode = {
  html: read("opening.html"),
  css: read("opening.css"),
  js: read("opening.js"),
};
const config = {
  type: "code",
  html: read("index.html"),
  css: read("style.css"),
  js: read("script.js"),
  opening: meta.opening ?? {},
  // Sans HTML, pas d'ouverture en code : l'ouverture standard s'applique.
  openingCode: openingCode.html.trim() ? openingCode : null,
  fonts,
  music: null,
};

if (!config.html.trim()) {
  console.error(`index.html est vide ou absent dans ${dir}`);
  process.exit(1);
}
for (const [label, source] of [
  ["index.html", config.html],
  ["style.css", config.css],
  ["script.js", config.js],
  ["opening.html", openingCode.html],
  ["opening.css", openingCode.css],
  ["opening.js", openingCode.js],
]) {
  if (source.length > MAX_CODE_LENGTH) {
    console.error(`${label} dépasse ${MAX_CODE_LENGTH} caractères.`);
    process.exit(1);
  }
}
if (config.openingCode && !/\sdata-opening[\s>]/.test(config.openingCode.html)) {
  console.error("opening.html doit contenir un élément [data-opening].");
  process.exit(1);
}

const status = flags.has("--publish") ? "completed" : "draft";
const featured = flags.has("--featured");
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });

async function main() {
  await client.connect();

  const { rows: existing } = await client.query(
    `SELECT id, name FROM templates WHERE "eventId" IS NULL AND name = $1`,
    [meta.name],
  );

  if (existing.length > 0) {
    const [row] = existing;
    if (!flags.has("--update")) {
      console.log(
        `Le modèle « ${row.name} » (${row.id}) existe déjà. Rien n'est écrit (--update pour remplacer sa config).`,
      );
      return;
    }
    console.log(`Mise à jour de « ${row.name} » (${row.id})${dryRun ? " : essai à blanc, rien n'est écrit" : ""}.`);
    if (dryRun) return;
    await client.query(
      `UPDATE templates
       SET config = $2::jsonb, category = $3, "updatedAt" = NOW()
           ${flags.has("--publish") ? `, status = 'completed'::"TemplateStatus"` : ""}
           ${featured ? ", featured = true" : ""}
       WHERE id = $1`,
      [row.id, JSON.stringify(config), category],
    );
    console.log("Config mise à jour.");
    return;
  }

  // Propriétaire : le premier administrateur, comme pour les autres modèles
  // de la galerie. userId reste nullable : le modèle survit à son auteur.
  const { rows: admins } = await client.query(
    `SELECT id FROM users WHERE role = 'admin' ORDER BY "createdAt" ASC LIMIT 1`,
  );
  const ownerId = admins[0]?.id ?? null;
  const id = randomUUID();

  console.log(
    `Création du modèle « ${meta.name} » (${JSON.stringify(config).length} octets de config, catégorie ${category ?? "aucune"}, statut ${status}${featured ? ", en vitrine" : ""}, ${ownerId ? "propriétaire : premier admin" : "sans propriétaire"})${dryRun ? " : essai à blanc, rien n'est écrit" : ""}.`,
  );
  if (dryRun) return;

  await client.query(
    `INSERT INTO templates (id, "userId", name, status, config, category, featured, "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4::"TemplateStatus", $5::jsonb, $6, $7, NOW(), NOW())`,
    [id, ownerId, meta.name, status, JSON.stringify(config), category, featured],
  );
  console.log(`Modèle créé : ${id}`);
}

try {
  await main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
