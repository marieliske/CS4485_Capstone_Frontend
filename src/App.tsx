import { useMemo, useState, type ReactNode } from 'react'
import { DashboardPage } from './pages/DashboardPage'
import { IssuesPage } from './pages/IssuesPage'
import { ReportsPage } from './pages/ReportsPage'
import { SettingsPage } from './pages/SettingsPage'
import { useReports } from './hooks/useReports'
import './App.css'

type PageKey = 'dashboard' | 'issues' | 'reports' | 'settings'

const pageLabels: Record<PageKey, string> = {
  dashboard: 'Dashboard',
  issues: 'Issues',
  reports: 'History',
  settings: 'Settings',
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
        <path d="M3 13.5 12 4l9 9.5" />
        <path d="M6 11.5V20h12v-8.5" />
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
    key: 'reports',
    label: 'History',
    icon: (
      <NavIcon>
        <path d="M6 4h8l4 4v12H6z" />
        <path d="M14 4v4h4M9 13h6M9 17h6" />
      </NavIcon>
    ),
  },
  {
    key: 'settings',
    label: 'Settings',
    icon: (
      <NavIcon>
        <circle cx="12" cy="12" r="3.2" />
        <path d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2M5.7 5.7l1.6 1.6M16.7 16.7l1.6 1.6M18.3 5.7l-1.6 1.6M7.3 16.7l-1.6 1.6" />
      </NavIcon>
    ),
  },
]

function App() {
  const { reports } = useReports()
  const [activePage, setActivePage] = useState<PageKey>('dashboard')
  const [focusedIssueId, setFocusedIssueId] = useState<string | null>(null)
  const [selectedReportId, setSelectedReportId] = useState<string | null>(reports[0]?.id ?? null)

  const selectedReport = useMemo(
    () => reports.find((report) => report.id === selectedReportId) ?? reports[0] ?? null,
    [reports, selectedReportId],
  )

  const handleDashboardReviewIssue = (issueId: string) => {
    setFocusedIssueId(issueId)
    setActivePage('issues')
  }

  const pageContent = useMemo(() => {
    switch (activePage) {
      case 'issues':
        return <IssuesPage initialIssueId={focusedIssueId} />
      case 'reports':
        return (
          <ReportsPage
            reports={reports}
            selectedReport={selectedReport}
            onSelectReport={(reportId) => setSelectedReportId(reportId)}
          />
        )
      case 'settings':
        return <SettingsPage />
      case 'dashboard':
      default:
        return <DashboardPage onReviewIssue={handleDashboardReviewIssue} selectedReport={selectedReport} />
    }
  }, [activePage, focusedIssueId, reports, selectedReport])

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="app-brand">
          <h1>DocRot Detector</h1>
          <p>CS4485 Capstone</p>
        </div>
        <nav className="app-nav">
          {navItems.map((item) => (
            <button
              key={item.key}
              aria-current={activePage === item.key ? 'page' : undefined}
              className={activePage === item.key ? 'app-nav-link active' : 'app-nav-link'}
              onClick={() => setActivePage(item.key)}
              type="button"
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <main className="app-main">
        <header className="app-topbar">
          <div>
            <h2>{pageLabels[activePage]}</h2>
            <p>Code-to-doc mismatch monitoring · Prototype mode</p>
          </div>
          <span className="status-pill">AST Scanner Active</span>
        </header>
        <section className="page-container">{pageContent}</section>
      </main>
    </div>
  )
}

export default App
