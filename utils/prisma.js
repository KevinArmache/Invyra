import { PrismaClient } from "../prisma/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter: new PrismaPg(
      {
        connectionString: process.env.DATABASE_URL,
        // Neon coupe les connexions inactives (mise en veille de la base) :
        // une connexion gardée trop longtemps dans le pool échoue ensuite avec
        // « Server has closed the connection ». On les ferme nous-mêmes avant.
        idleTimeoutMillis: 10_000,
        keepAlive: true,
      },
      {
        // Une connexion inactive coupée côté serveur émet une erreur sur le
        // pool ; sans ce gestionnaire, elle ferait tomber le processus.
        onPoolError: (error) =>
          console.warn("Pool PostgreSQL :", error.message),
      },
    ),
    log: ["query", "error", "warn"], // optionnel mais utile
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
