import { PrismaClient } from "../prisma/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
    log: ["query", "error", "warn"], // optionnel mais utile
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
