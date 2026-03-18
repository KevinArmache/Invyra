const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const t = await prisma.customTemplate.findMany()
  console.log(JSON.stringify(t.map(x=>({name:x.name,userId:x.userId})), null, 2))
}

main().finally(() => prisma.$disconnect())
