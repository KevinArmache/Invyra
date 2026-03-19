import { NextResponse } from 'next/server'
import { prisma } from '@/utils/prisma'

export async function GET(request) {
  // Sécurisation optionnelle recommandée par Vercel : vérifier le header Authorization
  // Si CRON_SECRET est défini dans Vercel, on valide l'origine
  const authHeader = request.headers.get('authorization')
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Requête très légère (lecture) pour simplement réveiller/maintenir la connexion MongoDB
    const count = await prisma.user.count()
    
    return NextResponse.json({ 
      success: true, 
      message: 'MongoDB keep-alive ping successful', 
      usersCount: count,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('KeepAlive Cron Error:', error)
    return NextResponse.json({ error: 'Failed to ping database' }, { status: 500 })
  }
}
