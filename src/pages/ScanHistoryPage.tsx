import { Fragment, useEffect, useMemo, useState } from 'react'
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
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0
  return Math.max(0, Math.min(100, Math.round(value)))
}

function formatDateTime(value?: string): string {
  if (!value) return 'Not available'
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString()
}

function formatScanRunLabel(value?: string): string {
  if (!value) return 'Recent scan'

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return 'Recent scan'

  return parsed.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function shortenScanId(id?: string): string {
  if (!id) return 'Unavailable'
  return id.length > 8 ? `${id.slice(0, 8)}…` : id
}

function getStatusTone(status?: string): 'completed' | 'failed' | 'progress' {
  if (status === 'failed') return 'failed'
  if (status === 'running' || status === 'queued' || status === 'in-progress') return 'progress'
  return 'completed'
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
}: ScanHistoryPageProps) {
  const [scans, setScans] = useState<ScanRecord[]>([])
  const [selectedScanId, setSelectedScanId] = useState<string | null>(
    initialSelectedScanId ?? null,
  )
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(0)
  const [detailState, setDetailState] = useState<ScanDetailState>({
    scanId: null,
    issues: [],
    aiSuggestions: [],
    report: {},
    error: null,
  })

  useEffect(() => {
    setSelectedScanId(initialSelectedScanId ?? null)
  }, [initialSelectedScanId])

  useEffect(() => {
    setPage(0)
  }, [statusFilter])

  useEffect(() => {
    let cancelled = false

    async function loadScans() {
      try {
        const liveScans = await getScans()
        if (cancelled) return

        setScans(liveScans)
        setError(liveScans.length === 0 ? 'No scans are available from the backend yet.' : null)
      } catch (err) {
        if (!cancelled) {
          setScans([])
          setError(err instanceof Error ? err.message : 'Unable to load scan history.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadScans()

    return () => {
      cancelled = true
    }
  }, [])

  const filteredScans = useMemo(() => {
    return scans.filter((scan) => statusFilter === 'all' || (scan.status ?? 'completed') === statusFilter)
  }, [scans, statusFilter])

  const totalPages = Math.ceil(filteredScans.length / PAGE_SIZE)
  const pagedScans = filteredScans.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  const activeSelectedScanId = selectedScanId
  const selectedScan = filteredScans.find((scan) => scan.id === activeSelectedScanId) ?? null
  const detailLoading = Boolean(activeSelectedScanId) && detailState.scanId !== activeSelectedScanId

  useEffect(() => {
    if (!activeSelectedScanId) return

    const scanId = activeSelectedScanId
    let cancelled = false

    async function loadDetails() {
      try {
        const [issues, report, aiSuggestions] = await Promise.all([
          getScanIssues(scanId),
          getScanReport(scanId).catch(() => ({}) as JsonObject),
          getAISuggestions(scanId).catch(() => [] as AISuggestionRecord[]),
        ])

        if (!cancelled) {
          setDetailState({
            scanId,
            issues,
            aiSuggestions,
            report,
            error: null,
          })
        }
      } catch (err) {
        if (!cancelled) {
          setDetailState({
            scanId,
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
      (scan) => scan.status !== 'failed' && scan.status !== 'running' && scan.status !== 'queued',
    )

    const averageScore =
      completedScans.length === 0
        ? 0
        : Math.round(
            completedScans.reduce((sum, scan) => sum + clampScore(scan.rot_score), 0) /
              completedScans.length,
          )

    const successRate =
      totalScans === 0 ? 0 : Math.round((completedScans.length / totalScans) * 100)

    const aiRuns = scans.filter((scan) => (scan as unknown as Record<string, unknown>).ai_used).length

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
      completed: scans.filter((scan) => !scan.status || scan.status === 'completed').length,
      running: scans.filter((scan) => scan.status === 'running' || scan.status === 'queued').length,
      failed: scans.filter((scan) => scan.status === 'failed').length,
    }),
    [scans],
  )

  const selectedReport = detailState.scanId === activeSelectedScanId ? detailState.report : {}
  const reportSummaryBlock = asObject(selectedReport.summary)

  const reportSummary =
    toStringValue(selectedReport.summary) ||
    (Object.keys(reportSummaryBlock).length > 0
      ? `Status: ${toStringValue(reportSummaryBlock.status, 'unknown')}, mismatches: ${toNumberValue(
          reportSummaryBlock.mismatch_count,
          toNumberValue(selectedScan?.mismatch_count, 0),
        )}, rot score: ${Math.round(
          toNumberValue(reportSummaryBlock.rot_score, clampScore(selectedScan?.rot_score)),
        )}`
      : 'No backend summary was provided for this scan.')

  const reportIssueCount = toNumberValue(
    selectedReport.mismatch_count,
    toNumberValue(reportSummaryBlock.mismatch_count, toNumberValue(selectedScan?.mismatch_count, 0)),
  )

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="kicker">{summaryStats.totalScans} scans · last 7 days</div>
          <h1>Scan History</h1>
          <p className="sub">
            Every scan DocRot has run across your workspace. Inspect a row to review details,
            issues, and AI suggestions.
          </p>
        </div>

        <div className="page-head-actions">
          <button type="button" className="btn">
            Export CSV
          </button>
        </div>
      </div>

      <div className="hist-stat-strip">
        {[
          { label: 'Total scans', value: summaryStats.totalScans, note: 'backend synced', color: null },
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

      <div className="issues-filterbar" style={{ marginBottom: 14 }}>
        {(
          [
            ['all', 'All', statusCounts.all],
            ['completed', 'Completed', statusCounts.completed],
            ['running', 'Running', statusCounts.running],
            ['failed', 'Failed', statusCounts.failed],
          ] as [string, string, number][]
        ).map(([key, label, count]) => (
          <button
            key={key}
            type="button"
            className={`filter-chip ${statusFilter === key ? 'active' : ''}`}
            onClick={() => setStatusFilter(key)}
          >
            {label} <span className="count">{count}</span>
          </button>
        ))}

        <span style={{ flex: 1 }} />

        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-3)' }}>
          {filteredScans.length} scans visible
        </span>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div className="page-placeholder">Loading scan history from the backend…</div>
        ) : filteredScans.length === 0 ? (
          <div className="empty">
            <h4>No scans found</h4>
            <p>{error ?? 'No scans match your current filters.'}</p>
          </div>
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ width: 160 }}>Scan</th>
                <th>Repository</th>
                <th style={{ width: 130 }}>Rot</th>
                <th style={{ width: 120 }}>Mismatches</th>
                <th style={{ width: 110 }}>Status</th>
                <th style={{ width: 110 }} />
              </tr>
            </thead>

            <tbody>
              {pagedScans.map((scan) => {
                const isOpen = selectedScanId === scan.id
                const statusTone = getStatusTone(scan.status)
                const score = clampScore(scan.rot_score)
                const statusPill =
                  statusTone === 'completed'
                    ? 'pill-success'
                    : statusTone === 'progress'
                      ? 'pill-live'
                      : 'pill-critical'

                return (
                  <Fragment key={scan.id}>
                    <tr>
                      <td>
                        <strong style={{ fontSize: 12.5, fontWeight: 600 }}>
                          {formatScanRunLabel(scan.created_at)}
                        </strong>
                        <div
                          title={scan.id}
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: 10,
                            color: 'var(--ink-4)',
                            marginTop: 2,
                          }}
                        >
                          ID: {shortenScanId(scan.id)}
                        </div>
                      </td>

                      <td>
                        <strong style={{ fontSize: 13 }}>{scan.repo_path ?? 'Unknown'}</strong>
                        {scan.commit_sha ? (
                          <div
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: 10,
                              color: 'var(--ink-4)',
                              marginTop: 2,
                            }}
                          >
                            Commit: {scan.commit_sha.slice(0, 8)}
                          </div>
                        ) : null}
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
                          <strong>{score}%</strong>
                        </div>
                      </td>

                      <td>
                        {(scan.mismatch_count ?? 0) === 0 ? (
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-4)' }}>
                            none
                          </span>
                        ) : (
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--critical)' }}>
                            {scan.mismatch_count}
                          </span>
                        )}
                      </td>

                      <td>
                        <span className={`pill ${statusPill}`}>{scan.status ?? 'completed'}</span>
                      </td>

                      <td>
                        <button
                          type="button"
                          className="btn btn-sm btn-ghost"
                          onClick={() => setSelectedScanId(isOpen ? null : scan.id)}
                        >
                          {isOpen ? 'Hide' : 'Inspect'}
                        </button>
                      </td>
                    </tr>

                    {isOpen ? (
                      <tr>
                        <td colSpan={6} style={{ padding: 0, background: 'var(--bg-sunken)' }}>
                          <div
                            style={{
                              padding: '16px 20px',
                              borderTop: '1px solid var(--border)',
                              display: 'grid',
                              gap: 12,
                            }}
                          >
                            <div
                              style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: 12,
                              }}
                            >
                              <div className="card card-pad">
                                <div className="detail-label">Report Summary</div>
                                {detailLoading ? (
                                  <p style={{ color: 'var(--ink-3)', fontSize: 13 }}>
                                    Loading report details…
                                  </p>
                                ) : (
                                  <p style={{ color: 'var(--ink-2)', lineHeight: 1.55 }}>
                                    {reportSummary}
                                  </p>
                                )}
                              </div>

                              <div className="card card-pad">
                                <div className="detail-label">Run Metadata</div>
                                <div className="detail-kv">
                                  <div className="detail-kv-row">
                                    <span className="k">Full Scan ID</span>
                                    <span className="v mono">{scan.id ?? '—'}</span>
                                  </div>
                                  <div className="detail-kv-row">
                                    <span className="k">Repository</span>
                                    <span className="v">{scan.repo_path ?? '—'}</span>
                                  </div>
                                  <div className="detail-kv-row">
                                    <span className="k">Commit</span>
                                    <span className="v mono">{scan.commit_sha ?? '—'}</span>
                                  </div>
                                  <div className="detail-kv-row">
                                    <span className="k">Captured</span>
                                    <span className="v">{formatDateTime(scan.created_at)}</span>
                                  </div>
                                  <div className="detail-kv-row">
                                    <span className="k">Mismatches</span>
                                    <span className="v mono">{scan.mismatch_count ?? 0}</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="card card-pad">
                              <div className="detail-label">Detected Issues</div>

                              {detailLoading ? (
                                <p style={{ color: 'var(--ink-3)' }}>Loading linked issues…</p>
                              ) : detailState.error ? (
                                <p style={{ color: 'var(--critical)' }}>{detailState.error}</p>
                              ) : detailState.issues.length === 0 ? (
                                <p style={{ color: 'var(--ink-3)' }}>
                                  No linked issues were returned for this scan.
                                </p>
                              ) : (
                                <ul style={{ paddingLeft: 16, display: 'grid', gap: 4 }}>
                                  {detailState.issues.slice(0, 5).map((issue, index) => (
                                    <li
                                      key={`${scan.id}-issue-${index}`}
                                      style={{ color: 'var(--ink-2)', fontSize: 12 }}
                                    >
                                      {summarizeIssue(issue, index)}
                                    </li>
                                  ))}
                                </ul>
                              )}

                              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginTop: 12 }}>
                                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-3)' }}>
                                  {reportIssueCount} issue(s) linked
                                </span>

                                {scan.id && onOpenIssuesForScan ? (
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-accent"
                                    onClick={() => onOpenIssuesForScan(scan.id)}
                                  >
                                    Open Issues
                                  </button>
                                ) : null}
                              </div>
                            </div>

                            {detailState.aiSuggestions.length > 0 ? (
                              <div className="card card-pad">
                                <div className="detail-label">AI Suggestions</div>
                                <div className="ai-card">
                                  <div className="ai-head">
                                    AI · {detailState.aiSuggestions.length} suggestion
                                    {detailState.aiSuggestions.length !== 1 ? 's' : ''}
                                  </div>
                                  <div className="ai-body">
                                    {detailState.aiSuggestions[0].suggestion}
                                  </div>
                                </div>
                              </div>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        )}

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
      </div>
    </div>
  )
}