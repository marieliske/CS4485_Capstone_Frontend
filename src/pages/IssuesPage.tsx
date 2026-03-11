import { useEffect, useMemo, useState } from 'react'
import { Spinner } from '../components/shared/Spinner'
import { useIssues } from '../hooks/useIssues'
import type { Issue } from '../types/issue'

type Severity = 'critical' | 'major' | 'minor' | 'info'

interface IssuesPageProps {
  initialIssueId?: string | null
}

function mapSeverity(issue: Issue): Severity {
  if (issue.priority === 'high') {
    return issue.score >= 15 ? 'critical' : 'major'
  }
  if (issue.priority === 'medium') {
    return 'minor'
  }
  return 'info'
}

function severityScore(severity: Severity): number {
  switch (severity) {
    case 'critical':
      return 8.5
    case 'major':
      return 5.2
    case 'minor':
      return 3.0
    case 'info':
    default:
      return 0.8
  }
}

function severityLabel(severity: Severity): string {
  return severity.toUpperCase()
}

export function IssuesPage({ initialIssueId }: IssuesPageProps) {
  const { issues, loading, error, scanReport } = useIssues()
  const [query, setQuery] = useState('')
  const [severityFilter, setSeverityFilter] = useState<'all' | Severity>('all')
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(issues[0]?.id ?? null)

  useEffect(() => {
    if (initialIssueId) {
      setSelectedIssueId(initialIssueId)
    }
  }, [initialIssueId])

  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      const normalizedQuery = query.toLowerCase()
      const matchesQuery =
        issue.title.toLowerCase().includes(normalizedQuery) ||
        issue.symbol.toLowerCase().includes(normalizedQuery) ||
        issue.codeFile.toLowerCase().includes(normalizedQuery) ||
        issue.reason.toLowerCase().includes(normalizedQuery)
      const severity = mapSeverity(issue)
      const matchesSeverity = severityFilter === 'all' ? true : severity === severityFilter
      return matchesQuery && matchesSeverity
    })
  }, [issues, query, severityFilter])

  const alertScore = useMemo(() => {
    const total = filteredIssues.reduce((sum, issue) => {
      const severity = mapSeverity(issue)
      return sum + severityScore(severity)
    }, 0)
    return Math.max(0.5, Number((total / Math.max(filteredIssues.length, 1)).toFixed(1)))
  }, [filteredIssues])

  const selectedIssue =
    filteredIssues.find((issue) => issue.id === selectedIssueId) ?? filteredIssues[0] ?? null

  const selectedSeverity = selectedIssue ? mapSeverity(selectedIssue) : 'info'

  return (
    <section className="alerts-page">
      <p className="alerts-breadcrumb">Alerts &gt; Scan Report Review</p>

      <header className="alerts-header">
        <div>
          <h3 className="alerts-title">
            <span className="alerts-title-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M12 4 21 19H3z" />
                <path d="M12 9v4M12 16h.01" />
              </svg>
            </span>
            Documentation Rot Scan Report
          </h3>
          <div className="alerts-meta-row">
            <span className="alerts-score-pill">Total Alert Score: {alertScore} (Critical)</span>
            <span className="alerts-meta-text">
              Repo: {scanReport.repoPath} · Commit: {scanReport.commitHash}
            </span>
          </div>
          <div className="alerts-meta-row">
            <span className="alerts-meta-text">
              Time: {new Date(scanReport.scannedAt).toLocaleString()} · Issues: {scanReport.totalIssues}{' '}
              total (High: {scanReport.highCount}, Medium: {scanReport.mediumCount}, Low:{' '}
              {scanReport.lowCount})
            </span>
          </div>
        </div>
        <button className="alerts-primary-link" type="button">
          View Full Document
        </button>
      </header>

      <div className="alerts-evidence-toolbar">
        <h4>Code Evidence</h4>
        <div className="alerts-filters">
          <input
            className="input alerts-search"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search evidence"
            value={query}
          />
          <select
            className="select alerts-severity-filter"
            onChange={(event) => setSeverityFilter(event.target.value as 'all' | Severity)}
            value={severityFilter}
          >
            <option value="all">Filter: All Severities</option>
            <option value="critical">Critical</option>
            <option value="major">Major</option>
            <option value="minor">Minor</option>
            <option value="info">Info</option>
          </select>
        </div>
      </div>

      {loading ? <Spinner /> : null}
      {error ? <p className="error-text">{error}</p> : null}

      <div className="alerts-list">
        {filteredIssues.map((issue) => {
          const severity = mapSeverity(issue)
          const score = issue.cumulativeScore ?? issue.score
          const isSelected = selectedIssueId === issue.id

          return (
            <article
              key={issue.id}
              className={isSelected ? 'alerts-item is-selected' : 'alerts-item'}
              onClick={() => setSelectedIssueId(issue.id)}
            >
              <div className={`alerts-item-icon severity-${severity}`} aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M6 6h12v12H6z" />
                  <path d="M9 12h6" />
                </svg>
              </div>

              <div className="alerts-item-content">
                <div className="alerts-item-title-row">
                  <strong>{issue.symbol}</strong>
                  <span className={`alerts-severity-badge severity-${severity}`}>
                    {severityLabel(severity)}
                  </span>
                </div>
                <div className="alerts-item-submeta">
                  <span className="alerts-blue-tag">{issue.detectorTag}</span>
                  <span className="alerts-score-tag">Score: {score}</span>
                </div>
                <p>{issue.changeSummary}</p>
                <p className="alerts-item-suggestion">Suggestion: {issue.suggestion}</p>
              </div>

              <div className="alerts-item-actions">
                <span className={`alerts-severity-dot severity-${severity}`} />
                <button className="alerts-link-out" type="button" aria-label="Open issue details">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M14 5h5v5" />
                    <path d="m10 14 9-9" />
                    <path d="M19 14v5H5V5h5" />
                  </svg>
                </button>
              </div>
            </article>
          )
        })}
      </div>

      {selectedIssue ? (
        <section className="alerts-detail-panel">
          <div className="alerts-detail-head">
            <h4>
              Issue #{selectedIssue.issueNumber} [{selectedIssue.priority.toUpperCase()}]
            </h4>
            <span className={`alerts-severity-badge severity-${selectedSeverity}`}>
              {selectedIssue.reason}
            </span>
          </div>
          <div className="alerts-detail-grid">
            <article className="alerts-detail-card">
              <p className="detail-label">Reason</p>
              <strong>{selectedIssue.reason}</strong>
            </article>
            <article className="alerts-detail-card">
              <p className="detail-label">Symbol</p>
              <strong>{selectedIssue.symbol}</strong>
            </article>
            <article className="alerts-detail-card">
              <p className="detail-label">Code File</p>
              <strong>{selectedIssue.codeFile}</strong>
            </article>
            <article className="alerts-detail-card">
              <p className="detail-label">Score</p>
              <strong>
                {selectedIssue.cumulativeScore
                  ? `Cumulative ${selectedIssue.cumulativeScore}`
                  : selectedIssue.score}
              </strong>
            </article>
          </div>
          {selectedIssue.signature ? (
            <article className="alerts-signature-block">
              <p className="detail-label">Signature</p>
              <pre>{selectedIssue.signature}</pre>
            </article>
          ) : null}
          <article className="alerts-signature-block">
            <p className="detail-label">Scan Finding</p>
            <pre>
              ! [{selectedIssue.detectorTag}] '{selectedIssue.symbol}' - {selectedIssue.changeSummary}
              {'\n'}&gt; Suggestion: {selectedIssue.suggestion}
            </pre>
          </article>
        </section>
      ) : null}
    </section>
  )
}
