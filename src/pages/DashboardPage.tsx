import { useIssues } from '../hooks/useIssues'
import { formatDate } from '../utils/date'
import type { Report } from '../types/report'

interface DashboardPageProps {
  onReviewIssue?: (issueId: string) => void
  selectedReport: Report | null
}

function severityFromPriority(priority: 'high' | 'medium' | 'low') {
  if (priority === 'high') {
    return { label: 'Critical', className: 'critical' }
  }
  if (priority === 'medium') {
    return { label: 'Moderate', className: 'moderate' }
  }
  return { label: 'Low', className: 'low' }
}

export function DashboardPage({ onReviewIssue, selectedReport }: DashboardPageProps) {
  const { issues, openIssues, scanReport } = useIssues()

  const highPriority = issues.filter((issue) => issue.priority === 'high').length
  const closedIssues = issues.filter((issue) => issue.status === 'closed').length

  const scanStats = [
    {
      label: 'Total Scanned',
      value: Number.parseInt(scanReport.totalIssues.toString(), 10) * 312,
      delta: '+5%',
      deltaClass: 'positive',
    },
    { label: 'Added', value: '42', delta: '+2%', deltaClass: 'positive' },
    { label: 'Removed', value: '12', delta: '-1%', deltaClass: 'negative' },
    { label: 'Changed', value: '89', delta: '+8%', deltaClass: 'positive' },
    {
      label: 'Unchanged',
      value: Number.parseInt(scanReport.totalIssues.toString(), 10) * 276 + 1,
      delta: '0%',
      deltaClass: 'neutral',
    },
  ]

  const issueSummary = [
    { label: 'Detected Issues', value: issues.length },
    { label: 'Flagged for Review', value: openIssues.length },
    { label: 'High Severity', value: highPriority },
    { label: 'Resolved in Docs', value: closedIssues },
  ]

  const feedRows = issues.map((issue) => {
    const severityInfo = severityFromPriority(issue.priority)
    const fileName = issue.codeFile.split('/').pop() || issue.codeFile

    return {
      id: issue.id,
      issueNumber: issue.issueNumber,
      fileName,
      reason: issue.reason,
      symbol: issue.symbol,
      severity: severityInfo.label,
      severityClass: severityInfo.className,
      score: issue.cumulativeScore ? `${issue.cumulativeScore}/8` : `${issue.score}/8`,
      suggestion: issue.suggestion,
    }
  })

  return (
    <section className="dashboard-screen">
      <header className="dashboard-intro">
        <h3>Scan Results</h3>
        <p>Documentation health overview and recent repository alerts.</p>
        <div className="dashboard-report-meta">
          {selectedReport ? (
            <span>
              Viewing Report: {selectedReport.name} ({formatDate(selectedReport.createdAt)})
            </span>
          ) : null}
          <span>Repo: {scanReport.repoPath}</span>
          <span>Commit: {scanReport.commitHash}</span>
          <span>Time: {new Date(scanReport.scannedAt).toLocaleString()}</span>
          <span>
            Issues: {scanReport.totalIssues} total (High: {scanReport.highCount}, Medium:{' '}
            {scanReport.mediumCount}, Low: {scanReport.lowCount})
          </span>
        </div>
      </header>

      <div className="scan-stats-grid">
        {scanStats.map((stat) => (
          <article key={stat.label} className="scan-stat-card">
            <p className="scan-stat-label">{stat.label}</p>
            <div className="scan-stat-value-row">
              <strong>{stat.value}</strong>
              <span className={`scan-stat-delta ${stat.deltaClass}`}>{stat.delta}</span>
            </div>
          </article>
        ))}
      </div>

      <section className="dashboard-panel">
        <div className="dashboard-panel-head">
          <h4>Alert Feed</h4>
          <div className="dashboard-panel-actions">
            <button type="button" className="dashboard-small-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M4 5h16l-6 7v5l-4 2v-7z" />
              </svg>
              Filter
            </button>
            <button type="button" className="dashboard-small-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M12 4v10" />
                <path d="m8 10 4 4 4-4" />
                <path d="M4 19h16" />
              </svg>
              Export
            </button>
          </div>
        </div>

        <div className="dashboard-feed-table-wrap">
          <table className="dashboard-feed-table">
            <thead>
              <tr>
                <th>Document Filename</th>
                <th>Reason</th>
                <th>Symbol</th>
                <th>Severity</th>
                <th>Cumulative Score</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {feedRows.map((row) => (
                <tr
                  key={row.id}
                  className="dashboard-feed-row-clickable"
                  onClick={() => onReviewIssue?.(row.id)}
                >
                  <td>
                    <strong>{row.fileName}</strong>
                    <p className="dashboard-feed-hint">Issue #{row.issueNumber}</p>
                  </td>
                  <td>{row.reason}</td>
                  <td>{row.symbol}</td>
                  <td>
                    <span className={`severity-pill ${row.severityClass}`}>{row.severity}</span>
                  </td>
                  <td>{row.score}</td>
                  <td>
                    <button
                      className="review-btn"
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation()
                        onReviewIssue?.(row.id)
                      }}
                    >
                      Review Evidence
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="dashboard-feed-footer">
          <span>Showing {feedRows.length} of {scanReport.totalIssues} flagged files</span>
          <div className="dashboard-pagination">
            <button type="button" className="pager-btn" disabled>
              Prev
            </button>
            <button type="button" className="pager-btn active">
              Next
            </button>
          </div>
        </div>
      </section>

      <section className="dashboard-secondary-metrics">
        <h4>Issue Summary</h4>
        <div className="stats-grid">
          {issueSummary.map((item) => (
            <article key={item.label} className="card stat-card">
              <h3 className="card-title">{item.label}</h3>
              <p className="stat-value">{item.value}</p>
            </article>
          ))}
        </div>
      </section>

    </section>
  )
}
