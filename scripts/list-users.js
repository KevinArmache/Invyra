const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
  })
  console.log(JSON.stringify(users.map(u => ({ id: u.id, email: u.email })), null, 2))
}

main().finally(() => prisma.$disconnect())
