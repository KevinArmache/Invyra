"use server";

import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "@/utils/prisma";
import { redirect } from "next/navigation";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "invyra-secret-key-change-in-production",
);

export async function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password, hashedPassword) {
  return bcrypt.compare(password, hashedPassword);
}

export async function createToken(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload;
  } catch {
    return null;
  }
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;

  if (!token) return null;

  const payload = await verifyToken(token);
  return payload;
}

export async function setSession(userId, email, name, role) {
  const token = await createToken({ userId, email, name, role });
  const cookieStore = await cookies();

  cookieStore.set("auth-token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });

  return token;
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete("auth-token");
}

// ─── Auth Actions ─────────────────────────────────────────────────────────────

export async function login(email, password) {
  if (!email || !password) throw new Error("Email et mot de passe requis");

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!user) throw new Error("Email ou mot de passe invalide");
  if (user.suspended)
    throw new Error("Ce compte a été suspendu. Contactez le support.");

  const isValid = await verifyPassword(password, user.password);
  if (!isValid) throw new Error("Email ou mot de passe invalide");

  await setSession(user.id, user.email, user.name, user.role);

  return { id: user.id, email: user.email, name: user.name, role: user.role };
}

export async function register(name, email, password, company, phone) {
  if (!email || !password || !name)
    throw new Error("Nom, email et mot de passe requis");
  if (password.length < 8)
    throw new Error("Le mot de passe doit contenir au moins 8 caractères");

  const existing = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });
  if (existing) throw new Error("Un compte avec cet email existe déjà");

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      password: passwordHash,
      name,
      company: company || null,
      phone: phone || null,
      role: "user",
    },
  });

  await setSession(user.id, user.email, user.name, user.role);
  return { id: user.id, email: user.email, name: user.name, role: user.role };
}

export async function logout() {
  await clearSession();
  redirect("/login");
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      email: true,
      name: true,
      company: true,
      phone: true,
      role: true,
      suspended: true,
      createdAt: true,
    },
  });

  return user || null;
}

// ─── Permission Guards ─────────────────────────────────────────────────────

export async function requireAuth() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

export async function requireAdmin() {
  const session = await getSession();
  if (!session) redirect("/login");
  // Vérifier le rôle dans la DB (source de vérité fiable)
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

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { role: true },
  });
  if (!user) return false;
  if (user.role === "admin") return true;

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { userId: true },
  });
  if (!event) return false;
  if (event.userId === session.userId) return true;

  const collab = await prisma.eventCollaborator.findFirst({
    where: { eventId, userId: session.userId, accepted: true },
  });
  return !!collab;
}

export async function isEventOwnerOrAdmin(eventId) {
  const session = await getSession();
  if (!session) return false;
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { role: true },
  });
  if (!user) return false;
  if (user.role === "admin") return true;
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { userId: true },
  });
  return event?.userId === session.userId;
}

export async function updateProfile(name, company, phone) {
  const session = await getSession();
  if (!session) throw new Error("Non authentifié");

  const user = await prisma.user.update({
    where: { id: session.userId },
    data: {
      name: name !== undefined ? name : undefined,
      company: company !== undefined ? company : undefined,
      phone: phone !== undefined ? phone : undefined,
    },
    select: { id: true, email: true, name: true, company: true, phone: true },
  });

  return user;
}

export async function changePassword(currentPassword, newPassword) {
  const session = await getSession();
  if (!session) throw new Error("Non authentifié");

  if (!newPassword || newPassword.length < 8)
    throw new Error(
      "Le nouveau mot de passe doit contenir au moins 8 caractères",
    );

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) throw new Error("Utilisateur introuvable");

  const isValid = await verifyPassword(currentPassword, user.password);
  if (!isValid) throw new Error("Mot de passe actuel incorrect");

  const hash = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: session.userId },
    data: { password: hash },
  });

  return { success: true };
}

// ─── Suppression de compte ────────────────────────────────────────────────────────────

export async function deleteMyAccount() {
  const session = await getSession();
  if (!session) throw new Error("Non authentifié");

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) throw new Error("Utilisateur introuvable");

  // 1. Trouver un administrateur pour lui réassigner les templates créés par l'utilisateur
  // Cela empêchera la suppression en cascade des templates (bibliothèque communautaire)
  let admin = await prisma.user.findFirst({
    where: { role: "admin", id: { not: user.id } },
  });

  // S'il n'y a aucun admin, créer un compte Ghost (système)
  if (!admin) {
    const passwordHash = await hashPassword("GhostInvyra!2026");
    admin = await prisma.user.create({
      data: {
        email: `ghost_${Date.now()}@invyra.local`,
        name: "Invyra System",
        password: passwordHash,
        role: "admin",
      },
    });
  }

  // 2. Réassignation des templates
  await prisma.customTemplate.updateMany({
    where: { userId: user.id },
    data: { userId: admin.id },
  });

  // 3. Suppression du compte de l'utilisateur (événements, collaborateurs, etc seront effacés en cascade)
  await prisma.user.delete({ where: { id: user.id } });

  // 4. Déconnexion
  await clearSession();
  return { success: true };
}
