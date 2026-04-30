import { useEffect, useState, type ReactNode } from 'react'
import type { User } from 'firebase/auth'
import { firebaseConfigured, firebaseMissingEnvKeys, localPreviewMode } from './firebase'
import { DashboardPage } from './pages/DashboardPage'
import { ProjectsPage } from './pages/ProjectsPage'
import { IssuesPage } from './pages/IssuesPage'
import { ScanHistoryPage } from './pages/ScanHistoryPage'
import { ConfigurationPage } from './pages/ConfigurationPage'
import { AuthProvider, useAuth } from './auth/AuthContext'
import { AuthPage } from './pages/AuthPage'
import { UserSettingsWireframePage } from './pages/UserSettingsWireframePage'
import { setGithubUsernameFilter } from './api/firestore'
import { SettingsProvider } from './context/SettingsContext'
import { TweaksPanel } from './components/TweaksPanel'

import './App.css'

type PageKey =
  | 'dashboard'
  | 'projects'
  | 'issues'
  | 'configuration'
  | 'wf-user-settings'
  | 'scanHistory'

const githubHandlePattern = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i

function normalizeHandle(value: string | null | undefined): string | null {
  const normalized = value?.trim().toLowerCase() ?? ''
  return githubHandlePattern.test(normalized) ? normalized : null
}

function extractGitHubUsername(user: User): string | null {
  const stored = normalizeHandle(localStorage.getItem('docrot_github_username'))
  if (stored) return stored

  const rawUser = user as unknown as {
    reloadUserInfo?: { screenName?: unknown; screen_name?: unknown; login?: unknown }
  }

  const reloadScreenName = rawUser.reloadUserInfo?.screenName
  if (typeof reloadScreenName === 'string') {
    const parsed = normalizeHandle(reloadScreenName)
    if (parsed) return parsed
  }

  const reloadSnakeScreenName = rawUser.reloadUserInfo?.screen_name
  if (typeof reloadSnakeScreenName === 'string') {
    const parsed = normalizeHandle(reloadSnakeScreenName)
    if (parsed) return parsed
  }

  const reloadLogin = rawUser.reloadUserInfo?.login
  if (typeof reloadLogin === 'string') {
    const parsed = normalizeHandle(reloadLogin)
    if (parsed) return parsed
  }

  const githubProviderInfo = user.providerData.find((p) => p.providerId === 'github.com')
  const providerDisplayName = normalizeHandle(githubProviderInfo?.displayName)
  if (providerDisplayName) return providerDisplayName

  const email = user.email ?? ''
  const noreplyMatch = email.match(/^\d+\+([a-z\d-]+)@users\.noreply\.github\.com$/i)
  if (noreplyMatch?.[1]) {
    const parsed = normalizeHandle(noreplyMatch[1])
    if (parsed) return parsed
  }

  return null
}

async function resolveGitHubUsername(user: User): Promise<string | null> {
  const extracted = extractGitHubUsername(user)
  if (extracted) return extracted

  const githubProviderInfo = user.providerData.find((p) => p.providerId === 'github.com')
  const githubUid = githubProviderInfo?.uid ?? ''
  if (!/^\d+$/.test(githubUid)) return null

  try {
    const response = await fetch(`https://api.github.com/user/${githubUid}`)
    if (!response.ok) return null
    const payload = (await response.json()) as { login?: unknown }
    return typeof payload.login === 'string' ? normalizeHandle(payload.login) : null
  } catch {
    return null
  }
}

function NavIcon({ children }: { children: ReactNode }) {
  return (
    <span className="app-nav-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        {children}
      </svg>
    </span>
  )
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M6.5 9a5.5 5.5 0 1 1 11 0c0 5.5 2 6.5 2 6.5h-15S6.5 14.5 6.5 9Z" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </svg>
  )
}

function AppShell() {
  const { user, logout } = useAuth()

  const [activePage, setActivePage] = useState<PageKey>('dashboard')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [focusedScanId, setFocusedScanId] = useState<string | null>(null)
  const [tweaksOpen, setTweaksOpen] = useState(false)

  const navigateToPage = (page: PageKey) => {
    if (page === 'issues') {
      setFocusedScanId(null)
    }
    setActivePage(page)
  }

  const openHistory = (scanId?: string) => {
    setFocusedScanId(scanId ?? null)
    setActivePage('scanHistory')
  }

  const openIssues = (scanId?: string) => {
    setFocusedScanId(scanId ?? null)
    setActivePage('issues')
  }

  const openProjects = () => {
    setActivePage('projects')
  }

  const navItems: Array<{ key: PageKey; label: string; icon: React.ReactNode }> = [
    {
      key: 'dashboard',
      label: 'Dashboard',
      icon: (
        <NavIcon>
          <path d="M4 13h6V4H4z" />
          <path d="M14 20h6v-9h-6z" />
          <path d="M14 10h6V4h-6z" />
          <path d="M4 20h6v-5H4z" />
        </NavIcon>
      ),
    },
    {
      key: 'projects',
      label: 'Projects',
      icon: (
        <NavIcon>
          <path d="M3.5 8h6l1.7 2H20v8a2 2 0 0 1-2 2H5.5a2 2 0 0 1-2-2z" />
        </NavIcon>
      ),
    },
    {
      key: 'issues',
      label: 'Issues',
      icon: (
        <NavIcon>
          <circle cx="12" cy="12" r="8" />
          <path d="M12 8v5" />
          <path d="M12 16h.01" />
        </NavIcon>
      ),
    },
    {
      key: 'scanHistory',
      label: 'Scan History',
      icon: (
        <NavIcon>
          <path d="M12 8v5l3 2" />
          <circle cx="12" cy="12" r="8" />
        </NavIcon>
      ),
    },
    {
      key: 'configuration',
      label: 'Configuration',
      icon: (
        <NavIcon>
          <path d="M12 3v3" />
          <path d="M12 18v3" />
          <path d="M4.9 4.9l2.1 2.1" />
          <path d="M17 17l2.1 2.1" />
          <path d="M3 12h3" />
          <path d="M18 12h3" />
          <path d="M4.9 19.1 7 17" />
          <path d="M17 7l2.1-2.1" />
          <circle cx="12" cy="12" r="3" />
        </NavIcon>
      ),
    },
  ]

  let pageTitle = 'Dashboard'
  let pageContent: React.ReactNode = (
    <DashboardPage
      onOpenHistory={openHistory}
      onOpenIssues={() => openIssues()}
      onOpenProjects={openProjects}
      userName={user?.displayName ?? user?.email ?? (localPreviewMode ? 'Local preview' : 'User')}
    />
  )

  if (activePage === 'projects') {
    pageTitle = 'Projects'
    pageContent = <ProjectsPage onInspectProject={openHistory} />
  }

  if (activePage === 'issues') {
    pageTitle = 'Issues'
    pageContent = (
      <IssuesPage
        scanId={focusedScanId}
        onOpenHistory={() => openHistory(focusedScanId ?? undefined)}
      />
    )
  }

  if (activePage === 'scanHistory') {
    pageTitle = 'Scan History'
    pageContent = (
      <ScanHistoryPage
        initialSelectedScanId={focusedScanId}
        onOpenIssuesForScan={(scanId) => openIssues(scanId)}
      />
    )
  }

  if (activePage === 'configuration') {
    pageTitle = 'Configuration'
    pageContent = <ConfigurationPage />
  }

  if (activePage === 'wf-user-settings') {
    pageTitle = 'User Settings'
    pageContent = <UserSettingsWireframePage />
  }

  return (
    <div className="shell" data-sidebar={sidebarCollapsed ? 'collapsed' : undefined}>
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div
            className="sidebar-brand-mark"
            aria-hidden={!sidebarCollapsed}
            onClick={sidebarCollapsed ? () => setSidebarCollapsed(false) : undefined}
            title={sidebarCollapsed ? 'Expand sidebar' : undefined}
            style={sidebarCollapsed ? { cursor: 'pointer' } : undefined}
          >
            D
          </div>
          <div className="sidebar-brand-text">
            <h1>DocRot</h1>
            <p>Detector</p>
          </div>
          <button
            type="button"
            className="sidebar-collapse-btn"
            aria-label="Collapse sidebar"
            onClick={() => setSidebarCollapsed(true)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 6l-6 6 6 6" />
            </svg>
          </button>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-section-label">Navigate</div>
          {navItems.map((item) => (
            <button
              key={item.key}
              aria-current={activePage === item.key ? 'page' : undefined}
              className={activePage === item.key ? 'nav-item active' : 'nav-item'}
              onClick={() => navigateToPage(item.key)}
              type="button"
              title={sidebarCollapsed ? item.label : undefined}
            >
              {item.icon}
              <span className="nav-item-label">{item.label}</span>
            </button>
          ))}
        </div>

        <div className="sidebar-footer">
          <button
            type="button"
            className={activePage === 'wf-user-settings' ? 'nav-item active' : 'nav-item'}
            onClick={() => navigateToPage('wf-user-settings')}
            title={sidebarCollapsed ? 'User Settings' : undefined}
          >
            <NavIcon>
              <circle cx="12" cy="8" r="3" />
              <path d="M6 19c1.4-3 3.5-4.5 6-4.5s4.6 1.5 6 4.5" />
            </NavIcon>
            <span className="nav-item-label">User Settings</span>
          </button>

          <div className="sidebar-user" style={{ marginTop: '4px' }}>
            <div className="sidebar-user-avatar">
              {user?.photoURL ? (
                <img src={user.photoURL} alt={user.displayName ?? user.email ?? ''} />
              ) : null}
            </div>
            <div className="sidebar-user-text">
              <strong>{user?.displayName ?? user?.email ?? 'User'}</strong>
              <small>{user?.email ?? ''}</small>
            </div>
          </div>

          <button
            type="button"
            className="sidebar-logout-btn"
            onClick={() => {
              localStorage.removeItem('docrot_github_username')
              logout()
            }}
            title={sidebarCollapsed ? 'Sign out' : undefined}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: 14, height: 14, flexShrink: 0 }}>
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span className="sidebar-logout-btn-text">Sign out</span>
          </button>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="topbar-crumbs">
            <span>docrot</span>
            <span className="sep">/</span>
            <span className="current">{pageTitle}</span>
          </div>

          <div className="topbar-spacer" />

          {localPreviewMode ? (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '5px 10px',
                borderRadius: 999,
                border: '1px solid color-mix(in oklab, var(--accent) 35%, transparent)',
                background: 'color-mix(in oklab, var(--accent) 12%, transparent)',
                color: 'var(--ink-2)',
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              Local preview
            </span>
          ) : null}

          <button type="button" className="icon-btn" aria-label="Notifications">
            <BellIcon />
          </button>

          <button
            type="button"
            className="icon-btn"
            aria-label="Visual settings"
            onClick={() => setTweaksOpen((v) => !v)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M21 6H9M5 6H3"/><path d="M21 12h-8M9 12H3"/><path d="M21 18H15M11 18H3"/>
              <circle cx="7" cy="6" r="2"/><circle cx="11" cy="12" r="2"/><circle cx="13" cy="18" r="2"/>
            </svg>
          </button>

        </header>

        <div className="page-viewport">{pageContent}</div>
      </main>

      <TweaksPanel open={tweaksOpen} onClose={() => setTweaksOpen(false)} />
    </div>
  )
}

function App() {
  const { user, loading } = useAuth()

  useEffect(() => {
    const currentUser = user

    if (!currentUser) {
      setGithubUsernameFilter(null)
      return
    }

    let cancelled = false

    async function hydrateGithubUsername(authenticatedUser: User) {
      const username = await resolveGitHubUsername(authenticatedUser)
      if (cancelled) {
        return
      }

      if (username) {
        localStorage.setItem('docrot_github_username', username)
      }
      setGithubUsernameFilter(username)
    }

    void hydrateGithubUsername(currentUser)

    return () => {
      cancelled = true
    }
  }, [user])

  if (!firebaseConfigured && !localPreviewMode) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: '#0b1220',
          color: '#f3f7ff',
          padding: '1.5rem',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '740px',
            border: '1px solid #1d2a43',
            borderRadius: '12px',
            background: '#111a2b',
            padding: '1.25rem 1.4rem',
          }}
        >
          <h2 style={{ marginBottom: '0.65rem' }}>Firebase environment variables are missing</h2>
          <p style={{ color: '#8ea2c1', marginBottom: '0.75rem' }}>
            Add the missing keys to <code>.env</code>, then restart the Vite dev server.
          </p>
          <pre style={{ margin: 0, color: '#dce9ff', whiteSpace: 'pre-wrap' }}>
            {firebaseMissingEnvKeys.map((key) => `${key}=...`).join('\n')}
          </pre>
        </div>
      </div>
    )
  }

  if (loading) return null

  return user || localPreviewMode ? (
    <AppShell />
  ) : (
    <AuthPage
      onAuthenticate={(username) => {
        if (username) {
          localStorage.setItem('docrot_github_username', username)
          setGithubUsernameFilter(username)
        }
      }}
    />
  )
}

export default function Root() {
  return (
    <SettingsProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </SettingsProvider>
  )
}