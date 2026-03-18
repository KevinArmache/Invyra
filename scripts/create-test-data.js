const { PrismaClient } = require('@prisma/client')
const { nanoid } = require('nanoid')

const prisma = new PrismaClient()

async function main() {
  const user = await prisma.user.findFirst()
  if (!user) {
    console.log("⚠️ Aucun utilisateur trouvé. Veuillez créer un compte/vous connecter d'abord.")
    return
  }
  
  // 1. Create a custom template
  const templateConfig = {
    style: "elegant",
    primaryColor: "#cda434",
    secondaryColor: "#ffffff",
    bgColor: "#0f0f11",
    textColor: "#f0f0f0",
    fontFamily: "Lora, Georgia, serif",
    headerFontSize: "3.5rem",
    borderStyle: "solid",
    borderColor: "#cda434",
    borderOpacity: 0.5,
    cornerDecoration: true,
    floral: false,
    glitter: true,
    headerText: "Invitation Spéciale",
    subHeaderText: "Test du nouveau système Invyra",
    buttonLabel: "Je serai présent(e)",
    buttonColor: "#cda434",
    buttonTextColor: "#000000"
  }
  
  const tmpl = await prisma.customTemplate.create({
    data: {
      userId: user.id,
      name: "Modèle VIP (Test)",
      config: templateConfig
    }
  })
  
  // 2. Create Event
  const event = await prisma.event.create({
    data: {
      userId: user.id,
      title: "Événement de Test RSVP",
      description: "Ceci est un événement généré automatiquement pour tester le flux RSVP complet de A à Z.",
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
      name: "Sacha L'Invité",
      email: "sacha@example.com",
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
  console.log("➡️ Lien du Dashboard de l'Événement : http://localhost:3000/dashboard/events/" + event.id)
  console.log("➡️ Lien PUBLIC de l'Invitation (pour Sacha) : http://localhost:3000/invite/" + token)
  console.log("=========================================================")
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
