'use server'

import { prisma } from '@/utils/prisma'
import { getSession, isEventOwnerOrAdmin } from './auth'
import { nanoid } from 'nanoid'

// ─── Récupérer les collaborateurs d'un événement ────────────────────────────

export async function getCollaborators(eventId) {
  const session = await getSession()
  if (!session) throw new Error('Non authentifié')

  return prisma.eventCollaborator.findMany({
    where: { eventId },
    include: {
      user: { select: { id: true, name: true, email: true } }
    },
    orderBy: { createdAt: 'asc' }
  })
}

// ─── Ajouter un collaborateur par email ──────────────────────────────────────

export async function addCollaborator(eventId, email, role = 'editor') {
  const isOwnerOrAdmin = await isEventOwnerOrAdmin(eventId)
  if (!isOwnerOrAdmin) throw new Error('Accès refusé')

  if (!['editor', 'viewer'].includes(role)) throw new Error('Rôle invalide')

  // Vérifier que l'utilisateur cible existe
  const targetUser = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: { id: true, name: true, email: true }
  })
  if (!targetUser) throw new Error("Aucun compte trouvé avec cet email. L'utilisateur doit d'abord s'inscrire.")

  // Vérifier que l'owner ne s'ajoute pas lui-même
  const event = await prisma.event.findUnique({ where: { id: eventId }, select: { userId: true } })
  if (event?.userId === targetUser.id) throw new Error("Le propriétaire de l'événement ne peut pas être ajouté comme collaborateur.")

  // Vérifier doublon
  const existing = await prisma.eventCollaborator.findFirst({
    where: { eventId, userId: targetUser.id }
  })
  if (existing) throw new Error('Cet utilisateur est déjà collaborateur.')

  const inviteToken = nanoid(32)

  const collab = await prisma.eventCollaborator.create({
    data: {
      eventId,
      userId: targetUser.id,
      role,
      inviteToken,
      accepted: true,  // acceptation directe si l'utilisateur existe déjà
    },
    include: {
      user: { select: { id: true, name: true, email: true } }
    }
  })

  return collab
}

// ─── Supprimer un collaborateur ──────────────────────────────────────────────

export async function removeCollaborator(collaboratorId, eventId) {
  const isOwnerOrAdmin = await isEventOwnerOrAdmin(eventId)
  if (!isOwnerOrAdmin) throw new Error('Accès refusé')

  await prisma.eventCollaborator.delete({ where: { id: collaboratorId } })
  return { success: true }
}

// ─── Mettre à jour le rôle d'un collaborateur ───────────────────────────────

export async function updateCollaboratorRole(collaboratorId, eventId, role) {
  const isOwnerOrAdmin = await isEventOwnerOrAdmin(eventId)
  if (!isOwnerOrAdmin) throw new Error('Accès refusé')

  if (!['editor', 'viewer'].includes(role)) throw new Error('Rôle invalide')

  return prisma.eventCollaborator.update({
    where: { id: collaboratorId },
    data: { role },
    include: { user: { select: { id: true, name: true, email: true } } }
  })
}

// ─── Vérifier si l'utilisateur courant est collaborateur ────────────────────

export async function getMyCollaboratorRole(eventId) {
  const session = await getSession()
  if (!session) return null

  const collab = await prisma.eventCollaborator.findFirst({
    where: { eventId, userId: session.userId, accepted: true },
    select: { role: true }
  })
  return collab?.role || null
}
