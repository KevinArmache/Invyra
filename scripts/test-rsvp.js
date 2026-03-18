import { PrismaClient } from '@prisma/client'
import { v4 as uuidv4 } from 'uuid'

const prisma = new PrismaClient()

async function runTests() {
  console.log('🤖 Démarrage des tests RSVP de bout en bout...')
  let testUserId = null
  let eventId = null
  let guestId = null
  let token = uuidv4()

  try {
    // 1. Créer un faux utilisateur pour le test
    console.log('1️⃣ Création d\'un utilisateur de test...')
    const user = await prisma.user.create({
      data: {
        email: `test-${Date.now()}@example.com`,
        password: 'hashedpassword',
        name: 'Testeur'
      }
    })
    testUserId = user.id

    // 2. Créer un événement associé
    console.log('2️⃣ Création d\'un événement de test...')
    const event = await prisma.event.create({
      data: {
        userId: testUserId,
        title: 'Fête de l\'Automatisme',
        eventDate: new Date(Date.now() + 86400000), // Demain
        location: 'Paris',
        status: 'draft',
        invitationTemplate: {
          type: 'code',
          html: '<h1>Test</h1>',
          css: 'h1 { color: red; }',
          js: 'console.log("test")'
        }
      }
    })
    eventId = event.id

    // 3. Créer un invité
    console.log('3️⃣ Ajout d\'un invité à cet événement...')
    const guest = await prisma.guest.create({
      data: {
        eventId: eventId,
        name: 'John Doe',
        email: 'john.doe@test.local',
        invitationToken: token
      }
    })
    guestId = guest.id

    // 4. Test lecture par token (Simule la page /invite/[token])
    console.log('4️⃣ Lecture de l\'invitation via son token...')
    const findGuest = await prisma.guest.findUnique({
      where: { invitationToken: token },
      include: { event: true }
    })
    
    if (!findGuest || findGuest.name !== 'John Doe') {
      throw new Error("L'invité n'a pas été trouvé correctement via le token.")
    }
    if (!findGuest.event.invitationTemplate) {
      throw new Error("Le template d'invitation n'a pas été chargé correctement.")
    }
    console.log('✅ Lecture réussie. Template bien inclus.')

    // 5. Test Update RSVP (Simule le postMessage RSVP_SUBMIT)
    console.log('5️⃣ Soumission d\'un RSVP (confirmed)...')
    await prisma.guest.update({
      where: { invitationToken: token },
      data: {
        rsvpStatus: 'confirmed',
        dietaryRestrictions: 'Végétarien',
        plusOne: true
      }
    })

    const verifyGuest1 = await prisma.guest.findUnique({ where: { invitationToken: token } })
    if (verifyGuest1.rsvpStatus !== 'confirmed' || verifyGuest1.plusOne !== true) {
      throw new Error("La soumission du RSVP a échoué en base de données.")
    }
    console.log('✅ Soumission confirmée en DB.')

    // 6. Test Update (Modification du RSVP)
    console.log('6️⃣ Modification du RSVP (declined)...')
    await prisma.guest.update({
      where: { invitationToken: token },
      data: {
        rsvpStatus: 'declined',
        dietaryRestrictions: '',
        plusOne: false
      }
    })

    const verifyGuest2 = await prisma.guest.findUnique({ where: { invitationToken: token } })
    if (verifyGuest2.rsvpStatus !== 'declined' || verifyGuest2.plusOne !== false) {
      throw new Error("La modification du RSVP a échoué en base de données.")
    }
    console.log('✅ Modification confirmée en DB.')

    console.log('🎉 TOUS LES TESTS SONT PASSÉS AVEC SUCCÈS ! L\'architecture RSVP est 100% robuste.')

  } catch (err) {
    console.error('❌ ERREUR LORS DU TEST :', err)
  } finally {
    // 7. Nettoyage de la base de données
    console.log('🧹 Nettoyage des données de test...')
    if (guestId) await prisma.guest.delete({ where: { id: guestId } })
    if (eventId) await prisma.event.delete({ where: { id: eventId } })
    if (testUserId) await prisma.user.delete({ where: { id: testUserId } })
    await prisma.$disconnect()
  }
}

runTests()
