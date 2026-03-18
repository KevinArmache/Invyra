const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const prisma = new PrismaClient()

prisma.guest.findFirst({ orderBy: { createdAt: 'desc' }, include: { event: true } })
  .then(g => {
    fs.writeFileSync('test-data.json', JSON.stringify({ token: g.invitationToken, eventId: g.eventId }, null, 2))
  })
  .finally(() => prisma.$disconnect())
