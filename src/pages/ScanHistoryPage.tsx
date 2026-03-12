const historyRows = [
  {
    scanId: '#SCN-8821',
    project: 'API Gateway',
    dateTime: 'Mar 24, 2023 14:20',
    status: 'Completed',
    statusTone: 'completed',
    mismatchCount: '0',
    mismatchTone: 'normal',
    score: '98',
    scoreWidth: '98%',
    scoreTone: 'healthy',
  },
  {
    scanId: '#SCN-8820',
    project: 'Frontend Core',
    dateTime: 'Mar 24, 2023 11:05',
    status: 'Failed',
    statusTone: 'failed',
    mismatchCount: '12',
    mismatchTone: 'critical',
    score: '45',
    scoreWidth: '45%',
    scoreTone: 'critical',
  },
  {
    scanId: '#SCN-8819',
    project: 'Data Analytics',
    dateTime: 'Mar 23, 2023 16:45',
    status: 'In Progress',
    statusTone: 'progress',
    mismatchCount: 'Processing...',
    mismatchTone: 'normal',
    score: 'TBD',
    scoreWidth: '0%',
    scoreTone: 'untracked',
  },
  {
    scanId: '#SCN-8818',
    project: 'Auth Service',
    dateTime: 'Mar 23, 2023 09:12',
    status: 'Completed',
    statusTone: 'completed',
    mismatchCount: '2',
    mismatchTone: 'normal',
    score: '88',
    scoreWidth: '88%',
    scoreTone: 'healthy',
  },
  {
    scanId: '#SCN-8817',
    project: 'Payment Bridge',
    dateTime: 'Mar 22, 2023 15:30',
    status: 'Completed',
    statusTone: 'completed',
    mismatchCount: '5',
    mismatchTone: 'normal',
    score: '72',
    scoreWidth: '72%',
    scoreTone: 'degrading',
  },
] as const

const filters = ['Project: All', 'Status: All', 'Timeframe'] as const

const summaryCards = [
  { label: 'Total Scans (30D)', value: '1,248', note: '+12%', tone: 'positive' },
  { label: 'Avg. Rot Score', value: '82.4', note: 'Industry avg: 74.0', tone: 'neutral' },
  { label: 'Success Rate', value: '96.8%', note: 'Healthy', tone: 'positive' },
] as const

export function ScanHistoryPage() {
  return (
    <section className="scan-history-page">
      <header className="scan-history-header">
        <p>Chronological log of all document integrity scans across your organization.</p>
      </header>

      <section className="scan-history-toolbar">
        <div className="scan-history-filters">
          {filters.map((filter) => (
            <button key={filter} type="button" className="scan-history-filter-btn">
              {filter}
              <span className="filter-chevron" aria-hidden="true">
                <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="m2.5 4.5 3.5 3 3.5-3" />
                </svg>
              </span>
            </button>
          ))}
        </div>
        <div className="scan-history-search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="11" cy="11" r="6.2" />
            <path d="m16 16 4.2 4.2" />
          </svg>
          <input type="text" value="Search by Scan ID or Project name..." readOnly aria-label="Search scans" />
        </div>
      </section>

      <section className="scan-history-table-shell">
        <table className="scan-history-table">
          <thead>
            <tr>
              <th>Scan ID</th>
              <th>Project</th>
              <th>Date/Time</th>
              <th>Status</th>
              <th>Mismatch Count</th>
              <th>Rot Score</th>
            </tr>
          </thead>
          <tbody>
            {historyRows.map((row) => (
              <tr key={row.scanId}>
                <td className="scan-id-cell">{row.scanId}</td>
                <td>{row.project}</td>
                <td className="scan-date-cell">{row.dateTime}</td>
                <td>
                  <span className={`scan-status-pill ${row.statusTone}`}>{row.status}</span>
                </td>
                <td className={row.mismatchTone === 'critical' ? 'scan-mismatch-critical' : undefined}>
                  {row.mismatchCount}
                </td>
                <td>
                  <div className="rot-score-cell">
                    <div className="rot-track">
                      <span className={row.scoreTone} style={{ width: row.scoreWidth }} />
                    </div>
                    <strong>{row.score}</strong>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <footer className="scan-history-footer">
          <span>Showing 1-5 of 142 scans</span>
          <div className="scan-history-pager">
            <button type="button" aria-label="Previous page">
              ‹
            </button>
            <button type="button" aria-label="Next page">
              ›
            </button>
          </div>
        </footer>
      </section>

      <div className="scan-history-summary-grid">
        {summaryCards.map((card) => (
          <article key={card.label} className="scan-history-summary-card">
            <p>{card.label}</p>
            <strong>{card.value}</strong>
            <span className={card.tone}>{card.note}</span>
          </article>
        ))}
      </div>
    </section>
  )
}
