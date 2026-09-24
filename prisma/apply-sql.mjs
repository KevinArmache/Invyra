/**
 * Applique un fichier de prisma/migrations-sql à la base, dans une
 * transaction : tout passe, ou rien n'est écrit.
 *
 *   node --env-file=.env prisma/apply-sql.mjs prisma/migrations-sql/002-template-category.sql
 *
 * Les migrations de ce dossier sont écrites pour être rejouables (IF NOT
 * EXISTS…) : relancer un fichier déjà appliqué ne casse rien.
 *
 * SQL brut avec `pg`, comme migrate-passwords.mjs : le client Prisma généré
 * est du TypeScript que Node n'importe pas tel quel.
 */
import { readFileSync } from "node:fs";
import pg from "pg";

const file = process.argv[2];
if (!file) {
  console.error("Usage : node --env-file=.env prisma/apply-sql.mjs <fichier.sql>");
  process.exit(1);
}
if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL est absent de l'environnement.");
  process.exit(1);
}

const sql = readFileSync(file, "utf8");
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });

async function main() {
  await client.connect();
  await client.query("BEGIN");
  try {
    await client.query(sql);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
  console.log(`${file} appliqué.`);
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => client.end());
