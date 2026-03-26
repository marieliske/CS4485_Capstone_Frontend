import { useCallback, useEffect, useMemo, useState } from 'react'
import { getFingerprintSummary, getScanIssues, getScans, type ScanRecord } from '../api/scans'
import { useScanEvents } from '../hooks/useScanEvents'

type StatCardTone = 'positive' | 'negative'
type ActivityTone = 'success' | 'warning' | 'info' | 'danger'

interface DashboardActivity {
  title: string
  subtitle: string
  time: string
  tone: ActivityTone
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

export function DashboardPage() {
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

  const statCards = useMemo(
    () => [
      {
        title: 'Total Projects',
        value: `${new Set(scans.map((scan) => scan.repo_path).filter((path) => typeof path === 'string' && path.length > 0)).size}`,
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
        value: `${Math.max(0, Math.min(100, Math.round(healthIndex ?? 0)))}%`,
        delta: 'live',
        tone: 'positive' as StatCardTone,
        icon: 'chart' as const,
      },
    ],
    [healthIndex, openIssues, scans],
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
      const tone: ActivityTone = (mismatches ?? 0) > 0 ? 'warning' : score !== null && score >= 80 ? 'success' : 'info'

      return {
        title: `Scan Completed: ${scan.id || `Scan ${index + 1}`}`,
        subtitle:
          mismatches !== null
            ? `Detected ${mismatches} potential mismatch${mismatches === 1 ? '' : 'es'} in this run.`
            : `Status: ${scan.status || 'unknown'}`,
        time: formatRelativeTime(scan.created_at),
        tone,
      }
    })
  }, [scans])

  const healthProgress = Math.max(0, Math.min(100, Math.round(healthIndex ?? 0)))

  return (
    <section className="dashboard-page">
      <header className="dashboard-welcome">
        <h2>Welcome back, Team 2</h2>
        <p>Here&apos;s a live summary of your documentation health from the backend API.</p>
        <div className="dashboard-live-meta">
          <span className={loading ? 'dashboard-live-pill loading' : 'dashboard-live-pill'}>
            {loading ? 'Refreshing...' : streamConnected ? 'Live stream' : 'Polling mode'}
          </span>
          {lastUpdatedAt ? <small>Last updated {formatRelativeTime(lastUpdatedAt.toISOString())}</small> : null}
          {error ? <small className="dashboard-error-text">{error}</small> : null}
        </div>
      </header>

      <div className="dashboard-stats-grid">
        {statCards.map((card) => (
          <article key={card.title} className="dashboard-stat-card">
            <div className="dashboard-stat-top-row">
              <span className="dashboard-tile-icon" aria-hidden="true">
                <StatIcon type={card.icon} />
              </span>
              <span className={`dashboard-delta-pill ${card.tone}`}>{card.delta}</span>
            </div>
            <p className="dashboard-stat-title">{card.title}</p>
            <p className="dashboard-stat-value">{card.value}</p>
          </article>
        ))}
      </div>

      <div className="dashboard-bottom-grid">
        <section className="dashboard-panel activity-panel">
          <header className="dashboard-panel-headline">
            <h3>Recent Activity</h3>
            <button type="button" className="dashboard-text-link">
                latest scans
            </button>
          </header>

          <ul className="activity-list">
            {activityRows.map((activity) => (
              <li key={activity.title} className="activity-row">
                <span className={`activity-dot ${activity.tone}`} aria-hidden="true" />
                <div className="activity-copy">
                  <p>{activity.title}</p>
                  <small>{activity.subtitle}</small>
                </div>
                <span className="activity-time">{activity.time}</span>
              </li>
            ))}
          </ul>
        </section>

        <aside className="dashboard-panel quick-actions-panel">
          <h3>Quick Actions</h3>
          <button type="button" className="action-primary-btn">
            <span>New Scan</span>
            <span aria-hidden="true">→</span>
          </button>

          <div className="action-secondary-grid">
            <button type="button" className="action-secondary-btn">
              Add Project
            </button>
            <button type="button" className="action-secondary-btn">
              Reports
            </button>
          </div>

          <section className="health-card">
            <header>
              <h4>Health Index</h4>
              <strong>{healthProgress}%</strong>
            </header>
            <div
              className="health-track"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={healthProgress}
            >
              <span style={{ width: `${healthProgress}%` }} />
            </div>
            <p>Based on the latest backend scan and fingerprint summary data.</p>
          </section>
        </aside>
      </div>
    </section>
  )
}
