import "dotenv/config";
import { defineConfig, env } from "prisma/config";

/**
 * `env("DATABASE_URL")` lève si la variable est absente, ce qui faisait
 * échouer `prisma generate` — donc le `postinstall`, donc `pnpm install` et
 * `pnpm lint` — sur une machine sans `.env`. Or `generate` ne se connecte à
 * rien : il n'a besoin que du schéma.
 *
 * On ne déclare donc la source de données que lorsqu'elle est renseignée. Les
 * commandes qui en ont réellement besoin (`db push`, `migrate`) échouent
 * toujours, mais avec un message qui pointe la bonne cause.
 */
export default defineConfig({
  schema: "prisma/schema.prisma",
  ...(process.env.DATABASE_URL
    ? { datasource: { url: env("DATABASE_URL") } }
    : {}),
});
