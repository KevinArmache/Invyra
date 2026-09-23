import { NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

/**
 * Filtre d'entrée volontairement superficiel : il ne fait que vérifier la
 * présence du cookie de session pour éviter d'afficher une page privée à un
 * visiteur anonyme. La vraie autorisation (rôle, suspension, propriété d'un
 * événement) est faite côté serveur par requireAuth / requireAdmin, qui
 * interrogent la base. Un cookie forgé ne donne donc accès à rien.
 */
export async function proxy(request) {
  const { pathname } = request.nextUrl;

  const isProtected =
    pathname.startsWith("/dashboard") || pathname.startsWith("/admin");

  if (!isProtected) return NextResponse.next();

  const sessionCookie = getSessionCookie(request);

  if (!sessionCookie) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
