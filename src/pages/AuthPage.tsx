import { type FormEvent, useState } from 'react'
import { signInWithPopup, getAdditionalUserInfo } from 'firebase/auth'
import { useAuth } from '../auth/AuthContext'
import { auth, githubProvider } from '../firebase'

export type AuthMode = 'sign-in' | 'sign-up'

interface AuthPageProps {
  mode: AuthMode
  onAuthenticate?: (githubUsername?: string) => void
  onModeChange?: (mode: AuthMode) => void
}

function BrandMark() {
  return (
    <span className="auth-brand-mark" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 3.5 19 6v5.3c0 4.3-2.6 7.6-7 9.2-4.4-1.6-7-4.9-7-9.2V6z" />
        <path d="M12 7.7v7" />
        <path d="M8.6 11.2h6.8" />
      </svg>
    </span>
  )
}

function FeatureIcon({ type }: { type: 'scan' | 'alert' | 'drilldown' }) {
  if (type === 'scan') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="11" cy="11" r="5.8" />
        <path d="m16 16 4 4" />
      </svg>
    )
  }

  if (type === 'alert') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 4 21 19H3z" />
        <path d="M12 9v4" />
        <path d="M12 16h.01" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="4" y="4" width="7" height="7" rx="1.3" />
      <rect x="13" y="4" width="7" height="7" rx="1.3" />
      <rect x="4" y="13" width="7" height="7" rx="1.3" />
      <rect x="13" y="13" width="7" height="7" rx="1.3" />
    </svg>
  )
}

export function AuthPage({ mode, onAuthenticate, onModeChange }: AuthPageProps) {
  const { signInWithEmail, signUpWithEmail } = useAuth()
  const isSignUp = mode === 'sign-up'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    if (isSignUp && password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    setIsLoading(true)
    try {
      if (isSignUp) {
        await signUpWithEmail(email, password)
      } else {
        await signInWithEmail(email, password)
      }
      onAuthenticate?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed.')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleGitHub() {
    setError(null)
    setIsLoading(true)
    try {
      const result = await signInWithPopup(auth, githubProvider)
      const additionalInfo = getAdditionalUserInfo(result)
      const githubUsername = additionalInfo?.username ?? undefined
      onAuthenticate?.(githubUsername)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'GitHub sign-in failed.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section className="auth-page">
      <div className="auth-shell">
        <aside className="auth-hero">
          <div className="auth-hero-top">
            <div className="auth-brand">
              <BrandMark />
              <div>
                <p className="auth-brand-kicker">DocRot Detector</p>
                <h1>Stay ahead of stale docs before your team ships confusion.</h1>
              </div>
            </div>

            <p className="auth-hero-copy">
              Keep scans, issue review, and drill-down history in one place so the team can move from
              detection to action without losing context.
            </p>
          </div>

          <div className="auth-feature-grid">
            <article className="auth-feature-card">
              <span className="auth-feature-icon">
                <FeatureIcon type="scan" />
              </span>
              <strong>Live scan visibility</strong>
              <p>Track repo health, recent runs, and backend-driven scan history in one dashboard.</p>
            </article>

            <article className="auth-feature-card">
              <span className="auth-feature-icon">
                <FeatureIcon type="alert" />
              </span>
              <strong>Actionable issue review</strong>
              <p>Filter findings quickly and inspect exactly which files and sections need attention.</p>
            </article>

            <article className="auth-feature-card">
              <span className="auth-feature-icon">
                <FeatureIcon type="drilldown" />
              </span>
              <strong>Fast drill-down flow</strong>
              <p>Jump from overview cards into project, scan, and issue detail screens without dead ends.</p>
            </article>
          </div>

          <div className="auth-stat-row">
            <div>
              <strong>12+</strong>
              <span>scan checkpoints in view</span>
            </div>
            <div>
              <strong>1 click</strong>
              <span>from dashboard to issue detail</span>
            </div>
            <div>
              <strong>Team-ready</strong>
              <span>for your capstone demo flow</span>
            </div>
          </div>

          <div className="auth-hero-note">
            <p className="auth-note-label">Today&apos;s focus</p>
            <p>
              Use this workspace to review dashboard connections, scan history drill-downs, and the issue
              detail experience you just added.
            </p>
          </div>
        </aside>

        <div className="auth-panel">
          <div className="auth-card">
            <div className="auth-mode-toggle" role="tablist" aria-label="Authentication mode">
              <button
                type="button"
                className={mode === 'sign-in' ? 'auth-mode-btn active' : 'auth-mode-btn'}
                onClick={() => onModeChange?.('sign-in')}
              >
                Sign In
              </button>
              <button
                type="button"
                className={mode === 'sign-up' ? 'auth-mode-btn active' : 'auth-mode-btn'}
                onClick={() => onModeChange?.('sign-up')}
              >
                Sign Up
              </button>
            </div>

            <div className="auth-card-header">
              <p className="auth-eyebrow">{isSignUp ? 'Create your workspace' : 'Welcome back'}</p>
              <h2>{isSignUp ? 'Start monitoring doc rot with your team.' : 'Sign in to your DocRot workspace.'}</h2>
              <p className="auth-card-copy">
                {isSignUp
                  ? 'Set up a shared workspace for scans, issue triage, and project review.'
                  : 'Use your email or GitHub to review the latest scan results and documentation issues.'}
              </p>
            </div>

            <button type="button" className="auth-provider-btn" onClick={handleGitHub} disabled={isLoading}>
              <span aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 .7a11.3 11.3 0 0 0-3.58 22c.57.1.78-.25.78-.55v-2.15c-3.19.7-3.87-1.36-3.87-1.36-.52-1.32-1.27-1.66-1.27-1.66-1.03-.7.08-.69.08-.69 1.15.08 1.74 1.17 1.74 1.17 1 .17 2.13.73 2.66 1.96.89 1.52 2.34 1.08 2.91.82.09-.72.35-1.21.63-1.49-2.55-.29-5.22-1.28-5.22-5.7 0-1.26.45-2.28 1.17-3.08-.12-.28-.51-1.44.11-2.99 0 0 .96-.31 3.14 1.17a10.8 10.8 0 0 1 5.72 0c2.18-1.48 3.13-1.17 3.13-1.17.63 1.55.24 2.71.12 2.99.73.8 1.17 1.82 1.17 3.08 0 4.43-2.68 5.4-5.24 5.69.42.36.78 1.05.78 2.14v3.17c0 .31.2.66.79.55A11.3 11.3 0 0 0 12 .7Z" />
                </svg>
              </span>
              {isSignUp ? 'Sign up with GitHub' : 'Continue with GitHub'}
            </button>

            <div className="auth-divider">
              <span>{isSignUp ? 'or create an account with email' : 'or continue with email'}</span>
            </div>

            <form className="auth-form" onSubmit={handleSubmit}>
              {isSignUp ? (
                <div className="auth-form-grid">
                  <label className="auth-field">
                    <span>Full Name</span>
                    <input
                      type="text"
                      placeholder="Alex Chen"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                    />
                  </label>
                  <label className="auth-field">
                    <span>Team Name</span>
                    <input type="text" placeholder="Capstone Team 2" />
                  </label>
                </div>
              ) : null}

              <label className="auth-field">
                <span>{isSignUp ? 'Work Email' : 'Email Address'}</span>
                <input
                  type="email"
                  placeholder="name@company.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>

              {isSignUp ? (
                <label className="auth-field">
                  <span>Workspace URL</span>
                  <input type="text" placeholder="team-docrot-demo" />
                </label>
              ) : null}

              <label className="auth-field">
                <div className="auth-field-row">
                  <span>Password</span>
                  {!isSignUp ? <button type="button">Forgot password?</button> : null}
                </div>
                <input
                  type="password"
                  placeholder="Enter your password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>

              {isSignUp ? (
                <label className="auth-field">
                  <span>Confirm Password</span>
                  <input
                    type="password"
                    placeholder="Re-enter your password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </label>
              ) : null}

              {error ? <p className="auth-error">{error}</p> : null}

              <div className="auth-inline-row">
                <label className="auth-checkbox">
                  <input type="checkbox" defaultChecked={!isSignUp} />
                  <span>{isSignUp ? 'I agree to the terms and privacy policy' : 'Keep me signed in on this device'}</span>
                </label>
              </div>

              <button type="submit" className="auth-submit-btn" disabled={isLoading}>
                <span>{isLoading ? 'Please wait…' : isSignUp ? 'Create Account' : 'Sign In to Dashboard'}</span>
                <span aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M5 12h14" />
                    <path d="m13 7 6 5-6 5" />
                  </svg>
                </span>
              </button>
            </form>

            <p className="auth-switch-copy">
              {isSignUp ? 'Already have an account?' : "Don't have an account yet?"}{' '}
              <button type="button" onClick={() => onModeChange?.(isSignUp ? 'sign-in' : 'sign-up')}>
                {isSignUp ? 'Sign in instead' : 'Create one now'}
              </button>
            </p>
          </div>

          <div className="auth-footer">
            <button type="button">Privacy Policy</button>
            <button type="button">Terms of Service</button>
            <button type="button">Help Center</button>
          </div>
        </div>
      </div>
    </section>
  )
}
