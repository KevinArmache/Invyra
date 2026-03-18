const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  const user = await prisma.user.findFirst({
    where: { email: 'kevinarmache@gmail.com' }
  })
  
  if (!user) {
    console.log("Utilisateur kevinarmache@gmail.com introuvable")
    return
  }
  
  // Create a custom template for Kevin
  const templateConfig = {
    style: "elegant",
    primaryColor: "#cda434",
    secondaryColor: "#ffffff",
    bgColor: "#111111",
    textColor: "#f0f0f0",
    fontFamily: "Lora, Georgia, serif",
    headerFontSize: "4rem",
    borderStyle: "dashed",
    borderColor: "#cda434",
    borderOpacity: 0.6,
    cornerDecoration: true,
    floral: false,
    glitter: true,
    headerText: "Kevin's VIP Event",
    subHeaderText: "Le lancement attendu",
    buttonLabel: "Je serai présent(e)",
    buttonColor: "#cda434",
    buttonTextColor: "#000000"
  }
  
  const tmpl = await prisma.customTemplate.create({
    data: {
      userId: user.id,
      name: "Modèle Prestige",
      config: templateConfig
    }
  })
  
  console.log("Modèle créé pour Kevin :", tmpl.name)
}

main().finally(() => prisma.$disconnect())
