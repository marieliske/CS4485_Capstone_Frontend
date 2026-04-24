import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { asObject, type JsonObject } from '../api/client'
import {
  getAISuggestions,
  getScanIssues,
  getScanReport,
  getScans,
  type AISuggestionRecord,
  type ScanIssueRecord,
  type ScanRecord,
} from '../api/scans'

interface ScanHistoryPageProps {
  initialSelectedScanId?: string | null
  onOpenIssuesForScan?: (scanId: string) => void
}

interface ScanDetailState {
  scanId: string | null
  issues: ScanIssueRecord[]
  aiSuggestions: AISuggestionRecord[]
  report: JsonObject
  error: string | null
}

const PAGE_SIZE = 25

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

function formatScanRunLabel(value?: string): string {
  if (!value) {
    return 'Recent scan'
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return 'Recent scan'
  }

  return parsed.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function shortenScanId(id?: string): string {
  if (!id) {
    return 'Unavailable'
  }

  return id.length > 8 ? `${id.slice(0, 8)}…` : id
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
  return [scan.id ?? '', scan.repo_path ?? '', scan.commit_sha ?? '', scan.status ?? ''].some(
    (value) => value.toLowerCase().includes(query),
  )
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

export function ScanHistoryPage({
  initialSelectedScanId,
  onOpenIssuesForScan,
  searchQuery,
}: ScanHistoryPageProps) {
  const [scans, setScans] = useState<ScanRecord[]>([])
  const [selectedScanId, setSelectedScanId] = useState<string | null>(
    initialSelectedScanId ?? null,
  )
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(0)
  const [detailState, setDetailState] = useState<ScanDetailState>({
    scanId: null,
    issues: [],
    aiSuggestions: [],
    report: {},
    error: null,
  })

  const deferredQuery = useDeferredValue(query)

  useEffect(() => {
    setSelectedScanId(initialSelectedScanId ?? null)
  }, [initialSelectedScanId])

  useEffect(() => {
    setPage(0)
  }, [deferredQuery, statusFilter])

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
      const matchesStatus =
        statusFilter === 'all' || (scan.status ?? 'completed') === statusFilter
      if (!matchesStatus) {
        return false
      }

      if (!normalizedQuery) {
        return true
      }

      return matchesQuery(scan, normalizedQuery)
    })
  }, [deferredQuery, scans, statusFilter])

  const totalPages = Math.ceil(filteredScans.length / PAGE_SIZE)
  const pagedScans = filteredScans.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  const activeSelectedScanId = selectedScanId ?? filteredScans[0]?.id ?? null
  const selectedScan =
    filteredScans.find((scan) => scan.id === activeSelectedScanId) ?? filteredScans[0] ?? null
  const detailLoading =
    Boolean(activeSelectedScanId) && detailState.scanId !== activeSelectedScanId

  useEffect(() => {
    if (!activeSelectedScanId) {
      return
    }

    let cancelled = false

    async function loadDetails() {
      try {
        const [issues, report, aiSuggestions] = await Promise.all([
          getScanIssues(activeSelectedScanId),
          getScanReport(activeSelectedScanId).catch(() => ({}) as JsonObject),
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

  const summaryStats = useMemo(() => {
    const totalScans = scans.length
    const completedScans = scans.filter(
      (scan) =>
        scan.status !== 'failed' && scan.status !== 'running' && scan.status !== 'queued',
    )
    const averageScore =
      completedScans.length === 0
        ? 0
        : Math.round(
            completedScans.reduce((sum, scan) => sum + clampScore(scan.rot_score), 0) /
              completedScans.length,
          )
    const successRate =
      totalScans === 0
        ? 0
        : Math.round((completedScans.length / totalScans) * 100)
    const aiRuns = scans.filter((s) => (s as Record<string, unknown>).ai_used).length

    return {
      totalScans,
      completedScans: completedScans.length,
      averageScore,
      successRate,
      aiRuns,
    }
  }, [scans])

  const statusCounts = useMemo(
    () => ({
      all: scans.length,
      completed: scans.filter((s) => !s.status || s.status === 'completed').length,
      running: scans.filter((s) => s.status === 'running' || s.status === 'queued').length,
      failed: scans.filter((s) => s.status === 'failed').length,
    }),
    [scans],
  )

  const selectedReport =
    detailState.scanId === activeSelectedScanId ? detailState.report : {}
  const reportSummaryBlock = asObject(selectedReport.summary)
  const reportSummary =
    toStringValue(selectedReport.summary) ||
    (Object.keys(reportSummaryBlock).length > 0
      ? `Status: ${toStringValue(reportSummaryBlock.status, 'unknown')}, mismatches: ${toNumberValue(
          reportSummaryBlock.mismatch_count,
          toNumberValue(selectedScan?.mismatch_count, 0),
        )}, rot score: ${Math.round(
          toNumberValue(
            reportSummaryBlock.rot_score,
            clampScore(selectedScan?.rot_score),
          ),
        )}`
      : 'No backend summary was provided for this scan.')
  const reportIssueCount = toNumberValue(
    selectedReport.mismatch_count,
    toNumberValue(
      reportSummaryBlock.mismatch_count,
      toNumberValue(selectedScan?.mismatch_count, 0),
    ),
  )

  return (
    <div>
      {/* Page head */}
      <div className="page-head">
        <div>
          <div className="kicker">{summaryStats.totalScans} scans · last 7 days</div>
          <h1>Scan History</h1>
          <p className="sub">
            Every scan DocRot has run across your workspace. Click a row to inspect the full
            report.
          </p>
        </div>
        <div className="page-head-actions">
          <button type="button" className="btn">
            Export CSV
          </button>
        </div>
      </div>

      {/* Stat strip */}
      <div className="hist-stat-strip">
        {[
          {
            label: 'Total scans',
            value: summaryStats.totalScans,
            note: 'backend synced',
            color: null,
          },
          {
            label: 'Avg rot score',
            value: `${summaryStats.averageScore}%`,
            note: 'completed runs',
            color:
              summaryStats.averageScore > 50
                ? 'var(--critical)'
                : summaryStats.averageScore > 25
                  ? 'var(--warning)'
                  : null,
          },
          {
            label: 'Success rate',
            value: `${summaryStats.successRate}%`,
            note: `${summaryStats.completedScans} completed`,
            color: summaryStats.successRate < 80 ? 'var(--warning)' : null,
          },
          {
            label: 'AI passes',
            value: summaryStats.aiRuns,
            note: `of ${summaryStats.totalScans} scans`,
            color: null,
          },
        ].map(({ label, value, note, color }) => (
          <div key={label} className="hist-stat-cell">
            <div className="hist-stat-label">{label}</div>
            <div className="hist-stat-value" style={color ? { color } : {}}>
              {value}
            </div>
            <div className="hist-stat-note">{note}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="issues-filterbar" style={{ marginBottom: 14 }}>
        {(
          [
            ['all', 'All', statusCounts.all],
            ['completed', 'Completed', statusCounts.completed],
            ['running', 'Running', statusCounts.running],
            ['failed', 'Failed', statusCounts.failed],
          ] as [string, string, number][]
        ).map(([k, label, n]) => (
          <button
            key={k}
            type="button"
            className={`filter-chip ${statusFilter === k ? 'active' : ''}`}
            onClick={() => setStatusFilter(k)}
          >
            {label} <span className="count">{n}</span>
          </button>
        ))}
        <span style={{ flex: 1 }} />
        <span
          style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-3)' }}
        >
          {filteredScans.length} scans visible
        </span>
      </div>

      {/* Split panel */}
      <div
        className="split"
        style={{ minHeight: 580 }}
      >
        {/* Table side */}
        <div
          className="card"
          style={{ minWidth: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
        >
          {loading ? (
            <div className="page-placeholder">Loading scan history from the backend…</div>
          ) : filteredScans.length === 0 ? (
            <div className="empty">
              <h4>No scans found</h4>
              <p>{error ?? 'No scans match your current filters.'}</p>
            </div>
          ) : (
            <>
              <table className="tbl">
                <thead>
                  <tr>
                    <th style={{ width: 140 }}>Scan ID</th>
                    <th>Repository</th>
                    <th style={{ width: 130 }}>Started</th>
                    <th style={{ width: 120 }}>Rot</th>
                    <th style={{ width: 100 }}>Mismatches</th>
                    <th style={{ width: 90 }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedScans.map((scan) => {
                    const statusTone = getStatusTone(scan.status)
                    const score = clampScore(scan.rot_score)
                    const isSelected = selectedScan?.id === scan.id
                    const statusPill =
                      statusTone === 'completed'
                        ? 'pill-success'
                        : statusTone === 'progress'
                          ? 'pill-live'
                          : 'pill-critical'

                    return (
                      <tr
                        key={scan.id}
                        className={isSelected ? 'active' : undefined}
                        onClick={() => setSelectedScanId(scan.id)}
                        style={{ cursor: 'pointer' }}
                      >
                        <td>
                          <div>
                            <strong
                              style={{
                                fontFamily: 'var(--font-mono)',
                                fontSize: 12,
                                color: 'var(--ink)',
                                fontWeight: 500,
                              }}
                            >
                              {shortenScanId(scan.id)}
                            </strong>
                            <small
                              style={{
                                display: 'block',
                                fontFamily: 'var(--font-mono)',
                                fontSize: 10,
                                color: 'var(--ink-4)',
                                marginTop: 2,
                              }}
                            >
                              {formatScanRunLabel(scan.created_at)}
                            </small>
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 500, fontSize: 13 }}>
                            {scan.repo_path ?? 'Unknown'}
                          </div>
                          {scan.commit_sha ? (
                            <div
                              style={{
                                fontFamily: 'var(--font-mono)',
                                fontSize: 10,
                                color: 'var(--ink-4)',
                                marginTop: 2,
                              }}
                            >
                              {scan.commit_sha.slice(0, 8)}
                            </div>
                          ) : null}
                        </td>
                        <td>
                          <div
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: 11.5,
                              color: 'var(--ink-2)',
                            }}
                          >
                            {formatDateTime(scan.created_at)}
                          </div>
                        </td>
                        <td>
                          <div className="mini-score">
                            <div className="mini-score-bar">
                              <span
                                style={{
                                  width: `${score}%`,
                                  background:
                                    score >= 65
                                      ? 'var(--critical)'
                                      : score >= 35
                                        ? 'var(--warning)'
                                        : 'var(--success)',
                                }}
                              />
                            </div>
                            <strong
                              style={{
                                fontFamily: 'var(--font-mono)',
                                fontSize: 12,
                              }}
                            >
                              {score}%
                            </strong>
                          </div>
                        </td>
                        <td>
                          {(scan.mismatch_count ?? 0) === 0 ? (
                            <span
                              style={{
                                fontFamily: 'var(--font-mono)',
                                fontSize: 11,
                                color: 'var(--ink-4)',
                              }}
                            >
                              none
                            </span>
                          ) : (
                            <span
                              style={{
                                fontFamily: 'var(--font-mono)',
                                fontSize: 12,
                                color:
                                  (scan.mismatch_count ?? 0) > 0
                                    ? 'var(--critical)'
                                    : 'inherit',
                              }}
                            >
                              {scan.mismatch_count}
                            </span>
                          )}
                        </td>
                        <td>
                          <span className={`pill ${statusPill}`}>
                            {scan.status ?? 'completed'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>

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
              ) : (
                <div className="pager">
                  <span>
                    Showing {filteredScans.length} of {scans.length}
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Detail panel */}
        <div className="detail-panel" style={{ overflowY: 'auto' }}>
          {!selectedScan ? (
            <div
              style={{
                display: 'grid',
                placeItems: 'center',
                flex: 1,
                padding: 48,
                textAlign: 'center',
              }}
            >
              <div className="empty" style={{ margin: 0 }}>
                <h4>Select a scan</h4>
                <p>
                  Click any row to inspect its rot report, mismatches, and AI suggestions.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="detail-head">
                <div
                  className="row-between"
                  style={{ marginBottom: 6 }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 11,
                      color: 'var(--ink-3)',
                    }}
                  >
                    {formatDateTime(selectedScan.created_at)}
                  </span>
                  <span
                    className={`pill ${
                      getStatusTone(selectedScan.status) === 'completed'
                        ? 'pill-success'
                        : getStatusTone(selectedScan.status) === 'progress'
                          ? 'pill-live'
                          : 'pill-critical'
                    }`}
                  >
                    {selectedScan.status ?? 'completed'}
                  </span>
                </div>
                <h2
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: 22,
                    fontWeight: 400,
                    lineHeight: 1.15,
                    letterSpacing: '-0.02em',
                    marginBottom: 6,
                  }}
                >
                  {selectedScan.repo_path ?? 'Unknown repository'}
                </h2>
                <div
                  className="row"
                  style={{ gap: 8, flexWrap: 'wrap' }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 11,
                      color: 'var(--ink-3)',
                    }}
                  >
                    {shortenScanId(selectedScan.id)}
                  </span>
                  {selectedScan.commit_sha ? (
                    <>
                      <span style={{ color: 'var(--ink-4)', fontSize: 12 }}>·</span>
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 11,
                          color: 'var(--ink-3)',
                        }}
                      >
                        {selectedScan.commit_sha.slice(0, 8)}
                      </span>
                    </>
                  ) : null}
                </div>
              </div>

              {/* Rot score */}
              <div className="detail-section" style={{ padding: '14px 20px' }}>
                <div className="detail-label">Rot score</div>
                <div
                  className="mini-score"
                  style={{ marginTop: 8 }}
                >
                  <div
                    className="mini-score-bar"
                    style={{ width: '100%', flex: 1, height: 8 }}
                  >
                    <span
                      style={{
                        width: `${clampScore(selectedScan.rot_score)}%`,
                        background:
                          clampScore(selectedScan.rot_score) >= 65
                            ? 'var(--critical)'
                            : clampScore(selectedScan.rot_score) >= 35
                              ? 'var(--warning)'
                              : 'var(--success)',
                      }}
                    />
                  </div>
                  <strong
                    style={{
                      fontFamily: 'var(--font-serif)',
                      fontSize: 24,
                      letterSpacing: '-0.03em',
                      color:
                        clampScore(selectedScan.rot_score) >= 65
                          ? 'var(--critical)'
                          : clampScore(selectedScan.rot_score) >= 35
                            ? 'var(--warning)'
                            : 'var(--success)',
                    }}
                  >
                    {clampScore(selectedScan.rot_score)}%
                  </strong>
                </div>
              </div>

              {/* Metadata */}
              <div className="detail-section" style={{ padding: '14px 20px' }}>
                <div className="detail-label">Run metadata</div>
                <div className="detail-kv" style={{ marginTop: 8 }}>
                  {[
                    ['Scan ID', selectedScan.id ?? '—', true],
                    ['Repository', selectedScan.repo_path ?? '—', false],
                    ['Commit', selectedScan.commit_sha ?? '—', true],
                    ['Captured', formatDateTime(selectedScan.created_at), false],
                    ['Mismatches', String(selectedScan.mismatch_count ?? 0), true],
                  ].map(([k, v, mono]) => (
                    <div key={String(k)} className="detail-kv-row">
                      <span className="k">{k}</span>
                      <span className={`v${mono ? ' mono' : ''}`}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Report summary */}
              <div className="detail-section" style={{ padding: '14px 20px' }}>
                <div className="detail-label">Report summary</div>
                {detailLoading ? (
                  <p style={{ color: 'var(--ink-3)', fontSize: 13, marginTop: 6 }}>
                    Loading report details…
                  </p>
                ) : (
                  <p style={{ color: 'var(--ink-2)', fontSize: 13, lineHeight: 1.55, marginTop: 6 }}>
                    {reportSummary}
                  </p>
                )}
              </div>

              {/* Detected issues */}
              <div className="detail-section" style={{ padding: 0 }}>
                <div
                  className="detail-label"
                  style={{ padding: '12px 20px 0' }}
                >
                  Detected issues
                </div>
                {detailLoading ? (
                  <p
                    style={{
                      color: 'var(--ink-3)',
                      fontSize: 13,
                      padding: '8px 20px 14px',
                    }}
                  >
                    Loading linked issues…
                  </p>
                ) : detailState.error ? (
                  <p
                    style={{
                      color: 'var(--critical)',
                      fontSize: 13,
                      padding: '8px 20px 14px',
                    }}
                  >
                    {detailState.error}
                  </p>
                ) : detailState.issues.length === 0 ? (
                  <p
                    style={{
                      color: 'var(--ink-3)',
                      fontSize: 13,
                      padding: '8px 20px 14px',
                    }}
                  >
                    No linked issues were returned for this scan.
                  </p>
                ) : (
                  <>
                    {detailState.issues.slice(0, 5).map((issue, index) => (
                      <div
                        key={`${activeSelectedScanId}-issue-${index}`}
                        className="feed-item"
                        style={{ cursor: 'default' }}
                      >
                        <div className="feed-icon warning">
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                          >
                            <path d="M12 9v4M12 17h.01" />
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                          </svg>
                        </div>
                        <div className="feed-copy">
                          <strong>{summarizeIssue(issue, index)}</strong>
                        </div>
                      </div>
                    ))}
                    {detailState.issues.length > 5 ? (
                      <div
                        style={{
                          padding: '10px 20px',
                          borderTop: '1px solid var(--border)',
                        }}
                      >
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          style={{ width: '100%', justifyContent: 'center' }}
                          onClick={() =>
                            selectedScan.id && onOpenIssuesForScan?.(selectedScan.id)
                          }
                        >
                          View all {detailState.issues.length} issues
                        </button>
                      </div>
                    ) : null}
                  </>
                )}
              </div>

              {/* AI suggestions */}
              {detailState.aiSuggestions.length > 0 ? (
                <div className="detail-section" style={{ padding: '14px 20px' }}>
                  <div className="detail-label">AI suggestions</div>
                  <div className="ai-card" style={{ marginTop: 8 }}>
                    <div className="ai-head">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        style={{ width: 12, height: 12 }}
                      >
                        <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.5 5.5l2.8 2.8M15.7 15.7l2.8 2.8M5.5 18.5l2.8-2.8M15.7 8.3l2.8-2.8" />
                      </svg>
                      AI · {detailState.aiSuggestions.length} suggestion
                      {detailState.aiSuggestions.length !== 1 ? 's' : ''}
                    </div>
                    <div className="ai-body">
                      {detailState.aiSuggestions[0].suggestion}
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Actions */}
              <div
                style={{
                  padding: '14px 20px',
                  borderTop: '1px solid var(--border)',
                  display: 'flex',
                  gap: 8,
                  flexWrap: 'wrap',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    color: 'var(--ink-3)',
                    alignSelf: 'center',
                  }}
                >
                  {reportIssueCount} issue(s) linked
                </span>
                {selectedScan.id && onOpenIssuesForScan ? (
                  <button
                    type="button"
                    className="btn btn-sm btn-accent"
                    style={{ marginLeft: 'auto' }}
                    onClick={() => onOpenIssuesForScan(selectedScan.id)}
                  >
                    Open Issues
                  </button>
                ) : null}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
