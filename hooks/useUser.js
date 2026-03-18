'use client'

import { useState, useEffect, useCallback } from 'react'
import { getCurrentUser } from '@/app/actions/auth'

export function useUser() {
  const [user, setUser] = useState(undefined)
  const [loading, setLoading] = useState(true)

  const fetchUser = useCallback(async () => {
    try {
      const data = await getCurrentUser()
      setUser(data)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  // mutate permet de forcer un re-fetch (compatibilité avec les usages existants)
  const mutate = useCallback((forcedValue) => {
    if (forcedValue !== undefined) {
      setUser(forcedValue)
    } else {
      fetchUser()
    }
  }, [fetchUser])

  return { user: user ?? null, loading, mutate }
}

