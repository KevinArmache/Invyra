import { betterAuth } from "better-auth";
import { createAuthMiddleware } from "better-auth/api";
import { prismaAdapter } from "@better-auth/prisma-adapter";
import { nextCookies } from "better-auth/next-js";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";

/**
 * Invyra utilise bcrypt depuis ses débuts. better-auth hache en scrypt par
 * défaut : on surcharge le hasher pour que les mots de passe déjà en base
 * restent vérifiables et qu'aucun compte existant ne soit invalidé.
 */
const passwordHasher = {
  hash: (password) => bcrypt.hash(password, 12),
  verify: ({ hash, password }) => bcrypt.compare(password, hash),
};

/**
 * Migration à la volée des mots de passe hérités.
 *
 * Les comptes antérieurs à better-auth ont leur hash bcrypt dans
 * `users.password` ; better-auth le cherche dans `accounts`. On déplace le
 * hash juste avant la vérification, à la première connexion.
 *
 * Ce contrôle vit dans un hook de better-auth et non dans la server action
 * `login()` : placé côté appelant, il ne couvrait que le formulaire de
 * connexion, et un appel direct à `/api/auth/sign-in/email` — ce que fait le
 * client better-auth — échouait pour un compte non encore migré.
 *
 * `prisma/migrate-passwords.mjs` fait la même chose en lot. Une fois tous les
 * comptes passés, ce hook et la colonne `legacyPassword` peuvent disparaître.
 */
const migrateLegacyPassword = createAuthMiddleware(async (ctx) => {
  if (ctx.path !== "/sign-in/email") return;

  const email = ctx.body?.email?.toLowerCase();
  if (!email) return;

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, legacyPassword: true },
  });
  if (!user?.legacyPassword) return;

  const existing = await prisma.account.findFirst({
    where: { userId: user.id, providerId: "credential" },
    select: { id: true },
  });
  if (existing) return;

  await prisma.account.create({
    data: {
      userId: user.id,
      accountId: user.id,
      providerId: "credential",
      password: user.legacyPassword,
    },
  });
});

export const auth = betterAuth({
  appName: "Invyra",
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.NEXT_PUBLIC_APP_URL,

  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    autoSignIn: true,
    password: passwordHasher,
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 jours, comme l'ancien JWT
    updateAge: 60 * 60 * 24, // prolonge la session au plus une fois par jour
    // getSession() est appelé par presque toutes les server actions ; sans ce
    // cache chacune ferait un aller-retour en base.
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },

  /**
   * Champs métier portés par `users`. `input: false` empêche un client de se
   * promouvoir admin ou de changer de plan via le endpoint d'inscription.
   */
  user: {
    additionalFields: {
      role: { type: "string", defaultValue: "user", input: false },
      plan: { type: "string", defaultValue: "free", input: false },
      suspended: { type: "boolean", defaultValue: false, input: false },
      company: { type: "string", required: false, input: true },
      phone: { type: "string", required: false, input: true },
    },
  },

  hooks: {
    before: migrateLegacyPassword,
  },

  advanced: {
    database: {
      generateId: false, // on laisse Prisma poser ses cuid()
    },
  },

  // Doit rester le dernier plugin : il rejoue les cookies posés pendant
  // une server action.
  plugins: [nextCookies()],
});
