"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth/server";

/**
 * La session est portée par better-auth, mais tout le reste du code attend la
 * forme historique `{ userId, email, name, role, plan }`. On garde ce contrat
 * pour que les actions métier n'aient pas à changer.
 */
function toLegacySession(session) {
  if (!session?.user) return null;
  const { user } = session;
  return {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role ?? "user",
    plan: user.plan ?? "free",
  };
}

export async function getSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;
  // Un compte suspendu garde un cookie valide : on le traite comme déconnecté.
  if (session.user.suspended) return null;
  return toLegacySession(session);
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export async function login(email, password) {
  if (!email || !password) throw new Error("Email et mot de passe requis");

  const normalized = email.toLowerCase();

  const existing = await prisma.user.findUnique({
    where: { email: normalized },
    select: { suspended: true },
  });
  if (existing?.suspended) {
    throw new Error("Ce compte a été suspendu. Contactez le support.");
  }

  try {
    const result = await auth.api.signInEmail({
      body: { email: normalized, password },
      headers: await headers(),
    });

    return {
      id: result.user.id,
      email: result.user.email,
      name: result.user.name,
      role: result.user.role ?? "user",
      plan: result.user.plan ?? "free",
    };
  } catch {
    // On ne distingue jamais « email inconnu » de « mot de passe faux ».
    throw new Error("Email ou mot de passe invalide");
  }
}

export async function register(name, email, password, company, phone) {
  if (!email || !password || !name)
    throw new Error("Nom, email et mot de passe requis");
  if (password.length < 8)
    throw new Error("Le mot de passe doit contenir au moins 8 caractères");

  const normalized = email.toLowerCase();

  const existing = await prisma.user.findUnique({
    where: { email: normalized },
    select: { id: true },
  });
  if (existing) throw new Error("Un compte avec cet email existe déjà");

  try {
    const result = await auth.api.signUpEmail({
      body: {
        email: normalized,
        password,
        name,
        company: company || undefined,
        phone: phone || undefined,
      },
      headers: await headers(),
    });

    return {
      id: result.user.id,
      email: result.user.email,
      name: result.user.name,
      role: result.user.role ?? "user",
      plan: result.user.plan ?? "free",
    };
  } catch (error) {
    if (error?.body?.message) throw new Error(error.body.message);
    throw new Error("Impossible de créer le compte");
  }
}

export async function logout() {
  await auth.api.signOut({ headers: await headers() });
  redirect("/login");
}

export async function getCurrentUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;

  return prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      company: true,
      phone: true,
      role: true,
      plan: true,
      suspended: true,
      createdAt: true,
    },
  });
}

// ─── Garde-fous ──────────────────────────────────────────────────────────────

export async function requireAuth() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

export async function requireAdmin() {
  const session = await getSession();
  if (!session) redirect("/login");
  // Le rôle du cookie peut être périmé : on retranche sur la base.
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { role: true, suspended: true },
  });
  if (!user || user.role !== "admin" || user.suspended) redirect("/dashboard");
  return session;
}

export async function canAccessEvent(eventId) {
  const session = await getSession();
  if (!session) return false;
  if (session.role === "admin") return true;

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { userId: true },
  });
  if (!event) return false;
  if (event.userId === session.userId) return true;

  const collab = await prisma.eventCollaborator.findFirst({
    where: { eventId, userId: session.userId, accepted: true },
    select: { id: true },
  });
  return !!collab;
}

export async function isEventOwnerOrAdmin(eventId) {
  const session = await getSession();
  if (!session) return false;
  if (session.role === "admin") return true;

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { userId: true },
  });
  return event?.userId === session.userId;
}

// ─── Profil ──────────────────────────────────────────────────────────────────

export async function updateProfile(name, company, phone) {
  const session = await getSession();
  if (!session) throw new Error("Non authentifié");

  return prisma.user.update({
    where: { id: session.userId },
    data: {
      name: name !== undefined ? name : undefined,
      company: company !== undefined ? company : undefined,
      phone: phone !== undefined ? phone : undefined,
    },
    select: { id: true, email: true, name: true, company: true, phone: true },
  });
}

export async function changePassword(currentPassword, newPassword) {
  const session = await getSession();
  if (!session) throw new Error("Non authentifié");

  if (!newPassword || newPassword.length < 8)
    throw new Error(
      "Le nouveau mot de passe doit contenir au moins 8 caractères",
    );

  try {
    await auth.api.changePassword({
      body: {
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      },
      headers: await headers(),
    });
  } catch (error) {
    if (error?.body?.message) throw new Error("Mot de passe actuel incorrect");
    throw new Error("Impossible de changer le mot de passe");
  }

  // Le hash hérité ne doit plus servir de porte dérobée.
  await prisma.user.update({
    where: { id: session.userId },
    data: { legacyPassword: null },
  });

  return { success: true };
}

// ─── Suppression de compte ───────────────────────────────────────────────────

export async function deleteMyAccount() {
  const session = await getSession();
  if (!session) throw new Error("Non authentifié");

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, role: true },
  });
  if (!user) throw new Error("Utilisateur introuvable");
  if (user.role === "admin") {
    throw new Error(
      "Un compte administrateur ne peut pas être supprimé depuis les paramètres.",
    );
  }

  // Les modèles partagés survivent à leur auteur : on les réassigne à un admin
  // avant la suppression en cascade.
  let admin = await prisma.user.findFirst({
    where: { role: "admin", id: { not: user.id } },
    select: { id: true },
  });

  if (!admin) {
    admin = await prisma.user.create({
      data: {
        email: `ghost_${Date.now()}@invyra.local`,
        name: "Invyra System",
        role: "admin",
        emailVerified: true,
      },
      select: { id: true },
    });
    // Compte technique sans identifiants : aucun Account n'est créé, il est
    // donc impossible de s'y connecter.
  }

  await prisma.template.updateMany({
    where: { userId: user.id },
    data: { userId: admin.id },
  });

  await auth.api.signOut({ headers: await headers() });
  await prisma.user.delete({ where: { id: user.id } });

  return { success: true };
}
