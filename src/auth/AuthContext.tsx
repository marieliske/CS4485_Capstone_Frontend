import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

interface User {
  login: string
  name: string
  avatar_url: string
}

interface AuthContextValue {
  token: string | null
  user: User | null
  logout: () => void
}

const AuthContext = createContext<AuthContextValue>({
  token: null,
  user: null,
  logout: () => {},
})

export const TOKEN_KEY = 'docrot_jwt'

function parseJwtPayload(token: string): User | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return {
      login: payload.login ?? '',
      name: payload.name ?? '',
      avatar_url: payload.avatar_url ?? '',
    }
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY))
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem(TOKEN_KEY)
    return stored ? parseJwtPayload(stored) : null
  })

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const urlToken = params.get('token')
    const error = params.get('error')

    if (urlToken) {
      localStorage.setItem(TOKEN_KEY, urlToken)
      setToken(urlToken)
      setUser(parseJwtPayload(urlToken))
      window.history.replaceState({}, '', window.location.pathname)
    } else if (error) {
      console.error('OAuth error:', error)
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  function logout() {
    localStorage.removeItem(TOKEN_KEY)
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ token, user, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
