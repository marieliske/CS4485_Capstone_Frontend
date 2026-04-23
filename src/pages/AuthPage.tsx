import { useState } from 'react'
import { signInWithPopup, getAdditionalUserInfo, GithubAuthProvider } from 'firebase/auth'
import { auth, githubProvider } from '../firebase'

export type AuthMode = 'sign-in' | 'sign-up'

interface AuthPageProps {
  onAuthenticate?: (githubUsername?: string) => void
}

export function AuthPage({ onAuthenticate }: AuthPageProps) {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  async function resolveGitHubUsername(result: Awaited<ReturnType<typeof signInWithPopup>>): Promise<string | undefined> {
    const additionalInfo = getAdditionalUserInfo(result)
    if (additionalInfo?.username) {
      return additionalInfo.username
    }

    const credential = GithubAuthProvider.credentialFromResult(result)
    const accessToken = credential?.accessToken
    if (!accessToken) {
      return undefined
    }

    try {
      const response = await fetch('https://api.github.com/user', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (!response.ok) return undefined
      const payload = (await response.json()) as { login?: unknown }
      return typeof payload.login === 'string' ? payload.login : undefined
    } catch {
      return undefined
    }
  }

  async function handleGitHub() {
    setError(null)
    setIsLoading(true)
    try {
      const result = await signInWithPopup(auth, githubProvider)
      const githubUsername = await resolveGitHubUsername(result)
      onAuthenticate?.(githubUsername)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'GitHub sign-in failed.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div data-theme="dark" style={{ minHeight: '100vh' }}>
      <section className="auth-page">
        {/* Left hero side */}
        <div className="auth-hero-side">
          <div className="auth-brand">
            <div className="auth-brand-mark">D</div>
            <span>DocRot Detector</span>
          </div>

          <div className="auth-hero-copy">
            <h1>
              Stop shipping <em>stale</em> docs with your code.
            </h1>
            <p>
              DocRot Detector automatically scans your repositories for documentation drift — when code
              changes but the docs don&apos;t. Catch it early, fix it fast.
            </p>
          </div>

          <div className="auth-hero-stats">
            <div>
              <div className="stat-label">Detection</div>
              <div className="stat-val">AI-powered</div>
            </div>
            <div>
              <div className="stat-label">Repos</div>
              <div className="stat-val">GitHub</div>
            </div>
            <div>
              <div className="stat-label">Action</div>
              <div className="stat-val">1 click</div>
            </div>
          </div>
        </div>

        {/* Right auth panel */}
        <div className="auth-panel-side">
          <div className="auth-card-wrap">
            <h2>Welcome back.</h2>
            <p>Sign in to review scan results and documentation issues for your repositories.</p>

            <button
              type="button"
              className="auth-gh-btn"
              onClick={handleGitHub}
              disabled={isLoading}
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 .7a11.3 11.3 0 0 0-3.58 22c.57.1.78-.25.78-.55v-2.15c-3.19.7-3.87-1.36-3.87-1.36-.52-1.32-1.27-1.66-1.27-1.66-1.03-.7.08-.69.08-.69 1.15.08 1.74 1.17 1.74 1.17 1 .17 2.13.73 2.66 1.96.89 1.52 2.34 1.08 2.91.82.09-.72.35-1.21.63-1.49-2.55-.29-5.22-1.28-5.22-5.7 0-1.26.45-2.28 1.17-3.08-.12-.28-.51-1.44.11-2.99 0 0 .96-.31 3.14 1.17a10.8 10.8 0 0 1 5.72 0c2.18-1.48 3.13-1.17 3.13-1.17.63 1.55.24 2.71.12 2.99.73.8 1.17 1.82 1.17 3.08 0 4.43-2.68 5.4-5.24 5.69.42.36.78 1.05.78 2.14v3.17c0 .31.2.66.79.55A11.3 11.3 0 0 0 12 .7Z" />
              </svg>
              {isLoading ? 'Signing in…' : 'Continue with GitHub'}
            </button>

            {error ? <p className="auth-error">{error}</p> : null}

            <div className="auth-footer">
              <button type="button">Privacy Policy</button>
              <button type="button">Terms of Service</button>
              <button type="button">Help Center</button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
