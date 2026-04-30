import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth'
import { auth, githubProvider, localPreviewMode } from '../firebase'

const localPreviewUser = {
  uid: 'local-preview-user',
  displayName: 'Local preview',
  email: 'local-preview@localhost',
  photoURL: '',
  providerData: [],
} as unknown as User

interface AuthContextValue {
  user: User | null
  loading: boolean
  signInWithEmail: (email: string, password: string) => Promise<void>
  signUpWithEmail: (email: string, password: string) => Promise<void>
  signInWithGitHub: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  signInWithEmail: async () => {},
  signUpWithEmail: async () => {},
  signInWithGitHub: async () => {},
  logout: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(localPreviewMode ? localPreviewUser : null)
  const [loading, setLoading] = useState(!localPreviewMode)

  useEffect(() => {
    if (localPreviewMode) {
      setUser(localPreviewUser)
      setLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser)
      setLoading(false)
    })
    return unsubscribe
  }, [])

  async function signInWithEmail(email: string, password: string) {
    if (localPreviewMode) return
    await signInWithEmailAndPassword(auth, email, password)
  }

  async function signUpWithEmail(email: string, password: string) {
    if (localPreviewMode) return
    await createUserWithEmailAndPassword(auth, email, password)
  }

  async function signInWithGitHub() {
    if (localPreviewMode) return
    await signInWithPopup(auth, githubProvider)
  }

  async function logout() {
    if (localPreviewMode) return
    await signOut(auth)
  }

  return (
    <AuthContext.Provider value={{ user, loading, signInWithEmail, signUpWithEmail, signInWithGitHub, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
