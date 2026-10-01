/**
 * Supprime un design devenu inutile : son dossier
 * (lib/invitation/designs/<id>), son entrée dans le registre et ses
 * traductions.
 *
 *   node --env-file=.env prisma/scripts/remove-design.mjs <designId> --dry
 *   node --env-file=.env prisma/scripts/remove-design.mjs <designId>
 *
 * Un design est du code, livré avec le site : supprimer un modèle dans
 * l'application ne peut pas effacer ce code (le site déployé est en lecture
 * seule), et ne doit pas le faire tant qu'une invitation s'en sert. Ce script
 * fait le lien : il refuse tant qu'un modèle de la galerie, la copie de modèle
 * d'un événement ou l'ancien champ `events.invitationTemplate` utilise le
 * design ; sinon, il supprime tout ce qui le concerne. Il reste ensuite à
 * vérifier (pnpm build), commiter et déployer.
 *
 * Les polices ajoutées pour ce design restent dans la liste commune : un autre
 * design ou un modèle code peut les utiliser.
 */
import { existsSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import pg from "pg";

import { ROOT, importApp, requireDatabaseUrl } from "./_app.mjs";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry");
const [designId] = args.filter((arg) => !arg.startsWith("--"));

if (!designId) {
  console.error("Usage : node --env-file=.env prisma/scripts/remove-design.mjs <designId> [--dry]");
  process.exit(1);
}
requireDatabaseUrl();

const { DESIGNS, getDesign } = await importApp("lib/invitation/designs/index.js");
const { CONTENT_SECTIONS } = await importApp("lib/invitation/content.js");
const { DESIGN_ID_FIELD, DESIGN_TYPE } = await importApp("lib/templates/config.js");

const DESIGNS_DIR = path.join(ROOT, "lib/invitation/designs");
const REGISTRY = path.join(DESIGNS_DIR, "index.js");
const LOCALES = ["fr", "en"].map((locale) => path.join(ROOT, "locales", `${locale}.json`));

const design = getDesign(designId);
const folder = path.join(DESIGNS_DIR, designId);
if (!design || !existsSync(folder) || designId.startsWith("_")) {
  console.error(`Design inconnu : ${designId}`);
  process.exit(1);
}

// ── 1. Personne ne doit encore s'en servir ──────────────────────────────────

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
let users;
try {
  const templates = await client.query(
    `SELECT t.id, t.name, e.title AS "eventTitle"
       FROM templates t LEFT JOIN events e ON e.id = t."eventId"
      WHERE t.config->>'type' = $1 AND t.config->>'${DESIGN_ID_FIELD}' = $2
      ORDER BY t."eventId" NULLS FIRST, t.name`,
    [DESIGN_TYPE, designId],
  );
  const legacy = await client.query(
    `SELECT id, title FROM events
      WHERE "invitationTemplate"->>'type' = $1 AND "invitationTemplate"->>'${DESIGN_ID_FIELD}' = $2`,
    [DESIGN_TYPE, designId],
  );
  users = [
    ...templates.rows.map((row) =>
      row.eventTitle
        ? `invitation de l'événement « ${row.eventTitle} »`
        : `modèle de la galerie « ${row.name} » (${row.id})`,
    ),
    ...legacy.rows.map((row) => `ancienne invitation de l'événement « ${row.title} »`),
  ];
} finally {
  await client.end();
}

if (users.length > 0) {
  console.error(`Le design « ${design.name} » est encore utilisé, son dossier est conservé :`);
  for (const user of users) console.error(`  - ${user}`);
  console.error(
    "Supprimez ces modèles dans l'application, ou donnez un autre modèle à ces événements, puis relancez.",
  );
  process.exit(1);
}

// Aucun autre fichier ne doit dépendre du dossier (un design n'importe jamais
// un autre design ; on le vérifie quand même avant de supprimer).
function sourceFiles(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    if (["node_modules", ".next", ".git", "generated"].includes(entry)) continue;
    const file = path.join(dir, entry);
    if (statSync(file).isDirectory()) sourceFiles(file, out);
    else if (/\.(jsx?|mjs)$/.test(entry)) out.push(file);
  }
  return out;
}
const importPrefix = `@/lib/invitation/designs/${designId}`;
const dependents = ["app", "components", "lib"]
  .flatMap((dir) => sourceFiles(path.join(ROOT, dir)))
  .filter((file) => !file.startsWith(folder + path.sep) && file !== REGISTRY)
  .filter((file) => readFileSync(file, "utf8").includes(importPrefix));
if (dependents.length > 0) {
  console.error(`Ces fichiers importent encore le design « ${design.name} » :`);
  for (const file of dependents) console.error(`  - ${path.relative(ROOT, file)}`);
  process.exit(1);
}

// ── 2. Ce qui sera supprimé ─────────────────────────────────────────────────

// Réglages propres à ce design : leurs libellés disparaissent avec lui, sauf
// s'ils servent à un autre design ou au contenu commun.
const sharedKeys = new Set([
  ...DESIGNS.filter((other) => other.id !== designId).flatMap((other) => other.styleSchema.map((field) => field.key)),
  ...CONTENT_SECTIONS.flatMap((section) => section.fields.map((field) => field.key)),
]);
const ownKeys = design.styleSchema.map((field) => field.key).filter((key) => !sharedKeys.has(key));
const translationKeys = [
  `portal.editor.catalog.${designId}`,
  ...ownKeys.map((key) => `portal.editor.style.${key}`),
  ...ownKeys.map((key) => `portal.editor.options.${key}`),
];

const registry = readFileSync(REGISTRY, "utf8");
const importLine = new RegExp(`^import (\\w+) from "${importPrefix}";\\r?\\n`, "m");
const importMatch = importLine.exec(registry);
if (!importMatch) {
  console.error(`Import du design introuvable dans ${path.relative(ROOT, REGISTRY)}.`);
  process.exit(1);
}
const variable = importMatch[1];

console.log(`Suppression du design « ${design.name} » (${designId})${dryRun ? " : essai à blanc, rien n'est modifié" : ""}.`);
console.log(`  - dossier ${path.relative(ROOT, folder)}`);
console.log(`  - entrée « ${variable} » du registre (${path.relative(ROOT, REGISTRY)})`);
console.log(`  - traductions : ${translationKeys.join(", ")}`);
if (dryRun) process.exit(0);

// ── 3. Suppression ──────────────────────────────────────────────────────────

const arrayPattern = /export const DESIGNS = \[([\s\S]*?)\];/;
const arrayMatch = arrayPattern.exec(registry);
const entries = arrayMatch[1].split(",").map((entry) => entry.trim()).filter(Boolean);
if (!entries.includes(variable)) {
  console.error(`« ${variable} » est absent de DESIGNS : registre à corriger à la main.`);
  process.exit(1);
}
const remaining = entries.filter((entry) => entry !== variable);
const nextRegistry = registry
  .replace(importLine, "")
  .replace(arrayPattern, `export const DESIGNS = [\n${remaining.map((entry) => `  ${entry},\n`).join("")}];`);
writeFileSync(REGISTRY, nextRegistry);

function removeKey(dictionary, key) {
  const parts = key.split(".");
  const parent = parts.slice(0, -1).reduce((node, part) => node?.[part], dictionary);
  if (parent && Object.hasOwn(parent, parts.at(-1))) delete parent[parts.at(-1)];
}
for (const file of LOCALES) {
  const dictionary = JSON.parse(readFileSync(file, "utf8"));
  for (const key of translationKeys) removeKey(dictionary, key);
  writeFileSync(file, `${JSON.stringify(dictionary, null, 2)}\n`);
}

rmSync(folder, { recursive: true, force: true });

console.log("Design supprimé. Vérifiez avec « pnpm build », puis commitez et déployez.");
