import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { IssueDetailPanel } from '../components/issues/IssueDetailPanel'
import { IssueFilters } from '../components/issues/IssueFilters'
import { IssueTable } from '../components/issues/IssueTable'
import { Card } from '../components/shared/Card'
import { useIssues } from '../hooks/useIssues'

interface IssuesPageProps {
  initialScanId?: string | null
  onOpenHistory?: () => void
  searchQuery?: string
}

const PAGE_SIZE = 25

export function IssuesPage({ initialScanId, onOpenHistory, searchQuery }: IssuesPageProps) {
  const { issues, scanReport, loading, error, openIssues, closeIssue } = useIssues(initialScanId)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null)
  const [page, setPage] = useState(0)

  const activeQuery = searchQuery !== undefined && searchQuery !== '' ? searchQuery : query
  const deferredQuery = useDeferredValue(activeQuery)

  useEffect(() => { setPage(0) }, [deferredQuery, status])

  const filteredIssues = useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLowerCase()

    return issues.filter((issue) => {
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
      ].some((value) => value.toLowerCase().includes(normalizedQuery))
    })
  }, [deferredQuery, issues, status])

  const totalPages = Math.ceil(filteredIssues.length / PAGE_SIZE)
  const pagedIssues = filteredIssues.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

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
            <span>Scanned: {new Date(scanReport.scannedAt).toLocaleString()}</span>
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
        <IssueFilters query={activeQuery} status={status} onQueryChange={setQuery} onStatusChange={setStatus} />
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
            <>
              <IssueTable issues={pagedIssues} onSelect={(issue) => setSelectedIssueId(issue.id)} onClose={closeIssue} />
              {totalPages > 1 && (
                <footer className="table-pagination">
                  <button type="button" className="btn btn-ghost" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Previous</button>
                  <span>Page {page + 1} of {totalPages}</span>
                  <button type="button" className="btn btn-ghost" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>Next</button>
                </footer>
              )}
            </>
          )}
        </section>

        <IssueDetailPanel issue={selectedIssue} />
      </div>
    </section>
  )
}
