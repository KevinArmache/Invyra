const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

prisma.guest.findFirst({ orderBy: { createdAt: 'desc' }, include: { event: true } })
  .then(g => {
    if (g) {
      console.log('TOKEN_IS: ' + g.invitationToken)
      console.log('EVENT_IS: ' + g.eventId)
      console.log('TEMPLATE_NAME: ' + (g.event.invitationTemplate ? 'Oui (configuré)' : 'Non'))
    } else {
      console.log('NO_GUEST_FOUND')
    }
  })
  .finally(() => prisma.$disconnect())
