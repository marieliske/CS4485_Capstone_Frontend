import { useMemo, useState } from 'react'
import { Button } from './components/shared/Button'
import { DashboardPage } from './pages/DashboardPage'
import { IssuesPage } from './pages/IssuesPage'
import { ReportsPage } from './pages/ReportsPage'
import { SettingsPage } from './pages/SettingsPage'
import './App.css'

type PageKey = 'dashboard' | 'issues' | 'reports' | 'settings'

const pageLabels: Record<PageKey, string> = {
  dashboard: 'Documentation Drift Dashboard',
  issues: 'Mismatch Triage',
  reports: 'Scan Reports',
  settings: 'Scanner Configuration',
}

function App() {
  const [activePage, setActivePage] = useState<PageKey>('dashboard')

  const pageContent = useMemo(() => {
    switch (activePage) {
      case 'issues':
        return <IssuesPage />
      case 'reports':
        return <ReportsPage />
      case 'settings':
        return <SettingsPage />
      case 'dashboard':
      default:
        return <DashboardPage />
    }
  }, [activePage])

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="app-brand">
          <h1>DocRot Detector</h1>
          <p>CS4485 Capstone</p>
        </div>
        <nav className="app-nav">
          <Button
            className={activePage === 'dashboard' ? 'app-nav-item active' : 'app-nav-item'}
            onClick={() => setActivePage('dashboard')}
            type="button"
          >
            Dashboard
          </Button>
          <Button
            className={activePage === 'issues' ? 'app-nav-item active' : 'app-nav-item'}
            onClick={() => setActivePage('issues')}
            type="button"
          >
            Mismatches
          </Button>
          <Button
            className={activePage === 'reports' ? 'app-nav-item active' : 'app-nav-item'}
            onClick={() => setActivePage('reports')}
            type="button"
          >
            Scan Reports
          </Button>
          <Button
            className={activePage === 'settings' ? 'app-nav-item active' : 'app-nav-item'}
            onClick={() => setActivePage('settings')}
            type="button"
          >
            Configuration
          </Button>
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
