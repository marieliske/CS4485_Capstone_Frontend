import { useCallback, useEffect, useMemo, useState } from 'react'
import { getFingerprintSummary, getScanIssues, getScans, type ScanRecord } from '../api/scans'
import { useScanEvents } from '../hooks/useScanEvents'

type StatCardTone = 'positive' | 'negative' | 'neutral'
type ActivityTone = 'success' | 'warning' | 'info' | 'danger'

interface DashboardActivity {
  scanId?: string
  title: string
  subtitle: string
  time: string
  tone: ActivityTone
}

interface DashboardPageProps {
  onOpenHistory?: (scanId?: string) => void
  onOpenIssues?: () => void
  onOpenProjects?: () => void
  userName?: string
}

function asFiniteNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function parseScanId(value?: string): number {
  if (!value) {
    return 0
  }

  const parsed = Number(value)
  if (!Number.isFinite(parsed)) {
    return 0
  }

  return Math.max(0, Math.floor(parsed))
}

function pickNumber(source: Record<string, unknown>, keys: string[]): number | null {
  for (const key of keys) {
    const parsed = asFiniteNumber(source[key])
    if (parsed !== null) {
      return parsed
    }
  }
  return null
}

function formatRelativeTime(value?: string): string {
  if (!value) {
    return 'just now'
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return 'recently'
  }

  const seconds = Math.max(0, Math.round((Date.now() - parsed.getTime()) / 1000))
  if (seconds < 60) {
    return `${seconds}s ago`
  }

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) {
    return `${minutes}m ago`
  }

  const hours = Math.floor(minutes / 60)
  if (hours < 24) {
    return `${hours}h ago`
  }

  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function formatScanPseudoName(scan: ScanRecord, fallbackIndex: number): string {
  const parsed = scan.created_at ? new Date(scan.created_at) : null
  if (parsed && !Number.isNaN(parsed.getTime())) {
    return `Scan ${parsed.toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })}`
  }

  return `Scan ${fallbackIndex + 1}`
}

function StatIcon({ type }: { type: 'folder' | 'search' | 'warning' | 'chart' }) {
  if (type === 'folder') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M3.5 8h6l1.7 2H20v8a2 2 0 0 1-2 2H5.5a2 2 0 0 1-2-2z" />
      </svg>
    )
  }

  if (type === 'search') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="11" cy="11" r="5.5" />
        <path d="m15 15 5 5" />
      </svg>
    )
  }

  if (type === 'warning') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="8" />
        <path d="M12 8v5" />
        <path d="M12 16h.01" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M5 19V9" />
      <path d="M10 19V5" />
      <path d="M15 19v-7" />
      <path d="M20 19v-4" />
    </svg>
  )
}

export function DashboardPage({ onOpenHistory, onOpenIssues, onOpenProjects, userName }: DashboardPageProps) {
  const [scans, setScans] = useState<ScanRecord[]>([])
  const [openIssues, setOpenIssues] = useState(0)
  const [healthIndex, setHealthIndex] = useState<number | null>(null)
  const [lastSeenId, setLastSeenId] = useState(0)
  const [initialized, setInitialized] = useState(false)
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadDashboard = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setLoading(true)
    }

    try {
      const [scanRows, summary] = await Promise.all([
        getScans(),
        getFingerprintSummary().catch(() => ({} as Record<string, unknown>)),
      ])

      const latestScanId = scanRows[0]?.id
      let latestOpenIssueCount = 0

      if (latestScanId) {
        const latestIssues = await getScanIssues(latestScanId)
        latestOpenIssueCount = latestIssues.filter((issue) => {
          const status = (issue as Record<string, unknown>).status
          return status !== 'closed'
        }).length
      }

      const summaryObject = summary as Record<string, unknown>
      const fallbackIssueCount = pickNumber(summaryObject, ['open_issues', 'openIssues', 'issue_count', 'total_issues'])
      const summaryHealth = pickNumber(summaryObject, ['health_index', 'healthIndex', 'score', 'rot_score'])
      const latestScanHealth = asFiniteNumber(scanRows[0]?.rot_score)

      setScans(scanRows)
      setOpenIssues(latestOpenIssueCount || fallbackIssueCount || 0)
      setHealthIndex(latestScanHealth ?? summaryHealth)
      setLastSeenId(parseScanId(latestScanId))
      setLastUpdatedAt(new Date())
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load dashboard data.')
    } finally {
      setLoading(false)
      setInitialized(true)
    }
  }, [])

  useEffect(() => {
    void loadDashboard(true)
  }, [loadDashboard])

  const handleScanAdded = useCallback(() => {
    void loadDashboard(false)
  }, [loadDashboard])

  const { isConnected: streamConnected } = useScanEvents(handleScanAdded, lastSeenId, initialized)

  const healthProgress = Math.max(0, Math.min(100, Math.round(healthIndex ?? 0)))
  const totalProjectCount = new Set(
    scans.map((scan) => scan.repo_path).filter((path) => typeof path === 'string' && path.length > 0),
  ).size

  const statCards = useMemo(
    () => [
      {
        title: 'Total Projects',
        value: `${totalProjectCount}`,
        delta: 'live',
        tone: 'positive' as StatCardTone,
        icon: 'folder' as const,
      },
      {
        title: 'Total Scans',
        value: `${scans.length}`,
        delta: 'live',
        tone: 'positive' as StatCardTone,
        icon: 'search' as const,
      },
      {
        title: 'Open Issues',
        value: `${openIssues}`,
        delta: openIssues > 0 ? 'attention' : 'clear',
        tone: openIssues > 0 ? ('negative' as StatCardTone) : ('positive' as StatCardTone),
        icon: 'warning' as const,
      },
      {
        title: 'Latest Scan Score',
        value: `${healthProgress}%`,
        delta: 'live',
        tone:
          healthProgress <= 20
            ? ('positive' as StatCardTone)
            : healthProgress <= 50
              ? ('neutral' as StatCardTone)
              : ('negative' as StatCardTone),
        icon: 'chart' as const,
      },
    ],
    [healthProgress, openIssues, scans.length, totalProjectCount],
  )

  const activityRows = useMemo<DashboardActivity[]>(() => {
    if (scans.length === 0) {
      return [
        {
          title: 'No scans available yet',
          subtitle: 'Run your scanner to populate dashboard activity.',
          time: 'now',
          tone: 'info',
        },
      ]
    }

    return scans.slice(0, 4).map((scan, index) => {
      const score = asFiniteNumber(scan.rot_score)
      const mismatches = asFiniteNumber(scan.mismatch_count)
      const tone: ActivityTone = (mismatches ?? 0) > 0 ? 'warning' : score !== null && score <= 20 ? 'success' : 'info'

      return {
        scanId: scan.id,
        title: `Scan Completed: ${formatScanPseudoName(scan, index)}`,
        subtitle:
          mismatches !== null
            ? `Detected ${mismatches} potential mismatch${mismatches === 1 ? '' : 'es'} in this run.`
            : `Status: ${scan.status || 'unknown'}`,
        time: formatRelativeTime(scan.created_at),
        tone,
      }
    })
  }, [scans])

  const statActions: Record<string, (() => void) | undefined> = {
    'Total Projects': onOpenProjects,
    'Total Scans': () => onOpenHistory?.(),
    'Open Issues': onOpenIssues,
    'Latest Scan Score': () => onOpenHistory?.(scans[0]?.id),
  }

  const rotPct = healthProgress
  const rotClass = rotPct >= 65 ? 'crit' : rotPct >= 35 ? 'warn' : ''
  const r = 70
  const circumference = 2 * Math.PI * r
  const offset = circumference - (rotPct / 100) * circumference

  const toneToFeedClass = (tone: ActivityTone) => {
    if (tone === 'success') return 'success'
    if (tone === 'warning') return 'warning'
    if (tone === 'danger') return 'danger'
    return 'info'
  }

  return (
    <div className="dash-grid">
      {/* Page head */}
      <div className="page-head">
        <div>
          <div className="kicker">
            Overview · {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </div>
          <h1>
            {loading ? 'Loading dashboard…' : `Docs are ${rotPct}% rotten`}
          </h1>
          <p className="sub">
            {totalProjectCount} tracked {totalProjectCount === 1 ? 'repository' : 'repositories'} ·{' '}
            {openIssues} open {openIssues === 1 ? 'issue' : 'issues'} ·{' '}
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
              {loading ? 'refreshing…' : streamConnected ? '● live' : '○ polling'}
            </span>
            {error ? <span style={{ color: 'var(--critical)', marginLeft: 12, fontSize: 12 }}>{error}</span> : null}
          </p>
        </div>
        <div className="page-head-actions">
          <button type="button" className="btn" onClick={() => onOpenHistory?.()}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 8v5l3 2"/><circle cx="12" cy="12" r="8"/></svg>
            Scan History
          </button>
          <button type="button" className="btn btn-accent" onClick={onOpenProjects}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
            Add Repo
          </button>
        </div>
      </div>

      {/* Hero row */}
      <div className="dash-hero">
        {/* Rot index card */}
        <div className="card rot-hero-card">
          <div className="rot-hero-head">
            <div>
              <div className="kicker">Rot index · workspace</div>
              <h2>Documentation health for {totalProjectCount} {totalProjectCount === 1 ? 'repo' : 'repos'}</h2>
            </div>
            <span className={`pill ${streamConnected ? 'pill-live' : ''}`}>
              {streamConnected ? 'Live' : 'Polling'}
            </span>
          </div>
          <div className="rot-hero-body">
            {/* Gauge */}
            <div className={`rot-gauge ${rotClass}`}>
              <svg viewBox="0 0 160 160">
                <circle className="track" cx="80" cy="80" r={r} />
                <circle
                  className="value"
                  cx="80" cy="80" r={r}
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                />
              </svg>
              <div className="rot-gauge-inner">
                <div className="pct">{rotPct}<sup>%</sup></div>
                <div className="status">{rotPct >= 65 ? 'critical' : rotPct >= 35 ? 'degrading' : 'healthy'}</div>
              </div>
            </div>
            <div className="rot-meta-list">
              <div className="rot-meta-row">
                <span className="label">Open issues</span>
                <span className="value" style={{ color: openIssues > 0 ? 'var(--critical)' : 'var(--success)' }}>{openIssues} open</span>
              </div>
              <div className="rot-meta-row">
                <span className="label">Total scans</span>
                <span className="value mono">{scans.length}</span>
              </div>
              <div className="rot-meta-row">
                <span className="label">Repos tracked</span>
                <span className="value mono">{totalProjectCount}</span>
              </div>
              <div className="rot-meta-row">
                <span className="label">Last updated</span>
                <span className="value mono">{lastUpdatedAt ? formatRelativeTime(lastUpdatedAt.toISOString()) : '—'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="card">
          <div className="card-head">
            <h3>Quick actions</h3>
          </div>
          <div className="qa-grid">
            <button className="qa-btn primary" type="button" onClick={onOpenIssues}>
              <div className="qa-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: 16, height: 16 }}>
                  <circle cx="12" cy="12" r="8"/><path d="M12 8v5"/><path d="M12 16h.01"/>
                </svg>
              </div>
              <div>
                <strong>Triage {openIssues} open {openIssues === 1 ? 'issue' : 'issues'}</strong>
                <small>Review and close documentation mismatches</small>
              </div>
              <div className="chev"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 6l6 6-6 6"/></svg></div>
            </button>
            <button className="qa-btn" type="button" onClick={() => onOpenHistory?.()}>
              <div className="qa-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: 16, height: 16 }}>
                  <path d="M12 8v5l3 2"/><circle cx="12" cy="12" r="8"/>
                </svg>
              </div>
              <div>
                <strong>Review last scan</strong>
                <small>Inspect the most recent scan run</small>
              </div>
              <div className="chev"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 6l6 6-6 6"/></svg></div>
            </button>
            <button className="qa-btn" type="button" onClick={onOpenProjects}>
              <div className="qa-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: 16, height: 16 }}>
                  <path d="M3.5 8h6l1.7 2H20v8a2 2 0 0 1-2 2H5.5a2 2 0 0 1-2-2z"/>
                </svg>
              </div>
              <div>
                <strong>Watch a new repository</strong>
                <small>Connect a GitHub repo to track</small>
              </div>
              <div className="chev"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 6l6 6-6 6"/></svg></div>
            </button>
          </div>
        </div>
      </div>

      {/* Stat strip */}
      <div className="stat-strip">
        {statCards.map((card) => (
          <button
            key={card.title}
            className="stat-cell"
            type="button"
            onClick={statActions[card.title]}
          >
            <div className="stat-label">
              <span className={`dot dot-${card.tone === 'positive' ? 'success' : card.tone === 'negative' ? 'critical' : 'neutral'}`} />
              {card.title}
            </div>
            <div className="stat-value">{card.value}</div>
            <div className="stat-trend">{card.delta}</div>
          </button>
        ))}
      </div>

      {/* Activity + info */}
      <div className="grid-2">
        {/* Activity feed */}
        <div className="card">
          <div className="card-head">
            <h3>Recent Activity</h3>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span className="pill">Last {scans.length} scans</span>
              <button type="button" className="btn btn-sm btn-ghost" onClick={() => onOpenHistory?.()}>All scans</button>
            </div>
          </div>
          <div>
            {activityRows.map((activity) => (
              <button
                key={activity.title}
                className="feed-item"
                type="button"
                onClick={() => onOpenHistory?.(activity.scanId)}
                style={{ boxShadow: `inset 3px 0 0 ${activity.tone === 'success' ? 'var(--success)' : activity.tone === 'warning' ? 'var(--warning)' : activity.tone === 'danger' ? 'var(--critical)' : 'var(--info)'}` }}
              >
                <div className={`feed-icon ${toneToFeedClass(activity.tone)}`}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    {activity.tone === 'success' ? (
                      <><path d="M20 6L9 17l-5-5"/></>
                    ) : activity.tone === 'warning' ? (
                      <><path d="M12 4 21 19H3z"/><path d="M12 9v4"/><path d="M12 16h.01"/></>
                    ) : (
                      <><circle cx="11" cy="11" r="5.5"/><path d="m15 15 5 5"/></>
                    )}
                  </svg>
                </div>
                <div className="feed-copy">
                  <strong>{activity.title}</strong>
                  <small>{activity.subtitle}</small>
                </div>
                <div className="feed-time">{activity.time}</div>
              </button>
            ))}
          </div>
          {scans.length > 4 ? (
            <div style={{ padding: '10px 18px', borderTop: '1px solid var(--border)' }}>
              <button type="button" className="btn btn-sm btn-ghost" style={{ width: '100%', justifyContent: 'center' }} onClick={() => onOpenHistory?.()}>
                View full scan history
              </button>
            </div>
          ) : null}
        </div>

        {/* Summary stats card */}
        <div className="card">
          <div className="card-head">
            <h3>Workspace summary</h3>
          </div>
          <div className="card-pad">
            <div className="rot-meta-list">
              <div className="rot-meta-row">
                <span className="label">User</span>
                <span className="value">{userName ?? '—'}</span>
              </div>
              <div className="rot-meta-row">
                <span className="label">Stream</span>
                <span className="value" style={{ color: streamConnected ? 'var(--success)' : 'var(--ink-3)' }}>
                  {streamConnected ? '● connected' : '○ polling'}
                </span>
              </div>
              <div className="rot-meta-row">
                <span className="label">Repos</span>
                <span className="value mono">{totalProjectCount}</span>
              </div>
              <div className="rot-meta-row">
                <span className="label">Scans</span>
                <span className="value mono">{scans.length}</span>
              </div>
              <div className="rot-meta-row">
                <span className="label">Open issues</span>
                <span className="value mono" style={{ color: openIssues > 0 ? 'var(--critical)' : 'inherit' }}>{openIssues}</span>
              </div>
              <div className="rot-meta-row">
                <span className="label">Health score</span>
                <span className="value mono" style={{ color: rotPct >= 65 ? 'var(--critical)' : rotPct >= 35 ? 'var(--warning)' : 'var(--success)' }}>{rotPct}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}