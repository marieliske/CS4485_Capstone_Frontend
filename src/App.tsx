import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { firebaseConfigured, firebaseMissingEnvKeys } from './firebase'
import { DashboardPage } from './pages/DashboardPage'
import { ProjectsPage } from './pages/ProjectsPage'
import { IssuesPage } from './pages/IssuesPage'
import { ScanHistoryPage } from './pages/ScanHistoryPage'
import { ConfigurationPage } from './pages/ConfigurationPage'
import { AuthProvider, useAuth } from './auth/AuthContext'
import { AuthPage } from './pages/AuthPage'
import { UserSettingsWireframePage } from './pages/UserSettingsWireframePage'
import { setGithubUsernameFilter } from './api/firestore'

import './App.css'

type PageKey =
  | 'dashboard'
  | 'projects'
  | 'issues'
  | 'configuration'
  | 'wf-user-settings'
  | 'scanHistory'

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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [topbarQuery, setTopbarQuery] = useState('')
  const [focusedScanId, setFocusedScanId] = useState<string | null>(null)

  const navigateToPage = (page: PageKey) => {
    setActivePage(page)
  }

  const openHistory = (scanId?: string) => {
    setFocusedScanId(scanId ?? null)
    setActivePage('scanHistory')
  }

  const openIssues = () => {
    setFocusedScanId(null)
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
      userName={user?.displayName ?? user?.email ?? 'User'}
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
        onOpenHistory={() => openHistory(focusedScanId ?? undefined)}
      />
    )
  }

  if (activePage === 'scanHistory') {
    pageTitle = 'Scan History'
    pageContent = (
      <ScanHistoryPage
        initialSelectedScanId={focusedScanId}
        onOpenIssuesForScan={() => openIssues()}
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
    <div className={`app-shell ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <aside className="app-sidebar">
        <div className="app-brand">
          <div className="app-brand-left">
            <span className="app-brand-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <path d="M14 2v6h6" />
                <circle cx="14" cy="15.5" r="3.5" />
                <path d="M14 13.5v2l1.5 1" />
              </svg>
            </span>

            <div className="app-brand-copy">
              <h1>DocRot</h1>
              <p>Detector Admin</p>
            </div>
          </div>

          <button
            type="button"
            className="sidebar-toggle-btn"
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            onClick={() => setSidebarCollapsed((prev) => !prev)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              {sidebarCollapsed ? <path d="M9 6l6 6-6 6" /> : <path d="M15 6l-6 6 6 6" />}
            </svg>
          </button>
        </div>

        <nav className="app-nav">
          {navItems.map((item) => (
            <button
              key={item.key}
              aria-current={activePage === item.key ? 'page' : undefined}
              className={activePage === item.key ? 'app-nav-link active' : 'app-nav-link'}
              onClick={() => navigateToPage(item.key)}
              type="button"
              title={sidebarCollapsed ? item.label : undefined}
            >
              {item.icon}
              <span className="app-nav-text">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="app-sidebar-footer">
          <button
            type="button"
            className={activePage === 'wf-user-settings' ? 'app-nav-link active' : 'app-nav-link'}
            onClick={() => navigateToPage('wf-user-settings')}
            style={{ width: '100%', marginBottom: '0.75rem' }}
            title={sidebarCollapsed ? 'User Settings' : undefined}
          >
            <NavIcon>
              <circle cx="12" cy="8" r="3" />
              <path d="M6 19c1.4-3 3.5-4.5 6-4.5s4.6 1.5 6 4.5" />
            </NavIcon>
            <span className="app-nav-text">User Settings</span>
          </button>

          <div className="user-row">
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={user?.displayName ?? user?.email ?? 'User'}
                className="avatar nav-avatar"
                width="32"
                height="32"
              />
            ) : (
              <span className="avatar" aria-hidden="true" />
            )}

            <div className="user-copy">
              <p>{user?.displayName ?? user?.email ?? 'User'}</p>
              <small>{user?.email ?? ''}</small>
            </div>
          </div>

          <button
            type="button"
            className="logout-btn"
            onClick={() => {
              localStorage.removeItem('docrot_github_username')
              logout()
            }}
            title={sidebarCollapsed ? 'Sign out' : undefined}
          >
            <span className="logout-text">Sign out</span>
          </button>
        </div>
      </aside>

      <main className="app-main">
        <header className="app-topbar">
          <div className="app-topbar-title-wrap">
            <h2>{pageTitle}</h2>
          </div>

          <div className="app-topbar-tools">
            <div className="search-shell">
              <SearchIcon />
              <input
                type="text"
                placeholder={`Search ${pageTitle.toLowerCase()}`}
                value={topbarQuery}
                onChange={(event) => setTopbarQuery(event.target.value)}
                aria-label={`Search ${pageTitle}`}
              />
            </div>

            <button type="button" className="notification-btn" aria-label="Notifications">
              <BellIcon />
            </button>

            {topbarPrimaryAction ? (
              <button
                type="button"
                className={topbarPrimaryAction.className}
                onClick={topbarPrimaryAction.onClick}
              >
                {topbarPrimaryAction.label}
              </button>
            ) : null}
          </div>
        </header>

        <div className="page-container">{pageContent}</div>
      </main>
    </div>
  )
}

function App() {
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!user) {
      setGithubUsernameFilter(null)
      return
    }

    const storedUsername = localStorage.getItem('docrot_github_username')
    const normalizedUsername = storedUsername?.trim() || null
    setGithubUsernameFilter(normalizedUsername)
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
    <AuthProvider>
      <App />
    </AuthProvider>
  )
}