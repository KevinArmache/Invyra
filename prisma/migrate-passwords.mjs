/**
 * Déplace les hashs bcrypt de `users.password` vers un Account « credential »,
 * la forme attendue par better-auth.
 *
 *   node --env-file=.env prisma/migrate-passwords.mjs --dry   # compte seulement
 *   node --env-file=.env prisma/migrate-passwords.mjs         # applique
 *
 * `--env-file` est la lecture de .env intégrée à Node : le projet n'a pas
 * `dotenv` dans ses dépendances installables depuis un script autonome.
 *
 * Idempotent : un utilisateur qui a déjà son Account est ignoré.
 *
 * Le script parle à la base en SQL plutôt que via Prisma : le générateur
 * `prisma-client` émet du TypeScript destiné au bundler de l'application, que
 * Node ne sait pas importer tel quel. `pg` est déjà une dépendance du projet.
 *
 * La connexion à la volée (app/actions/auth.js, ensureCredentialAccount) fait
 * la même chose compte par compte ; ce script sert à tout basculer d'un coup
 * pour pouvoir ensuite supprimer la colonne héritée.
 */
import { randomUUID } from "node:crypto";
import pg from "pg";

const dryRun = process.argv.includes("--dry");

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL est absent de l'environnement.");
  process.exit(1);
}

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });

// Les comptes à migrer : un mot de passe hérité, et aucun Account credential.
const PENDING = `
  SELECT u.id, u.email, u.password
  FROM users u
  WHERE u.password IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM accounts a
      WHERE a."userId" = u.id AND a."providerId" = 'credential'
    )
`;

async function main() {
  await client.connect();

  const { rows } = await client.query(PENDING);

  if (rows.length === 0) {
    console.log("Aucun mot de passe hérité à migrer.");
    return;
  }

  console.log(
    `${rows.length} compte(s) à migrer${dryRun ? " (essai à blanc, rien n'est écrit)" : ""}.`,
  );

  if (dryRun) {
    for (const row of rows) console.log(`  → ${row.email}`);
    return;
  }

  // Tout ou rien : un échec en cours de route ne doit pas laisser la moitié
  // des comptes dans un état intermédiaire.
  await client.query("BEGIN");
  try {
    for (const row of rows) {
      await client.query(
        `INSERT INTO accounts (id, "accountId", "providerId", "userId", password, "createdAt", "updatedAt")
         VALUES ($1, $2, 'credential', $2, $3, NOW(), NOW())`,
        [randomUUID(), row.id, row.password],
      );
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }

  console.log(`${rows.length} compte(s) migré(s).`);
  console.log(
    "\nVérifiez qu'une connexion fonctionne, puis retirez `legacyPassword`\n" +
      "du schéma et lancez une migration pour supprimer la colonne.",
  );
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => client.end());
