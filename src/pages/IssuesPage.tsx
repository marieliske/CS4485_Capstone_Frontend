const issueRows = [
  {
    severity: 'Critical',
    severityTone: 'critical',
    status: 'Open',
    statusTone: 'open',
    projectCode: 'AG',
    project: 'API Gateway',
    file: 'src/auth.ts',
    symbol: 'verifySession()',
    lastSync: '2 hours ago',
  },
  {
    severity: 'Warning',
    severityTone: 'warning',
    status: 'In Progress',
    statusTone: 'progress',
    projectCode: 'FC',
    project: 'Frontend Core',
    file: 'docs/setup.md',
    symbol: 'Quickstart Guide',
    lastSync: '5 hours ago',
  },
  {
    severity: 'Critical',
    severityTone: 'critical',
    status: 'Open',
    statusTone: 'open',
    projectCode: 'DA',
    project: 'Data Analytics',
    file: 'engine/compute.py',
    symbol: 'DistributedMatrix',
    lastSync: '1 day ago',
  },
  {
    severity: 'Info',
    severityTone: 'info',
    status: 'Resolved',
    statusTone: 'resolved',
    projectCode: 'AS',
    project: 'Auth Service',
    file: 'components/Button.tsx',
    symbol: 'variantProps',
    lastSync: '3 days ago',
  },
  {
    severity: 'Warning',
    severityTone: 'warning',
    status: 'Open',
    statusTone: 'open',
    projectCode: 'PB',
    project: 'Payment Bridge',
    file: 'src/oauth/provider.ts',
    symbol: 'TokenRefresh',
    lastSync: '1 week ago',
  },
] as const

const summaryCards = [
  { value: '12', label: 'Critical Rot', tone: 'critical', icon: '!' },
  { value: '28', label: 'Warning Alerts', tone: 'warning', icon: '!' },
  { value: '84%', label: 'Health Score', tone: 'info', icon: 'Z' },
] as const

const filters = ['Severity', 'Status', 'Project'] as const

export function IssuesPage() {
  return (
    <section className="issues-page">
      <header className="issues-header">
        <div>
          <p>Centralized monitoring for documentation decay across all active repositories.</p>
        </div>
        <div className="issues-header-actions">
          <button type="button" className="scan-btn">
            <span aria-hidden="true">↻</span>
            Scan Now
          </button>
          <button type="button" className="export-btn">
            <span aria-hidden="true">↓</span>
            Export
          </button>
        </div>
      </header>

      <section className="issues-filter-shell">
        <div className="issues-search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="11" cy="11" r="6.2" />
            <path d="m16 16 4.2 4.2" />
          </svg>
          <input type="text" value="Search by file or symbol..." readOnly aria-label="Search issues" />
        </div>
        <span className="issues-filter-label">Filters</span>
        {filters.map((filter) => (
          <button key={filter} type="button" className="issues-filter-btn">
            {filter}
            <span className="filter-chevron" aria-hidden="true">
              <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="m2.5 4.5 3.5 3 3.5-3" />
              </svg>
            </span>
          </button>
        ))}
      </section>

      <section className="issues-table-shell">
        <table className="issues-table">
          <thead>
            <tr>
              <th>Severity</th>
              <th>Status</th>
              <th>Project</th>
              <th>File / Symbol</th>
              <th>Last Sync</th>
            </tr>
          </thead>
          <tbody>
            {issueRows.map((issue) => (
              <tr key={`${issue.project}-${issue.file}`}>
                <td>
                  <span className={`issue-severity-pill ${issue.severityTone}`}>● {issue.severity}</span>
                </td>
                <td>
                  <span className={`issue-status-pill ${issue.statusTone}`}>{issue.status}</span>
                </td>
                <td>
                  <span className="issue-project-chip">
                    <span className="issue-project-code">{issue.projectCode}</span>
                    {issue.project}
                  </span>
                </td>
                <td>
                  <div className="issue-file-cell">
                    <strong>{issue.file}</strong>
                    <small>{issue.symbol}</small>
                  </div>
                </td>
                <td className="issue-last-sync">{issue.lastSync}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <footer className="issues-table-footer">
          <span>Showing 1 to 5 of 42 issues</span>
          <div className="issues-pagination">
            <button type="button" aria-label="Previous page">
              ‹
            </button>
            <button type="button" className="active" aria-current="page">
              1
            </button>
            <button type="button">2</button>
            <button type="button">3</button>
            <button type="button">...</button>
            <button type="button">9</button>
            <button type="button" aria-label="Next page">
              ›
            </button>
          </div>
        </footer>
      </section>

      <div className="issues-summary-grid">
        {summaryCards.map((card) => (
          <article key={card.label} className="issues-summary-card">
            <span className={`summary-icon ${card.tone}`}>{card.icon}</span>
            <div>
              <strong>{card.value}</strong>
              <p>{card.label}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
