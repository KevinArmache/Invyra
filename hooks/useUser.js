"use client";

import { useMemo } from "react";

import { authClient } from "@/utils/auth/client";

/**
 * Pont entre better-auth et le contrat `{ user, loading, mutate }` utilisé par
 * les composants clients. Préférez passer l'utilisateur depuis un Server
 * Component quand c'est possible : ce hook déclenche un aller-retour réseau.
 */
export function useUser() {
  const { data, isPending, refetch } = authClient.useSession();

  const user = useMemo(() => {
    if (!data?.user) return null;
    const { user: sessionUser } = data;
    return {
      id: sessionUser.id,
      email: sessionUser.email,
      name: sessionUser.name,
      image: sessionUser.image ?? null,
      company: sessionUser.company ?? null,
      phone: sessionUser.phone ?? null,
      role: sessionUser.role ?? "user",
      plan: sessionUser.plan ?? "free",
      suspended: sessionUser.suspended ?? false,
    };
  }, [data]);

  return { user, loading: isPending, mutate: refetch };
}
