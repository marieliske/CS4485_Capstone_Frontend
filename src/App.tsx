import { useEffect, useMemo, useState, type ReactNode } from 'react'
import type { User } from 'firebase/auth'
import { firebaseConfigured, firebaseMissingEnvKeys } from './firebase'
import { setGithubUsernameFilter } from './api/firestore'
import { DashboardPage } from './pages/DashboardPage'
import { ProjectsPage } from './pages/ProjectsPage'
import { IssuesPage } from './pages/IssuesPage'
import { ScanHistoryPage } from './pages/ScanHistoryPage'
import { ConfigurationPage } from './pages/ConfigurationPage'
import { AuthProvider, useAuth } from './auth/AuthContext'
import { AuthPage } from './pages/AuthPage'
import { UserSettingsWireframePage } from './pages/UserSettingsWireframePage'

import './App.css'

type PageKey =
  | 'dashboard'
  | 'projects'
  | 'issues'
  | 'history'
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
  if (stored) {
    return stored
  }

  const rawUser = user as unknown as {
    reloadUserInfo?: {
      screenName?: unknown
      screen_name?: unknown
      login?: unknown
    }
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

  const githubProviderInfo = user.providerData.find((provider) => provider.providerId === 'github.com')

  const providerDisplayName = normalizeHandle(githubProviderInfo?.displayName)
  if (providerDisplayName) {
    return providerDisplayName
  }

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
  if (extracted) {
    return extracted
  }

  const githubProviderInfo = user.providerData.find((provider) => provider.providerId === 'github.com')
  const githubUid = githubProviderInfo?.uid ?? ''
  if (!/^\d+$/.test(githubUid)) {
    return null
  }

  try {
    const response = await fetch(`https://api.github.com/user/${githubUid}`)
    if (!response.ok) {
      return null
    }

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

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="11" cy="11" r="5.5" />
      <path d="m15 15 5 5" />
    </svg>
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
  const [historyScanId, setHistoryScanId] = useState<string | null>(null)
  const [issuesScanId, setIssuesScanId] = useState<string | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [topbarQuery, setTopbarQuery] = useState('')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'dark')
    return () => { document.documentElement.removeAttribute('data-theme') }
  }, [])

  const navigateToPage = (page: PageKey) => {
    setActivePage(page)
  }

  const openHistory = (scanId?: string) => {
    setHistoryScanId(scanId ?? null)
    setActivePage('scanHistory')
  }

  const openIssues = (scanId?: string) => {
    setIssuesScanId(scanId ?? null)
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
      onOpenIssues={openIssues}
      onOpenProjects={openProjects}
      userName={user?.displayName ?? user?.email ?? 'User'}
    />
  )

  if (activePage === 'projects') {
    pageTitle = 'Projects'
    pageContent = <ProjectsPage onInspectProject={openHistory} />
  }

  if (activePage === 'issues') {
    pageTitle = 'Issues'
    pageContent = <IssuesPage initialScanId={issuesScanId} onOpenHistory={openHistory} />
  }

  if (activePage === 'scanHistory') {
    pageTitle = 'Scan History'
    pageContent = (
      <ScanHistoryPage
        initialSelectedScanId={historyScanId}
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

  const topbarPrimaryAction = useMemo(() => {
  if (activePage === 'dashboard') {
    return {
      label: '+ Create New Project',
      className: 'create-project-btn',
      onClick: () => {
        setActivePage('projects')
        window.setTimeout(() => {
          window.dispatchEvent(new CustomEvent('projects:create'))
        }, 0)
      },
    }
  }

  if (activePage === 'projects') {
    return {
      label: '+ Create New Project',
      className: 'create-project-btn',
      onClick: () => {
        window.dispatchEvent(new CustomEvent('projects:create'))
      },
    }
  }

  if (activePage === 'configuration') {
    return {
      label: 'Apply Changes',
      className: 'apply-changes-btn',
      onClick: () => {
        window.dispatchEvent(new CustomEvent('configuration:apply'))
      },
    }
  }

  return null
}, [activePage])

  return (
    <div className="shell" data-sidebar={sidebarCollapsed ? 'collapsed' : undefined}>
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-brand-mark" aria-hidden="true">D</div>
          <div className="sidebar-brand-text">
            <h1>DocRot</h1>
            <p>Detector</p>
          </div>
          <button
            type="button"
            className="sidebar-collapse-btn"
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            onClick={() => setSidebarCollapsed((prev) => !prev)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {sidebarCollapsed ? <path d="M9 6l6 6-6 6" /> : <path d="M15 6l-6 6 6 6" />}
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

          <div className="topbar-search">
            <SearchIcon />
            <input
              type="text"
              placeholder={`Search ${pageTitle.toLowerCase()}…`}
              value={topbarQuery}
              onChange={(event) => setTopbarQuery(event.target.value)}
              aria-label={`Search ${pageTitle}`}
            />
          </div>

          <button type="button" className="icon-btn" aria-label="Notifications">
            <BellIcon />
          </button>

          {topbarPrimaryAction ? (
            <button
              type="button"
              className="btn btn-accent"
              onClick={topbarPrimaryAction.onClick}
            >
              {topbarPrimaryAction.label}
            </button>
          ) : null}
        </header>

        <div className="page-viewport">{pageContent}</div>
      </main>
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

  if (!firebaseConfigured) {
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

  return user ? (
    <AppShell />
  ) : (
    <AuthPage
      onAuthenticate={(username) => {
        const normalized = normalizeHandle(username)
        if (normalized) {
          localStorage.setItem('docrot_github_username', normalized)
          setGithubUsernameFilter(normalized)
        }
      }}
    />
  )
}

export default function Root() {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  )
}