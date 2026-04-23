import { useEffect, useState } from 'react'
import { signInWithPopup, getAdditionalUserInfo, GithubAuthProvider } from 'firebase/auth'
import { auth, githubProvider } from '../firebase'

export type AuthMode = 'sign-in' | 'sign-up'

interface AuthPageProps {
  onAuthenticate?: (githubUsername?: string) => void
}

const RECENT_SCANS = [
  { repo: 'vercel/next.js', rot: 12, status: 'clean' },
  { repo: 'astro-build/astro', rot: 38, status: 'drifting' },
  { repo: 'supabase/supabase', rot: 7, status: 'clean' },
  { repo: 'trpc/trpc', rot: 61, status: 'critical' },
  { repo: 'prisma/prisma', rot: 24, status: 'drifting' },
]

export function AuthPage({ onAuthenticate }: AuthPageProps) {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [tickIdx, setTickIdx] = useState(0)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'dark')
    return () => { document.documentElement.removeAttribute('data-theme') }
  }, [])

  useEffect(() => {
    const t = setInterval(() => setTickIdx((i) => (i + 1) % RECENT_SCANS.length), 2200)
    return () => clearInterval(t)
  }, [])

  const tick = RECENT_SCANS[tickIdx]

  async function resolveGitHubUsername(result: Awaited<ReturnType<typeof signInWithPopup>>): Promise<string | undefined> {
    const additionalInfo = getAdditionalUserInfo(result)
    if (additionalInfo?.username) return additionalInfo.username

    const credential = GithubAuthProvider.credentialFromResult(result)
    const accessToken = credential?.accessToken
    if (!accessToken) return undefined

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

  const tickColor = tick.status === 'critical' ? 'var(--critical)' : tick.status === 'drifting' ? 'var(--warning)' : 'var(--success)'

  return (
    <section className="auth-page">
      {/* ── Hero side ── */}
      <div className="auth-hero-side">
        <div className="auth-brand">
          <div className="auth-brand-mark">D</div>
          <span>DocRot Detector</span>
        </div>

        {/* Live scan ticker */}
        <div className="auth-ticker">
          <span className="pill pill-live" style={{ fontSize: 10 }}>Live</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-3)' }}>
            Scanning <strong style={{ color: 'var(--ink-2)' }}>{tick.repo}</strong>
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: tickColor }}>
            {tick.rot}% rot
          </span>
        </div>

        {/* Headline */}
        <div className="auth-hero-copy">
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 20 }}>
            Documentation · Drift · Detection
          </div>
          <h1>Your docs <em>rot.</em><br />We smell it first.</h1>
          <p>
            DocRot watches your repo for the quiet decay between code and docs — mismatched signatures,
            stale examples, parameters that shifted without a note. Then it tells you exactly what to fix.
          </p>
        </div>

        {/* Product preview card */}
        <div className="auth-preview-card">
          <div className="auth-preview-header">
            <span className="dot dot-critical" />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--critical)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Critical · docrot-detector
            </span>
            <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-4)' }}>4m ago</span>
          </div>
          <div className="auth-preview-body">
            <p style={{ fontWeight: 500, fontSize: 13, marginBottom: 6, lineHeight: 1.3 }}>
              authenticate() signature no longer matches docs
            </p>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-3)', display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
              <span>src/auth.py</span>
              <span style={{ color: 'var(--ink-4)' }}>↔</span>
              <span>docs/API_Contract.md</span>
            </div>
            <div style={{ background: 'var(--bg-sunken)', borderRadius: 'var(--r-xs)', overflow: 'hidden', fontFamily: 'var(--font-mono)', fontSize: 11, marginBottom: 12 }}>
              <div style={{ padding: '3px 10px', color: 'oklch(0.55 0.12 25)', background: 'color-mix(in oklab, var(--critical) 10%, transparent)' }}>
                − authenticate(user, token)
              </div>
              <div style={{ padding: '3px 10px', color: 'oklch(0.45 0.1 150)', background: 'color-mix(in oklab, var(--success) 10%, transparent)' }}>
                + authenticate(user, token, *, scope=None)
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px', background: 'color-mix(in oklab, var(--accent) 8%, var(--bg-sunken))', borderRadius: 'var(--r-xs)', borderLeft: '2px solid var(--accent)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" style={{ width: 12, height: 12, color: 'var(--accent)', flexShrink: 0, marginTop: 2 }}>
                <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.5 5.5l2.8 2.8M15.7 15.7l2.8 2.8M5.5 18.5l2.8-2.8M15.7 8.3l2.8-2.8" />
              </svg>
              <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 12.5, lineHeight: 1.5, color: 'var(--ink-2)', margin: 0 }}>
                "Add the optional keyword-only <code style={{ fontStyle: 'normal', fontFamily: 'var(--font-mono)', fontSize: 11 }}>scope</code> parameter to the authentication section."
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="auth-hero-stats">
          {[
            { label: 'Repos watched', val: '1,284' },
            { label: 'Mismatches caught', val: '38.7K' },
            { label: 'Median scan', val: '18s' },
          ].map(({ label, val }) => (
            <div key={label}>
              <div className="stat-label">{label}</div>
              <div className="stat-val">{val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Form side ── */}
      <div className="auth-panel-side">
        <div className="auth-card">
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12 }}>
            Welcome back
          </div>
          <h2>Sign in to DocRot</h2>
          <p style={{ color: 'var(--ink-3)', fontSize: 14, marginBottom: 28 }}>
            Works on your repo&apos;s existing permissions. No extra tokens, no side channels.
          </p>

          <button
            type="button"
            className="auth-gh-btn"
            onClick={handleGitHub}
            disabled={isLoading}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 18, height: 18 }}>
              <path d="M12 .7a11.3 11.3 0 0 0-3.58 22c.57.1.78-.25.78-.55v-2.15c-3.19.7-3.87-1.36-3.87-1.36-.52-1.32-1.27-1.66-1.27-1.66-1.03-.7.08-.69.08-.69 1.15.08 1.74 1.17 1.74 1.17 1 .17 2.13.73 2.66 1.96.89 1.52 2.34 1.08 2.91.82.09-.72.35-1.21.63-1.49-2.55-.29-5.22-1.28-5.22-5.7 0-1.26.45-2.28 1.17-3.08-.12-.28-.51-1.44.11-2.99 0 0 .96-.31 3.14 1.17a10.8 10.8 0 0 1 5.72 0c2.18-1.48 3.13-1.17 3.13-1.17.63 1.55.24 2.71.12 2.99.73.8 1.17 1.82 1.17 3.08 0 4.43-2.68 5.4-5.24 5.69.42.36.78 1.05.78 2.14v3.17c0 .31.2.66.79.55A11.3 11.3 0 0 0 12 .7Z" />
            </svg>
            {isLoading ? 'Signing in…' : 'Continue with GitHub'}
          </button>

          {error ? <p className="auth-error">{error}</p> : null}

          {/* Feature list */}
          <div className="auth-feature-list">
            {[
              'Automatic scan on every push — no config required',
              'AI-drafted fixes for every mismatch found',
              'GitHub issue automation when docs fall behind',
            ].map((text) => (
              <div key={text} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: 14, height: 14, color: 'var(--success)', flexShrink: 0, marginTop: 2 }}>
                  <path d="M5 13l4 4L19 7" />
                </svg>
                <span style={{ fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.45 }}>{text}</span>
              </div>
            ))}
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
