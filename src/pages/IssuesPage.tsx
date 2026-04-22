import { useDeferredValue, useMemo, useState } from 'react'
import { IssueDetailPanel } from '../components/issues/IssueDetailPanel'
import { IssueFilters } from '../components/issues/IssueFilters'
import { IssueTable } from '../components/issues/IssueTable'
import { Card } from '../components/shared/Card'
import { useIssues } from '../hooks/useIssues'

interface IssuesPageProps {
  initialScanId?: string | null
  onOpenHistory?: () => void
}

export function IssuesPage({ initialScanId, onOpenHistory }: IssuesPageProps) {
  const { issues, scanReport, loading, error, openIssues } = useIssues(initialScanId)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('open')
  const [sortBy, setSortBy] = useState<'priority' | 'date' | 'repo'>('priority')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null)

  const deferredQuery = useDeferredValue(query)

  const filteredIssues = useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLowerCase()
    const priorityRank: Record<'high' | 'medium' | 'low', number> = {
      high: 3,
      medium: 2,
      low: 1,
    }

    const filtered = issues.filter((issue) => {
      const matchesStatus = status === 'all' || issue.status === status
      if (!matchesStatus) {
        return false
      }

      if (!normalizedQuery) {
        return true
      }

      return [
        issue.title,
        issue.codeElement,
        issue.sourcePath,
        issue.docPath,
        issue.docSection,
        issue.symbol,
        issue.repoPath ?? '',
      ].some((value) => value.toLowerCase().includes(normalizedQuery))
    })

    filtered.sort((a, b) => {
      let comparison = 0

      if (sortBy === 'priority') {
        comparison = priorityRank[a.priority] - priorityRank[b.priority]
      } else if (sortBy === 'repo') {
        comparison = (a.repoPath ?? '').localeCompare(b.repoPath ?? '')
      } else {
        const aTime = Date.parse(a.scanCreatedAt ?? a.updatedAt)
        const bTime = Date.parse(b.scanCreatedAt ?? b.updatedAt)
        comparison = aTime - bTime
      }

      if (comparison === 0) {
        comparison = a.title.localeCompare(b.title)
      }

      return sortDirection === 'asc' ? comparison : -comparison
    })

    return filtered
  }, [deferredQuery, issues, sortBy, sortDirection, status])

  const selectedIssue = filteredIssues.find((issue) => issue.id === selectedIssueId) ?? filteredIssues[0] ?? null

  const summaryCards = [
    { value: `${scanReport.highCount}`, label: 'High Priority', tone: 'critical', icon: '!' },
    { value: `${scanReport.mediumCount}`, label: 'Medium Priority', tone: 'warning', icon: '!' },
    { value: `${openIssues.length}`, label: 'Open Findings', tone: 'info', icon: 'i' },
  ] as const

  return (
    <section className="issues-page">
      <header className="issues-header">
        <div>
          <p>Live mismatch review for the latest available scan results.</p>
          <div className="issues-context-meta">
            <span>Repo: {scanReport.repoPath}</span>
            <span>Commit: {scanReport.commitHash}</span>
            <span> 
              Latest run:{' '}
              {scanReport.scannedAt ? new Date(scanReport.scannedAt).toLocaleString() : 'Not available'}
            </span>
          </div>
        </div>
        <div className="issues-header-actions">
          {onOpenHistory ? (
            <button type="button" className="export-btn" onClick={onOpenHistory}>
              View Scan History
            </button>
          ) : null}
          <button type="button" className="scan-btn" onClick={onOpenHistory}>
            Refresh Context
          </button>
        </div>
      </header>

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

      <Card className="issues-filter-card">
        <IssueFilters
          query={query}
          status={status}
          sortBy={sortBy}
          sortDirection={sortDirection}
          onQueryChange={setQuery}
          onStatusChange={setStatus}
          onSortByChange={setSortBy}
          onSortDirectionChange={setSortDirection}
        />
        <div className="issues-filter-meta">
          <span>
            Showing {filteredIssues.length} of {issues.length} issues
          </span>
          {error ? <span className="issues-inline-error">{error}</span> : null}
        </div>
      </Card>

      <div className="issues-workspace">
        <section className="issues-table-shell issues-table-panel">
          {loading ? (
            <div className="page-placeholder">Loading issues from the backend…</div>
          ) : filteredIssues.length === 0 ? (
            <div className="page-placeholder">No issues match your current filters.</div>
          ) : (
            <IssueTable issues={filteredIssues} onSelect={(issue) => setSelectedIssueId(issue.id)} />
          )}
        </section>

        <IssueDetailPanel issue={selectedIssue} />
      </div>
    </section>
  )
}
