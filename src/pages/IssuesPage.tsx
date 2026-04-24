import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { IssueDetailPanel } from '../components/issues/IssueDetailPanel'
import { IssueTable } from '../components/issues/IssueTable'
import { useIssues } from '../hooks/useIssues'

interface IssuesPageProps {
  onOpenHistory?: () => void
  searchQuery?: string
}

const PAGE_SIZE = 25

const SORT_OPTIONS = [
  { value: 'priority', label: 'Priority' },
  { value: 'date', label: 'Date' },
  { value: 'repo', label: 'Repo' },
] as const

const STATUS_CHIPS: Array<{ key: string; label: string }> = [
  { key: 'open', label: 'Open' },
  { key: 'in-progress', label: 'In progress' },
  { key: 'all', label: 'All' },
  { key: 'closed', label: 'Closed' },
]

export function IssuesPage({ initialScanId, onOpenHistory, searchQuery }: IssuesPageProps) {
  const { issues, scanReport, loading, error, openIssues, closeIssue } = useIssues(initialScanId)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('open')
  const [sortBy, setSortBy] = useState<'priority' | 'date' | 'repo'>('date')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null)
  const [page, setPage] = useState(0)

  const activeQuery = searchQuery !== undefined && searchQuery !== '' ? searchQuery : query
  const deferredQuery = useDeferredValue(activeQuery)

  useEffect(() => { setPage(0) }, [deferredQuery, status])

  const filteredIssues = useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLowerCase()
    const priorityRank: Record<'high' | 'medium' | 'low', number> = { high: 3, medium: 2, low: 1 }

    const filtered = issues.filter((issue) => {
      const matchesStatus = status === 'all' || issue.status === status
      if (!matchesStatus) return false
      if (!normalizedQuery) return true
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
      const aTime = Date.parse(a.scanCreatedAt ?? a.updatedAt)
      const bTime = Date.parse(b.scanCreatedAt ?? b.updatedAt)
      const dateComparison = aTime - bTime
      const severityComparison = priorityRank[a.priority] - priorityRank[b.priority]
      const repoComparison = (a.repoPath ?? '').localeCompare(b.repoPath ?? '')
      let comparison = 0
      if (sortBy === 'priority') {
        comparison = severityComparison
        if (comparison === 0) {
          comparison = dateComparison
        }
      } else if (sortBy === 'repo') {
        comparison = repoComparison
        if (comparison === 0) {
          comparison = dateComparison
        }
      } else {
        comparison = dateComparison
        if (comparison === 0) {
          comparison = severityComparison
        }
      }
      if (comparison === 0) comparison = a.title.localeCompare(b.title)
      return sortDirection === 'asc' ? comparison : -comparison
    })

    return filtered
  }, [deferredQuery, issues, sortBy, sortDirection, status])

  const totalPages = Math.ceil(filteredIssues.length / PAGE_SIZE)
  const pagedIssues = filteredIssues.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const selectedIssue = filteredIssues.find((issue) => issue.id === selectedIssueId) ?? filteredIssues[0] ?? null

  return (
    <div>
      {/* Page head */}
      <div className="page-head">
        <div>
          <div className="kicker">
            {openIssues.length} open · {scanReport.highCount} critical · {scanReport.mediumCount} medium
          </div>
          <h1>Issues</h1>
          <p className="sub">
            Every place docs drifted from code.
            {scanReport.repoPath ? ` Showing results for ${scanReport.repoPath}.` : ''}
          </p>
        </div>
        <div className="page-head-actions">
          {onOpenHistory ? (
            <button type="button" className="btn" onClick={onOpenHistory}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: 14, height: 14 }}>
                <path d="M12 8v5l3 2"/><circle cx="12" cy="12" r="8"/>
              </svg>
              View Scan History
            </button>
          ) : null}
        </div>
      </div>

      {/* Summary strip */}
      <div className="issues-summary-grid">
        <div className="issues-summary-card">
          <div className="summary-icon critical">!</div>
          <div>
            <strong>{scanReport.highCount}</strong>
            <p>High Priority</p>
          </div>
        </div>
        <div className="issues-summary-card">
          <div className="summary-icon warning">!</div>
          <div>
            <strong>{scanReport.mediumCount}</strong>
            <p>Medium Priority</p>
          </div>
        </div>
        <div className="issues-summary-card">
          <div className="summary-icon info">i</div>
          <div>
            <strong>{openIssues.length}</strong>
            <p>Open Findings</p>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="issues-filterbar">
        {STATUS_CHIPS.map((chip) => (
          <button
            key={chip.key}
            type="button"
            className={`filter-chip ${status === chip.key ? 'active' : ''}`}
            onClick={() => setStatus(chip.key)}
          >
            {chip.label}
            <span className="count">
              {chip.key === 'all'
                ? issues.length
                : chip.key === 'open'
                ? openIssues.length
                : issues.filter((i) => i.status === chip.key).length}
            </span>
          </button>
        ))}

        <div style={{ flex: 1 }} />

        <div className="filter-search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="11" cy="11" r="5.5"/>
            <path d="m15 15 5 5"/>
          </svg>
          <input
            type="text"
            placeholder="Search issues…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search issues"
          />
        </div>

        <select
          className="input"
          style={{ padding: '5px 9px', fontSize: 12, borderRadius: 99 }}
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          aria-label="Sort by"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>Sort: {opt.label}</option>
          ))}
        </select>

        <button
          type="button"
          className="btn btn-sm btn-ghost"
          onClick={() => setSortDirection((d) => d === 'asc' ? 'desc' : 'asc')}
          title={sortDirection === 'asc' ? 'Ascending' : 'Descending'}
        >
          {sortDirection === 'asc' ? '↑' : '↓'}
        </button>
      </div>

      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, color: 'var(--ink-3)', marginBottom: 10, display: 'flex', justifyContent: 'space-between' }}>
        <span>Showing {filteredIssues.length} of {issues.length} issues</span>
        {error ? <span style={{ color: 'var(--critical)' }}>{error}</span> : null}
      </div>

      {/* Split workspace */}
      <div className="issues-workspace">
        <div className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {loading ? (
            <div className="page-placeholder">Loading issues from the backend…</div>
          ) : filteredIssues.length === 0 ? (
            <div className="empty">
              <h4>Nothing here.</h4>
              <p>Switch filters above or wait for the next scan to run.</p>
            </div>
          ) : (
            <>
              <IssueTable
                issues={pagedIssues}
                selectedId={selectedIssue?.id ?? null}
                onSelect={(issue) => setSelectedIssueId(issue.id)}
                onClose={closeIssue}
              />
              {totalPages > 1 ? (
                <div className="table-pagination">
                  <button
                    type="button"
                    className="btn btn-sm btn-ghost"
                    disabled={page === 0}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Previous
                  </button>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                    Page {page + 1} of {totalPages}
                  </span>
                  <button
                    type="button"
                    className="btn btn-sm btn-ghost"
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </button>
                </div>
              ) : null}
            </>
          )}
        </div>

        <IssueDetailPanel issue={selectedIssue} />
      </div>
    </div>
  )
}
