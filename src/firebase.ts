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

function isLikelyApiKey(value: string): boolean {
  return /^AIza[0-9A-Za-z_-]{20,}$/.test(value)
}

function validateFirebaseEnv(env: typeof firebaseEnv): string[] {
  const issues: string[] = []

  if (env.authDomain) {
    const authDomain = env.authDomain.trim()
    if (isLikelyApiKey(authDomain)) {
      issues.push('VITE_FIREBASE_AUTH_DOMAIN looks like an API key. It should be a domain such as your-project.firebaseapp.com.')
    } else if (!authDomain.includes('.')) {
      issues.push('VITE_FIREBASE_AUTH_DOMAIN must be a valid host name (for example, your-project.firebaseapp.com).')
    }
  }

  if (env.apiKey && env.authDomain && env.apiKey.trim() === env.authDomain.trim()) {
    issues.push('VITE_FIREBASE_API_KEY and VITE_FIREBASE_AUTH_DOMAIN are identical. These must be different values.')
  }

  return issues
}

export const firebaseInvalidEnvIssues = validateFirebaseEnv(firebaseEnv)

export const firebaseConfigured = firebaseMissingEnvKeys.length === 0 && firebaseInvalidEnvIssues.length === 0

const firebaseConfig = {
  // Keep initialization resilient so UI can render an actionable setup message.
  apiKey: firebaseEnv.apiKey || 'missing-api-key',
  authDomain: firebaseEnv.authDomain || 'missing-auth-domain',
  projectId: firebaseEnv.projectId || 'missing-project-id',
  storageBucket: firebaseEnv.storageBucket || 'missing-storage-bucket',
  messagingSenderId: firebaseEnv.messagingSenderId || 'missing-sender-id',
  appId: firebaseEnv.appId || 'missing-app-id',
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export const githubProvider = new GithubAuthProvider()
