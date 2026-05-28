import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react'

import { AUTH_STORAGE_KEYS } from '../utils/constants'
import { getHomePath } from '../utils/roleUtils'
import * as authService from '../services/authService'

const AuthContext = createContext(null)
let authBootstrapPromise = null

const readStoredUser = () => {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEYS.user)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

const hasStoredToken = () => Boolean(localStorage.getItem(AUTH_STORAGE_KEYS.token))

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser)
  const [loading, setLoading] = useState(true)

  const persistUser = (nextUser) => {
    setUser(nextUser)
    if (nextUser) {
      localStorage.setItem(AUTH_STORAGE_KEYS.user, JSON.stringify(nextUser))
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEYS.user)
    }
  }

  const refreshUser = useCallback(async () => {
    const currentUser = await authService.getCurrentUser()
    persistUser(currentUser)
    return currentUser
  }, [])

  useEffect(() => {
    let mounted = true

    const bootstrap = async () => {
      try {
        if (!authBootstrapPromise) {
          authBootstrapPromise = (async () => {
            if (!hasStoredToken()) {
              return null
            }

            try {
              return await authService.getCurrentUser()
            } catch {
              return null
            }
          })()
        }

        const currentUser = await authBootstrapPromise
        if (mounted && currentUser) {
          persistUser(currentUser)
        }
        if (mounted && !currentUser && !readStoredUser()) {
          persistUser(null)
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }

    bootstrap()

    return () => {
      mounted = false
    }
  }, [])

  const signIn = useCallback(
    async (credentials) => {
      const response = await authService.login(credentials)
      const nextUser = response.user || response.profile || (await authService.getCurrentUser())
      persistUser(nextUser)
      return nextUser
    },
    []
  )

  const signOut = useCallback(async () => {
    await authService.logout().catch(() => null)
    persistUser(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      loading,
      signIn,
      signOut,
      refreshUser,
      homePath: getHomePath(user),
      isAuthenticated: Boolean(user),
    }),
    [user, loading, signIn, signOut, refreshUser]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export { AuthContext }