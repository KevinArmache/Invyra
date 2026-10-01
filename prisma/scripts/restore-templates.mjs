/**
 * Remet les modèles dans l'état d'une sauvegarde (prisma/backups/), écrite
 * avant le passage de tous les modèles au format code.
 *
 *   node --env-file=.env prisma/scripts/restore-templates.mjs prisma/backups/<fichier>.json --dry
 *   node --env-file=.env prisma/scripts/restore-templates.mjs prisma/backups/<fichier>.json
 *
 * Chaque modèle sauvegardé retrouve sa config d'origine, en une transaction.
 * Ne dépend que de `pg` et du fichier de sauvegarde.
 *
 * Attention : un modèle design restauré ne s'affiche qu'avec une version du
 * site qui contient encore le code de son design (lib/invitation/designs).
 */
import { readFileSync } from "node:fs";
import pg from "pg";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry");
const [file] = args.filter((arg) => !arg.startsWith("--"));

if (!file) {
  console.error("Usage : node --env-file=.env prisma/scripts/restore-templates.mjs <sauvegarde.json> [--dry]");
  process.exit(1);
}
if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL est absent de l'environnement.");
  process.exit(1);
}

const { createdAt, templates } = JSON.parse(readFileSync(file, "utf8"));
console.log(`Sauvegarde du ${createdAt} : ${templates.length} modèle(s).`);

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
try {
  await client.query("BEGIN");
  for (const template of templates) {
    const { rowCount } = await client.query(
      `UPDATE templates SET config = $2::jsonb, "updatedAt" = NOW() WHERE id = $1`,
      [template.id, JSON.stringify(template.config)],
    );
    console.log(`${rowCount ? "restauré" : "absent de la base, ignoré"} : « ${template.name} »`);
  }
  await client.query(dryRun ? "ROLLBACK" : "COMMIT");
  console.log(dryRun ? "Essai à blanc : annulé, rien n'est écrit." : "Restauration terminée.");
} catch (error) {
  await client.query("ROLLBACK");
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
