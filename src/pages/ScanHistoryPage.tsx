import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { asObject, type JsonObject } from '../api/client'
import { getAISuggestions, getScanIssues, getScanReport, getScans, type AISuggestionRecord, type ScanIssueRecord, type ScanRecord } from '../api/scans'
import { Card } from '../components/shared/Card'

interface ScanHistoryPageProps {
  initialSelectedScanId?: string | null
  onOpenIssuesForScan?: (scanId: string) => void
  searchQuery?: string
}

interface ScanDetailState {
  scanId: string | null
  issues: ScanIssueRecord[]
  aiSuggestions: AISuggestionRecord[]
  report: JsonObject
  error: string | null
}

function toNumberValue(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function toStringValue(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

function clampScore(value?: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return 0
  }

  return Math.max(0, Math.min(100, Math.round(value)))
}

function formatDateTime(value?: string): string {
  if (!value) {
    return 'Not available'
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  return parsed.toLocaleString()
}

function getStatusTone(status?: string): 'completed' | 'failed' | 'progress' {
  if (status === 'failed') {
    return 'failed'
  }

  if (status === 'running' || status === 'queued' || status === 'in-progress') {
    return 'progress'
  }

  return 'completed'
}

function matchesQuery(scan: ScanRecord, query: string): boolean {
  return [
    scan.id ?? '',
    scan.repo_path ?? '',
    scan.commit_sha ?? '',
    scan.status ?? '',
  ].some((value) => value.toLowerCase().includes(query))
}

function summarizeIssue(record: ScanIssueRecord, index: number): string {
  const issue = asObject(record)
  return (
    toStringValue(issue.title) ||
    toStringValue(issue.message) ||
    toStringValue(issue.symbol) ||
    toStringValue(issue.code_path) ||
    `Issue ${index + 1}`
  )
}

export function ScanHistoryPage({ initialSelectedScanId, onOpenIssuesForScan, searchQuery }: ScanHistoryPageProps) {
  const [scans, setScans] = useState<ScanRecord[]>([])
  const [selectedScanId, setSelectedScanId] = useState<string | null>(initialSelectedScanId ?? null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [detailState, setDetailState] = useState<ScanDetailState>({
    scanId: null,
    issues: [],
    aiSuggestions: [],
    report: {},
    error: null,
  })

  const activeQuery = searchQuery !== undefined && searchQuery !== '' ? searchQuery : query
  const deferredQuery = useDeferredValue(activeQuery)

  useEffect(() => {
    let cancelled = false

    async function loadScans() {
      try {
        const liveScans = await getScans()
        if (cancelled) {
          return
        }

        setScans(liveScans)
        setError(liveScans.length === 0 ? 'No scans are available from the backend yet.' : null)
      } catch (err) {
        if (!cancelled) {
          setScans([])
          setError(err instanceof Error ? err.message : 'Unable to load scan history.')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadScans()

    return () => {
      cancelled = true
    }
  }, [])

  const filteredScans = useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLowerCase()

    return scans.filter((scan) => {
      const matchesStatus = statusFilter === 'all' || (scan.status ?? 'completed') === statusFilter
      if (!matchesStatus) {
        return false
      }

      if (!normalizedQuery) {
        return true
      }

      return matchesQuery(scan, normalizedQuery)
    })
  }, [deferredQuery, scans, statusFilter])

  const activeSelectedScanId = selectedScanId ?? filteredScans[0]?.id ?? null
  const selectedScan = filteredScans.find((scan) => scan.id === activeSelectedScanId) ?? filteredScans[0] ?? null
  const detailLoading = Boolean(activeSelectedScanId) && detailState.scanId !== activeSelectedScanId

  useEffect(() => {
    if (!activeSelectedScanId) {
      return
    }

    let cancelled = false

    async function loadDetails() {
      try {
        const [issues, report, aiSuggestions] = await Promise.all([
          getScanIssues(activeSelectedScanId),
          getScanReport(activeSelectedScanId).catch(() => ({} as JsonObject)),
          getAISuggestions(activeSelectedScanId).catch(() => [] as AISuggestionRecord[]),
        ])

        if (!cancelled) {
          setDetailState({
            scanId: activeSelectedScanId,
            issues,
            aiSuggestions,
            report,
            error: null,
          })
        }
      } catch (err) {
        if (!cancelled) {
          setDetailState({
            scanId: activeSelectedScanId,
            issues: [],
            aiSuggestions: [],
            report: {},
            error: err instanceof Error ? err.message : 'Unable to load scan details.',
          })
        }
      }
    }

    void loadDetails()

    return () => {
      cancelled = true
    }
  }, [activeSelectedScanId])

  const summaryCards = useMemo(() => {
    const totalScans = scans.length
    const averageScore =
      totalScans === 0
        ? 0
        : Math.round(scans.reduce((sum, scan) => sum + clampScore(scan.rot_score), 0) / totalScans)
    const completedScans = scans.filter((scan) => scan.status !== 'failed' && scan.status !== 'running' && scan.status !== 'queued').length
    const successRate = totalScans === 0 ? 0 : Math.round((completedScans / totalScans) * 100)

    return [
      { label: 'Total Scans', value: `${totalScans}`, note: 'Backend synced', tone: 'positive' },
      { label: 'Avg. Rot Score', value: `${averageScore}%`, note: 'Across all scan results', tone: 'neutral' },
      { label: 'Success Rate', value: `${successRate}%`, note: `${completedScans} completed`, tone: 'positive' },
    ] as const
  }, [scans])

  const selectedReport = detailState.scanId === activeSelectedScanId ? detailState.report : {}
  const reportSummaryBlock = asObject(selectedReport.summary)
  const reportSummary =
    toStringValue(selectedReport.summary) ||
    (Object.keys(reportSummaryBlock).length > 0
      ? `Status: ${toStringValue(reportSummaryBlock.status, 'unknown')}, mismatches: ${toNumberValue(reportSummaryBlock.mismatch_count, toNumberValue(selectedScan?.mismatch_count, 0))}, rot score: ${Math.round(toNumberValue(reportSummaryBlock.rot_score, clampScore(selectedScan?.rot_score)))}`
      : 'No backend summary was provided for this scan.')
  const reportIssueCount = toNumberValue(
    selectedReport.mismatch_count,
    toNumberValue(reportSummaryBlock.mismatch_count, toNumberValue(selectedScan?.mismatch_count, 0)),
  )

  return (
    <section className="scan-history-page">
      <header className="scan-history-header">
        <p>Browse backend scans and drill into the details for a specific run.</p>
      </header>

      <section className="scan-history-toolbar">
        <div className="scan-history-filters">
          <input
            aria-label="Search scans"
            className="scan-history-search-input"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by scan ID, repo path, commit, or status"
            value={query}
          />
          <select
            aria-label="Filter scan status"
            className="scan-history-filter-select"
            onChange={(event) => setStatusFilter(event.target.value)}
            value={statusFilter}
          >
            <option value="all">All statuses</option>
            <option value="completed">Completed</option>
            <option value="running">Running</option>
            <option value="queued">Queued</option>
            <option value="failed">Failed</option>
          </select>
        </div>
        <div className="scan-history-search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="11" cy="11" r="6.2" />
            <path d="m16 16 4.2 4.2" />
          </svg>
          <input type="text" value={`${filteredScans.length} scans visible`} readOnly aria-label="Visible scan count" />
        </div>
      </section>

      <div className="scan-history-workspace">
        <section className="scan-history-table-shell">
          {loading ? (
            <div className="page-placeholder">Loading scan history from the backend…</div>
          ) : filteredScans.length === 0 ? (
            <div className="page-placeholder">{error ?? 'No scans match your current filters.'}</div>
          ) : (
            <table className="scan-history-table">
              <thead>
                <tr>
                  <th>Scan ID</th>
                  <th>Repository</th>
                  <th>Date/Time</th>
                  <th>Status</th>
                  <th>Mismatch Count</th>
                  <th>Rot Score</th>
                </tr>
              </thead>
              <tbody>
                {filteredScans.map((scan) => {
                  const statusTone = getStatusTone(scan.status)
                  const score = clampScore(scan.rot_score)
                  const isSelected = selectedScan?.id === scan.id

                  return (
                    <tr key={scan.id} className={isSelected ? 'scan-history-row active' : 'scan-history-row'}>
                      <td className="scan-id-cell">
                        <button className="scan-link-button" onClick={() => setSelectedScanId(scan.id)} type="button">
                          {scan.id || 'Unknown'}
                        </button>
                      </td>
                      <td>{scan.repo_path ?? 'Unknown repository'}</td>
                      <td className="scan-date-cell">{formatDateTime(scan.created_at)}</td>
                      <td>
                        <span className={`scan-status-pill ${statusTone}`}>{scan.status ?? 'completed'}</span>
                      </td>
                      <td className={(scan.mismatch_count ?? 0) > 0 ? 'scan-mismatch-critical' : undefined}>
                        {scan.mismatch_count ?? 0}
                      </td>
                      <td>
                        <div className="rot-score-cell">
                          <div className="rot-track">
                            <span className={score <= 20 ? 'healthy' : score <= 50 ? 'degrading' : 'critical'} style={{ width: `${score}%` }} />
                          </div>
                          <strong>{score}%</strong>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </section>

        <Card className="detail-card scan-detail-card" title="Scan Details">
          {!selectedScan ? (
            <p className="detail-copy">Select a scan to inspect its report summary and detected issues.</p>
          ) : (
            <>
              <div className="detail-grid">
                <div>
                  <p className="detail-label">Scan ID</p>
                  <p>{selectedScan.id}</p>
                </div>
                <div>
                  <p className="detail-label">Status</p>
                  <p>{selectedScan.status ?? 'completed'}</p>
                </div>
                <div>
                  <p className="detail-label">Repository</p>
                  <p>{selectedScan.repo_path ?? 'Unknown repository'}</p>
                </div>
                <div>
                  <p className="detail-label">Commit SHA</p>
                  <p>{selectedScan.commit_sha ?? 'Not provided'}</p>
                </div>
                <div>
                  <p className="detail-label">Mismatch Count</p>
                  <p>{selectedScan.mismatch_count ?? 0}</p>
                </div>
                <div>
                  <p className="detail-label">Rot Score</p>
                  <p>{clampScore(selectedScan.rot_score)}%</p>
                </div>
              </div>

              <div className="detail-section">
                <p className="detail-label">Report Summary</p>
                {detailLoading ? (
                  <p className="detail-copy">Loading report details…</p>
                ) : (
                  <p className="detail-copy">{reportSummary}</p>
                )}
              </div>

              <div className="detail-section">
                <p className="detail-label">Detected Issues</p>
                {detailLoading ? (
                  <p className="detail-copy">Loading linked issues…</p>
                ) : detailState.error ? (
                  <p className="detail-copy">{detailState.error}</p>
                ) : detailState.issues.length === 0 ? (
                  <p className="detail-copy">No linked issues were returned for this scan.</p>
                ) : (
                  <ul className="detail-list">
                    {detailState.issues.slice(0, 5).map((issue, index) => (
                      <li key={`${activeSelectedScanId}-issue-${index}`}>{summarizeIssue(issue, index)}</li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="detail-section">
                <p className="detail-label">AI Suggestions</p>
                {detailLoading ? (
                  <p className="detail-copy">Loading AI suggestions…</p>
                ) : detailState.aiSuggestions.length === 0 ? (
                  <p className="detail-copy">No AI suggestions available for this scan.</p>
                ) : (
                  <div className="ai-suggestions-list">
                    {detailState.aiSuggestions.map((s) => (
                      <details key={s.id} className="ai-suggestion-item">
                        <summary className="ai-suggestion-header">
                          <span className="ai-suggestion-path">{s.doc_path}</span>
                          <span className="ai-suggestion-badge">{s.model_used || 'AI'}</span>
                        </summary>
                        <div className="ai-suggestion-body">
                          {s.triggered_by.length > 0 && (
                            <p className="ai-suggestion-triggers">
                              <strong>Triggered by:</strong> {s.triggered_by.join(', ')}
                            </p>
                          )}
                          <p className="ai-suggestion-text">{s.suggestion}</p>
                        </div>
                      </details>
                    ))}
                  </div>
                )}
              </div>

              <div className="scan-detail-actions">
                <span>{reportIssueCount} issue(s) linked to this scan</span>
                {selectedScan.id && onOpenIssuesForScan ? (
                  <button className="scan-btn" onClick={() => onOpenIssuesForScan(selectedScan.id)} type="button">
                    Open Issues
                  </button>
                ) : null}
              </div>
            </>
          )}
        </Card>
      </div>

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
