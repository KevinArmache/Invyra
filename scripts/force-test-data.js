const { PrismaClient } = require('@prisma/client')
const { nanoid } = require('nanoid')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  // Find or create a user
  let user = await prisma.user.findFirst()
  if (!user) {
    const hashedPassword = await bcrypt.hash('password123', 10)
    user = await prisma.user.create({
      data: {
        name: 'Test User',
        email: 'test@example.com',
        password: hashedPassword,
      }
    })
    console.log("✅ Nouvel utilisateur de test créé (test@example.com / password123)")
  } else {
    console.log(`✅ Utilisateur trouvé : ${user.email}`)
  }
  
  // 1. Create a custom template
  const templateConfig = {
    style: "elegant",
    primaryColor: "#d4af37",
    secondaryColor: "#ffffff",
    bgColor: "#111111",
    textColor: "#f0f0f0",
    fontFamily: "Lora, Georgia, serif",
    headerFontSize: "4rem",
    borderStyle: "double",
    borderColor: "#d4af37",
    borderOpacity: 0.8,
    cornerDecoration: true,
    floral: false,
    glitter: true,
    headerText: "Invitation Spéciale",
    subHeaderText: "Test du nouveau système Invyra",
    buttonLabel: "Je confirme ma présence",
    buttonColor: "#d4af37",
    buttonTextColor: "#000000"
  }
  
  const tmpl = await prisma.customTemplate.create({
    data: {
      userId: user.id,
      name: "Modèle Prestige (Test Officiel)",
      config: templateConfig
    }
  })
  
  // 2. Create Event
  const event = await prisma.event.create({
    data: {
      userId: user.id,
      title: "Événement Test: Lancement Invyra",
      description: "Ceci est un événement généré automatiquement pour tester le flux RSVP complet.",
      eventDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // in 7 days
      location: "Paris, France",
      invitationTemplate: templateConfig,
      customMessage: "Nous avons hâte de vous retrouver pour tester cette fonctionnalité."
    }
  })
  
  // 3. Create Guest
  const token = nanoid(32)
  const guest = await prisma.guest.create({
    data: {
      eventId: event.id,
      name: "Test Invité",
      email: "test_invite@example.com",
      phone: "+33600000000",
      invitationToken: token
    }
  })
  
  console.log("=========================================================")
  console.log("✅ DONNÉES DE TEST CRÉÉES AVEC SUCCÈS")
  console.log("=========================================================")
  console.log("Template créé :", tmpl.name)
  console.log("Événement créé:", event.title)
  console.log("Invité ajouté :", guest.name, `(${guest.email})`)
  console.log("")
  console.log("➡️ Lien PUBLIC de l'Invitation (cliquez ici pour voir l'invitation et le formulaire RSVP) :")
  console.log(`   http://localhost:3000/invite/${token}`)
  console.log("=========================================================")
  console.log("➡️ Lien du Dashboard de l'Événement :")
  console.log(`   http://localhost:3000/dashboard/events/${event.id}`)
  console.log("=========================================================")
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
