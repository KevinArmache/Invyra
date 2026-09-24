import { PrismaClient } from "../prisma/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis;

/**
 * Lectures relancées en cas d'erreur de connexion passagère. Une lecture
 * peut être rejouée sans risque ; une écriture non (une création rejouée
 * créerait un doublon), elle échoue donc normalement.
 */
const READ_OPERATIONS = new Set([
  "findUnique",
  "findUniqueOrThrow",
  "findFirst",
  "findFirstOrThrow",
  "findMany",
  "count",
  "aggregate",
  "groupBy",
]);

/** Attente avant chaque nouvel essai (ms). */
const RETRY_DELAYS = [300, 900];

/**
 * Erreurs de connexion typiques de Neon : base mise en veille qui se
 * réveille, connexion inactive coupée côté serveur, délai dépassé. Ce ne
 * sont pas des erreurs de requête : un nouvel essai a toutes les chances de
 * passer.
 */
const TRANSIENT_CODES = new Set(["P1001", "P1002", "P1008", "P1017", "P2024"]);
const TRANSIENT_MESSAGE =
  /connection (terminated|closed|reset|refused|timeout)|server has closed the connection|terminating connection|can't reach database|ECONNRESET|ETIMEDOUT|EPIPE|ECONNREFUSED|socket hang up|timed? ?out/i;

function isTransient(error) {
  if (!error) return false;
  if (TRANSIENT_CODES.has(error.code)) return true;
  return TRANSIENT_MESSAGE.test(
    `${error.message ?? ""} ${error.cause?.message ?? ""}`,
  );
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function createPrismaClient() {
  const client = new PrismaClient({
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
    // Le journal de chaque requête n'est utile qu'en développement : en
    // production, il alourdit les logs de chaque fonction.
    log:
      process.env.NODE_ENV === "production"
        ? ["error", "warn"]
        : ["query", "error", "warn"],
  });

  return client.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          if (!READ_OPERATIONS.has(operation)) return query(args);
          for (let attempt = 0; ; attempt++) {
            try {
              return await query(args);
            } catch (error) {
              if (attempt >= RETRY_DELAYS.length || !isTransient(error)) {
                throw error;
              }
              console.warn(
                `Prisma ${model}.${operation} : connexion interrompue, nouvel essai (${attempt + 1}/${RETRY_DELAYS.length}).`,
              );
              await sleep(RETRY_DELAYS[attempt]);
            }
          }
        },
      },
    },
  });
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
