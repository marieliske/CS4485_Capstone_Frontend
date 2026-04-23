import { initializeApp } from 'firebase/app'
import { getAuth, GithubAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseEnv = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
} as const

export const firebaseMissingEnvKeys = Object.entries(firebaseEnv)
  .filter(([, value]) => !value)
  .map(([key]) => key)

function looksLikeFirebaseApiKey(value: string): boolean {
  return /^AIza[0-9A-Za-z_-]{20,}$/.test(value)
}

function sanitizeAuthDomain(authDomain: string | undefined, projectId: string | undefined): string {
  const domain = (authDomain ?? '').trim()
  if (!domain && projectId) {
    return `${projectId}.firebaseapp.com`
  }

  if (domain && !looksLikeFirebaseApiKey(domain) && domain.includes('.')) {
    return domain
  }

  if (projectId) {
    return `${projectId}.firebaseapp.com`
  }

  return domain
}

export const firebaseConfigured = firebaseMissingEnvKeys.length === 0

const resolvedAuthDomain = sanitizeAuthDomain(firebaseEnv.authDomain, firebaseEnv.projectId)

const firebaseConfig = {
  // Keep initialization resilient so UI can render an actionable setup message.
  apiKey: firebaseEnv.apiKey || 'missing-api-key',
  authDomain: resolvedAuthDomain || 'missing-auth-domain',
  projectId: firebaseEnv.projectId || 'missing-project-id',
  storageBucket: firebaseEnv.storageBucket || 'missing-storage-bucket',
  messagingSenderId: firebaseEnv.messagingSenderId || 'missing-sender-id',
  appId: firebaseEnv.appId || 'missing-app-id',
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export const githubProvider = new GithubAuthProvider()
