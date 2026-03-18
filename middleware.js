import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'invyra-secret-key-change-in-production'
)

async function getPayload(token) {
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload
  } catch {
    return null
  }
}

export async function middleware(request) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('auth-token')?.value

  // ── Routes publiques : toujours autorisées ─────────────────────────
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/invite') ||
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/'
  ) {
    return NextResponse.next()
  }

  const payload = await getPayload(token)

  // ── Protection /dashboard/** ────────────────────────────────────────
  if (pathname.startsWith('/dashboard')) {
    if (!payload) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return NextResponse.next()
  }

  // ── Protection /admin/** ────────────────────────────────────────────
  if (pathname.startsWith('/admin')) {
    if (!payload) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Vérification du rôle directement via l'API route interne
    // (le JWT peut ne pas contenir le rôle si token ancien)
    // On délègue la vérification à requireAdmin() dans le Server Component
    // mais on vérifie d'abord le JWT pour les nouveaux tokens
    const roleFromJwt = payload.role

    if (roleFromJwt && roleFromJwt !== 'admin') {
      // JWT récent et rôle clairement non-admin → bloquer directement
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // Si le JWT est ancien (pas de role), on laisse passer
    // requireAdmin() dans le layout fera la vérification DB fiable
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.svg|.*\\.webp).*)'],
}
