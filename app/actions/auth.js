'use server'

import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'
import { prisma } from '@/utils/prisma'
import { redirect } from 'next/navigation'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'invyra-secret-key-change-in-production'
)

export async function hashPassword(password) {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password, hashedPassword) {
  return bcrypt.compare(password, hashedPassword)
}

export async function createToken(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET)
}

export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload
  } catch {
    return null
  }
}

export async function getSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value
  
  if (!token) return null
  
  const payload = await verifyToken(token)
  return payload
}

export async function setSession(userId, email, name) {
  const token = await createToken({ userId, email, name })
  const cookieStore = await cookies()
  
  cookieStore.set('auth-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/'
  })
  
  return token
}

export async function clearSession() {
  const cookieStore = await cookies()
  cookieStore.delete('auth-token')
}

// ─── Auth Actions ─────────────────────────────────────────────────────────────

export async function login(email, password) {
  if (!email || !password) throw new Error('Email et mot de passe requis')

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() }
  })

  if (!user) throw new Error('Email ou mot de passe invalide')

  const isValid = await verifyPassword(password, user.password)
  if (!isValid) throw new Error('Email ou mot de passe invalide')

  await setSession(user.id, user.email, user.name)

  return { id: user.id, email: user.email, name: user.name }
}

export async function register(name, email, password, company) {
  if (!email || !password || !name) throw new Error('Nom, email et mot de passe requis')
  if (password.length < 8) throw new Error('Le mot de passe doit contenir au moins 8 caractères')

  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
  if (existing) throw new Error('Un compte avec cet email existe déjà')

  const passwordHash = await hashPassword(password)
  const user = await prisma.user.create({
    data: { email: email.toLowerCase(), password: passwordHash, name, company: company || null }
  })

  await setSession(user.id, user.email, user.name)
  return { id: user.id, email: user.email, name: user.name }
}

export async function logout() {
  await clearSession()
  redirect('/login')
}

export async function getCurrentUser() {
  const session = await getSession()
  if (!session) return null

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, email: true, name: true, company: true, createdAt: true }
  })

  return user || null
}

export async function updateProfile(name, company) {
  const session = await getSession()
  if (!session) throw new Error('Non authentifié')

  const user = await prisma.user.update({
    where: { id: session.userId },
    data: { name: name || undefined, company: company || undefined },
    select: { id: true, email: true, name: true, company: true }
  })

  return user
}

export async function changePassword(currentPassword, newPassword) {
  const session = await getSession()
  if (!session) throw new Error('Non authentifié')

  if (!newPassword || newPassword.length < 8) throw new Error('Le nouveau mot de passe doit contenir au moins 8 caractères')

  const user = await prisma.user.findUnique({ where: { id: session.userId } })
  if (!user) throw new Error('Utilisateur introuvable')

  const isValid = await verifyPassword(currentPassword, user.password)
  if (!isValid) throw new Error('Mot de passe actuel incorrect')

  const hash = await hashPassword(newPassword)
  await prisma.user.update({ where: { id: session.userId }, data: { password: hash } })

  return { success: true }
}

