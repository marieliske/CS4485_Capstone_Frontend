import { startTransition, useEffect, useMemo, useState, type ReactNode } from 'react'
import { onAuthStateChanged, signOut, type User } from 'firebase/auth'
import { auth, firebaseConfigured, firebaseInvalidEnvIssues, firebaseMissingEnvKeys } from './firebase'
import { setGithubUsernameFilter } from './api/firestore'
import { DashboardPage } from './pages/DashboardPage'
import { ProjectsPage } from './pages/ProjectsPage'
import { IssuesPage } from './pages/IssuesPage'
import { ScanHistoryPage } from './pages/ScanHistoryPage'
import { ConfigurationPage } from './pages/ConfigurationPage'
import { AuthPage, type AuthMode } from './pages/AuthPage'
import { UserSettingsWireframePage } from './pages/UserSettingsWireframePage'
import './App.css'

type PageKey =
  | 'dashboard'
  | 'projects'
  | 'issues'
  | 'history'
  | 'configuration'
  | 'wf-user-settings'

const pageLabels: Record<PageKey, string> = {
  dashboard: 'Dashboard Overview',
  projects: 'Projects',
  issues: 'Issues',
  history: 'Scan History',
  configuration: 'Configuration',
  'wf-user-settings': 'User Settings',
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

const navItems: Array<{ key: PageKey; label: string; icon: ReactNode }> = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    icon: (
      <NavIcon>
        <rect x="4" y="4" width="7" height="7" rx="1.3" />
        <rect x="13" y="4" width="7" height="7" rx="1.3" />
        <rect x="4" y="13" width="7" height="7" rx="1.3" />
        <rect x="13" y="13" width="7" height="7" rx="1.3" />
      </NavIcon>
    ),
  },
  {
    key: 'projects',
    label: 'Projects',
    icon: (
      <NavIcon>
        <path d="M3.5 7.5h6l2 2h9v8a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z" />
      </NavIcon>
    ),
  },
  {
    key: 'issues',
    label: 'Issues',
    icon: (
      <NavIcon>
        <path d="M12 4 21 19H3z" />
        <path d="M12 9v4M12 16h.01" />
      </NavIcon>
    ),
  },
  {
    key: 'history',
    label: 'Scan History',
    icon: (
      <NavIcon>
        <path d="M12 3a9 9 0 1 1-6.4 2.6" />
        <path d="M12 7v5l3 2" />
      </NavIcon>
    ),
  },
  {
    key: 'configuration',
    label: 'Configuration',
    icon: (
      <NavIcon>
        <circle cx="12" cy="12" r="3.2" />
        <path d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2M5.7 5.7l1.6 1.6M16.7 16.7l1.6 1.6M18.3 5.7l-1.6 1.6M7.3 16.7l-1.6 1.6" />
      </NavIcon>
    ),
  },
]

function App() {
  const [activePage, setActivePage] = useState<PageKey>('dashboard')
  const [user, setUser] = useState<User | null>(null)
  const [githubUsername, setGithubUsername] = useState<string | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [authMode, setAuthMode] = useState<AuthMode>('sign-in')
  const [focusedScanId, setFocusedScanId] = useState<string | null>(null)

  useEffect(() => {
    if (!firebaseConfigured) {
      setAuthLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser)
      // For returning users, try to extract GitHub username from provider data
      if (firebaseUser && !githubUsername) {
        const ghProvider = firebaseUser.providerData.find((p) => p.providerId === 'github.com')
        if (ghProvider) {
          const stored = localStorage.getItem('docrot_github_username')
          if (stored) {
            setGithubUsername(stored)
            setGithubUsernameFilter(stored)
          }
        }
      }
      if (!firebaseUser) {
        setGithubUsernameFilter(null)
      }
      setAuthLoading(false)
    })
    return unsubscribe
  }, [])

  const navigateToPage = (page: PageKey) => {
    startTransition(() => {
      setActivePage(page)
    })
  }

  const openHistory = (scanId?: string) => {
    startTransition(() => {
      setFocusedScanId(scanId ?? null)
      setActivePage('history')
    })
  }

  const openIssues = (scanId?: string) => {
    startTransition(() => {
      setFocusedScanId(scanId ?? null)
      setActivePage('issues')
    })
  }

  const pageContent = useMemo(() => {
    switch (activePage) {
      case 'wf-user-settings':
        return <UserSettingsWireframePage />
      case 'projects':
        return <ProjectsPage onInspectProject={openHistory} />
      case 'issues':
        return (
          <IssuesPage
            key={`issues-${focusedScanId ?? 'all'}`}
            initialScanId={focusedScanId}
            onOpenHistory={() => openHistory(focusedScanId ?? undefined)}
          />
        )
      case 'history':
        return (
          <ScanHistoryPage
            key={`history-${focusedScanId ?? 'all'}`}
            initialSelectedScanId={focusedScanId}
            onOpenIssuesForScan={openIssues}
          />
        )
      case 'configuration':
        return <ConfigurationPage />
      case 'dashboard':
      default:
        return (
          <DashboardPage
            onOpenHistory={openHistory}
            onOpenIssues={() => openIssues()}
            onOpenProjects={() => navigateToPage('projects')}
            userName={user?.displayName ?? user?.email?.split('@')[0] ?? undefined}
          />
        )
    }
  }, [activePage, focusedScanId])

  if (authLoading) {
    return <div className="page-placeholder" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#8ea2c1' }}>Loading...</div>
  }

  if (!firebaseConfigured) {
    const hasMissingKeys = firebaseMissingEnvKeys.length > 0

    return (
      <div
        className="page-placeholder"
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
          <h2 style={{ marginBottom: '0.65rem' }}>
            {hasMissingKeys ? 'Firebase environment variables are missing' : 'Firebase environment variables are invalid'}
          </h2>
          {hasMissingKeys ? (
            <>
              <p style={{ color: '#8ea2c1', marginBottom: '0.75rem' }}>
                Add the missing keys to <code>.env.local</code>, then restart the Vite dev server.
              </p>
              <pre style={{ margin: 0, color: '#dce9ff', whiteSpace: 'pre-wrap' }}>
{firebaseMissingEnvKeys
  .map((key) => `VITE_FIREBASE_${key.replace(/[A-Z]/g, (m) => `_${m}`).toUpperCase().replace(/^_/, '')}=...`)
  .join('\n')}
              </pre>
            </>
          ) : (
            <>
              <p style={{ color: '#8ea2c1', marginBottom: '0.75rem' }}>
                Update invalid keys in <code>.env.local</code> and rebuild/redeploy. Firebase OAuth redirects rely on a valid auth domain.
              </p>
              <pre style={{ margin: 0, color: '#dce9ff', whiteSpace: 'pre-wrap' }}>
{firebaseInvalidEnvIssues.join('\n')}
              </pre>
            </>
          )}
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <AuthPage
        mode={authMode}
        onAuthenticate={(username) => {
          if (username) {
            setGithubUsername(username)
            setGithubUsernameFilter(username)
            localStorage.setItem('docrot_github_username', username)
          }
          startTransition(() => {
            setActivePage('dashboard')
            setAuthMode('sign-in')
            setFocusedScanId(null)
          })
        }}
        onModeChange={setAuthMode}
      />
    )
  }

  const topbarSearchValue =
    activePage === 'projects'
      ? 'Quick search...'
      : activePage === 'configuration'
        ? 'Search config...'
        : activePage === 'wf-user-settings'
          ? 'Search user settings...'
          : 'Search documentation...'

 return (
  <div className="app-shell">
    <aside className="app-sidebar">
      <div className="app-brand">
        <span className="app-brand-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="12" cy="12" r="8" />
            <path d="M12 8v8" />
            <path d="M8 12h8" />
          </svg>
        </span>
        <div>
          <h1>DocRot</h1>
          <p>Detector Admin</p>
        </div>
      </div>

      <nav className="app-nav">
        {navItems.map((item) => (
          <button
            key={item.key}
            aria-current={activePage === item.key ? 'page' : undefined}
            className={activePage === item.key ? 'app-nav-link active' : 'app-nav-link'}
            onClick={() => navigateToPage(item.key)}
            type="button"
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="app-sidebar-footer">
        <button
          type="button"
          className={activePage === 'wf-user-settings' ? 'app-nav-link active' : 'app-nav-link'}
          onClick={() => navigateToPage('wf-user-settings')}
          style={{ width: '100%', marginBottom: '0.75rem' }}
        >
          <NavIcon>
            <circle cx="12" cy="8" r="3" />
            <path d="M6 19c1.4-3 3.5-4.5 6-4.5s4.6 1.5 6 4.5" />
          </NavIcon>
          <span>User Settings</span>
        </button>

        <div className="user-row">
            <span className="avatar" aria-hidden="true" />
            <div>
              <p>{user.displayName ?? user.email ?? 'User'}</p>
              <small>{user.email ?? ''}</small>
            </div>
          </div>
          <button
            type="button"
            className="app-nav-link"
            onClick={() => { localStorage.removeItem('docrot_github_username'); setGithubUsername(null); setGithubUsernameFilter(null); void signOut(auth) }}
            style={{ marginTop: '0.5rem', width: '100%' }}
          >
            Sign Out
          </button>
        </div>
      </aside>

      <main className="app-main">
        <header className="app-topbar">
          <div className="app-topbar-title-wrap">
            <h2>{pageLabels[activePage]}</h2>
            {activePage === 'configuration' ? <span className="editor-mode-pill">Editor Mode</span> : null}
          </div>
          <div className="app-topbar-tools">
            <div className="search-shell">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="11" cy="11" r="6.2" />
                <path d="m16 16 4.2 4.2" />
              </svg>
              <input
                type="text"
                value={topbarSearchValue}
                readOnly
                aria-label={
                  activePage === 'projects'
                    ? 'Quick search'
                    : activePage === 'configuration'
                      ? 'Search configuration'
                      : activePage === 'wf-user-settings'
                        ? 'Search user settings'
                        : 'Search documentation'
                }
              />
            </div>
            {activePage === 'projects' ? (
              <button type="button" className="create-project-btn">
                + Create New Project
              </button>
            ) : activePage === 'configuration' ? (
              <>
                <button type="button" className="notification-btn" aria-label="Notifications">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M6 9a6 6 0 1 1 12 0v4l1.6 2.2H4.4L6 13z" />
                    <path d="M10.5 18a1.5 1.5 0 0 0 3 0" />
                  </svg>
                </button>
                <button type="button" className="apply-changes-btn">
                  Apply Changes
                </button>
              </>
            ) : (
              <button type="button" className="notification-btn" aria-label="Notifications">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M15 17H5.5A1.5 1.5 0 0 1 4 15.5v-5A6 6 0 0 1 10 4.6V4a2 2 0 0 1 4 0v.6" />
                  <path d="M14 12h6" />
                  <path d="M17 9v6" />
                </svg>
              </button>
            )}
          </div>
        </header>
        <section className="page-container">{pageContent}</section>
      </main>
    </div>
  )
}

export default App
