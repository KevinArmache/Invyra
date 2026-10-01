/**
 * Enregistre un design du registre (lib/invitation/designs) comme modèle
 * réutilisable de la galerie : une ligne `templates` dont la config est
 * celle d'un modèle design (voir lib/templates/config.js), au
 * statut « terminé » pour être visible de tous les utilisateurs.
 *
 *   node --env-file=.env prisma/scripts/seed-design-template.mjs origami "Origami" --dry
 *   node --env-file=.env prisma/scripts/seed-design-template.mjs vinyl "Face A" --category=birthday
 *
 * Options :
 *   --dry              affiche ce qui serait fait, sans rien écrire ;
 *   --update           remplace la config du modèle s'il existe déjà ;
 *   --featured         le met en vitrine sur la page d'accueil (publique) ;
 *   --category=<clé>   sa catégorie dans la galerie (voir
 *                      lib/templates/categories.js : wedding, birthday…).
 *
 * Idempotent : sans --update, un modèle réutilisable qui porte déjà ce design
 * est laissé tel quel.
 *
 * La config vient de la définition du design (createDesignConfig), comme
 * quand un admin crée le modèle depuis le tableau de bord : aucun contenu
 * n'est recopié ici. Le code de l'application est chargé par _app.mjs.
 */
import { randomUUID } from "node:crypto";
import pg from "pg";

import { importApp, requireDatabaseUrl } from "./_app.mjs";

const args = process.argv.slice(2);
const flags = new Set(args.filter((arg) => arg.startsWith("--")));
const [designId, name] = args.filter((arg) => !arg.startsWith("--"));
const dryRun = flags.has("--dry");
const categoryArg = args
  .find((arg) => arg.startsWith("--category="))
  ?.slice("--category=".length);

if (!designId || !name) {
  console.error(
    'Usage : node --env-file=.env prisma/scripts/seed-design-template.mjs <designId> "<Nom>" [--dry] [--update] [--featured] [--category=<clé>]',
  );
  process.exit(1);
}
requireDatabaseUrl();

const { createDesignConfig, getDesign, normalizeDesignConfig } = await importApp(
  "lib/invitation/designs/index.js",
);
const { DESIGN_ID_FIELD, DESIGN_TYPE } = await importApp("lib/templates/config.js");
const { TEMPLATE_CATEGORIES, normalizeCategory } = await importApp(
  "lib/templates/categories.js",
);

if (!getDesign(designId)) {
  console.error(`Design inconnu : ${designId}`);
  process.exit(1);
}

// Même validation que saveUserTemplate : une clé inconnue est refusée ici
// plutôt que ramenée silencieusement à « sans catégorie ».
const category = categoryArg === undefined ? null : normalizeCategory(categoryArg);
if (categoryArg !== undefined && !category) {
  console.error(
    `Catégorie inconnue : ${categoryArg} (attendu : ${TEMPLATE_CATEGORIES.join(", ")})`,
  );
  process.exit(1);
}

// Même validation que saveUserTemplate (validateTemplateConfig → normalizeDesignConfig).
const config = normalizeDesignConfig(createDesignConfig(designId));

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });

async function main() {
  await client.connect();

  const { rows: existing } = await client.query(
    `SELECT id, name FROM templates WHERE "eventId" IS NULL AND config->>'type' = $1 AND config->>'${DESIGN_ID_FIELD}' = $2`,
    [DESIGN_TYPE, designId],
  );

  if (existing.length > 0) {
    const [row] = existing;
    if (!flags.has("--update")) {
      console.log(
        `Le modèle « ${row.name} » (${row.id}) utilise déjà le design ${designId}. Rien n'est écrit (--update pour remplacer sa config).`,
      );
      return;
    }
    console.log(`Mise à jour de « ${row.name} » (${row.id})${dryRun ? " : essai à blanc" : ""}.`);
    if (dryRun) return;
    await client.query(
      `UPDATE templates SET config = $1::jsonb, "updatedAt" = NOW()${flags.has("--featured") ? ", featured = true" : ""}${category ? ", category = $3" : ""} WHERE id = $2`,
      category
        ? [JSON.stringify(config), row.id, category]
        : [JSON.stringify(config), row.id],
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
    `Création du modèle « ${name} » (design ${designId}, ${JSON.stringify(config).length} octets de config, catégorie ${category ?? "aucune"}, propriétaire ${ownerId ?? "aucun"}${flags.has("--featured") ? ", en vitrine" : ""})${dryRun ? " : essai à blanc, rien n'est écrit" : ""}.`,
  );
  if (dryRun) return;

  await client.query(
    `INSERT INTO templates (id, "userId", name, status, config, category, featured, "createdAt", "updatedAt")
     VALUES ($1, $2, $3, 'completed'::"TemplateStatus", $4::jsonb, $5, $6, NOW(), NOW())`,
    [id, ownerId, name, JSON.stringify(config), category, flags.has("--featured")],
  );
  console.log(`Modèle créé : ${id}`);
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => client.end());
