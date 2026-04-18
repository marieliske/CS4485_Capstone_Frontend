import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  getAISuggestions,
  getFingerprintSummary,
  getScanIssues,
  getScans,
  type AISuggestionRecord,
  type ScanRecord,
} from '../api/scans'
import { useScanEvents } from '../hooks/useScanEvents'
import RotGauge from '../components/shared/RotGauge'

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

function pickFirstString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null
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

function isProviderErrorText(text: string): boolean {
  const normalized = text.toLowerCase()

  return (
    normalized.includes('rate limit') ||
    normalized.includes('api 429') ||
    normalized.includes('ai suggestion unavailable') ||
    normalized.includes('groq api') ||
    normalized.includes('"error"') ||
    normalized.includes('tokens per day')
  )
}

function getSuggestionSummary(suggestion: AISuggestionRecord | undefined): string | null {
  if (!suggestion) return null

  const record = suggestion as unknown as Record<string, unknown>

  const candidate =
    pickFirstString(record.summary) ??
    pickFirstString(record.suggestion) ??
    pickFirstString(record.text) ??
    pickFirstString(record.content) ??
    pickFirstString(record.message) ??
    null

  if (!candidate) return null
  if (isProviderErrorText(candidate)) return null

  return candidate
}

function getSuggestionDocName(suggestion: AISuggestionRecord | undefined): string | null {
  if (!suggestion) return null

  const record = suggestion as unknown as Record<string, unknown>

  return (
    pickFirstString(record.doc_path) ??
    pickFirstString(record.docPath) ??
    pickFirstString(record.file) ??
    pickFirstString(record.file_path) ??
    pickFirstString(record.path) ??
    null
  )
}

function getFallbackFixSummary(
  healthScore: number,
  openIssues: number,
  mismatchCount: number,
  docName: string | null,
): string {
  const docTarget = docName ? `${docName}` : 'the flagged documentation'

  if (healthScore <= 20) {
    return `Your documentation looks healthy overall. Keep monitoring ${docTarget} for smaller drift as new scans come in.`
  }

  if (healthScore <= 40) {
    return `Some drift is starting to appear. Review ${docTarget} and verify that examples, setup steps, and behavior descriptions still match the current code.`
  }

  if (healthScore <= 60) {
    return `Your documentation needs review soon. Start with ${docTarget}, then work through the ${openIssues} open issue${openIssues === 1 ? '' : 's'} and ${mismatchCount} detected mismatch${mismatchCount === 1 ? '' : 'es'}.`
  }

  if (healthScore <= 80) {
    return `Your documentation is at risk of misleading users. Prioritize ${docTarget}, confirm the latest behavior changes, and resolve the most visible stale sections first.`
  }

  return `Your documentation appears significantly out of sync. Immediately review ${docTarget}, update any outdated architecture or workflow descriptions, and fix the highest-impact mismatches before sharing this with users.`
}

function splitSuggestionIntoPoints(
  text: string | null,
  docName: string | null,
  openIssues: number,
  mismatchCount: number,
): string[] {
  if (text) {
    const extracted = text
      .split(/\n|•|- /)
      .map((part) => part.trim())
      .filter((part) => part.length > 20)

    if (extracted.length > 1) {
      return extracted.slice(0, 3)
    }
  }

  const docTarget = docName ?? 'the flagged documentation'

  return [
    `Review ${docTarget} first and verify it matches the latest implementation.`,
    'Check architecture, workflow descriptions, and usage examples against current behavior.',
    `Resolve ${openIssues} open issue${openIssues === 1 ? '' : 's'} and ${mismatchCount} detected mismatch${mismatchCount === 1 ? '' : 'es'} in priority order.`,
  ]
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
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestionRecord[]>([])
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
        const [latestIssues, latestSuggestions] = await Promise.all([
          getScanIssues(latestScanId),
          getAISuggestions(latestScanId).catch(() => []),
        ])

        latestOpenIssueCount = latestIssues.filter((issue) => {
          const status = (issue as Record<string, unknown>).status
          return status !== 'closed'
        }).length

        setAiSuggestions(latestSuggestions)
      } else {
        setAiSuggestions([])
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

  const latestMismatchCount = Math.max(0, Number(scans[0]?.mismatch_count ?? 0))
  const latestSuggestion = aiSuggestions[0]
  const latestSuggestionDocName = getSuggestionDocName(latestSuggestion)
  const latestSuggestionSummary =
    getSuggestionSummary(latestSuggestion) ??
    getFallbackFixSummary(
      healthProgress,
      openIssues,
      latestMismatchCount,
      latestSuggestionDocName,
    )
  const latestSuggestionPoints = splitSuggestionIntoPoints(
    latestSuggestionSummary,
    latestSuggestionDocName,
    openIssues,
    latestMismatchCount,
  )

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

  const statActions: Record<string, (() => void) | undefined> = {
    'Total Projects': onOpenProjects,
    'Total Scans': () => onOpenHistory?.(),
    'Open Issues': onOpenIssues,
    'Latest Scan Score': () => onOpenHistory?.(scans[0]?.id),
  }

  return (
    <section className="dashboard-page">
      <header className="dashboard-welcome">
        <h2>Welcome back{userName ? `, ${userName}` : ''}</h2>
        <p>Here&apos;s a live summary of your documentation health from Firestore.</p>
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
          <button
            key={card.title}
            className={`dashboard-stat-card dashboard-stat-card-button ${statActions[card.title] ? 'interactive' : ''}`}
            onClick={statActions[card.title]}
            type="button"
          >
            <div className="dashboard-stat-top-row">
              <span className="dashboard-tile-icon" aria-hidden="true">
                <StatIcon type={card.icon} />
              </span>
              <span className={`dashboard-delta-pill ${card.tone}`}>{card.delta}</span>
            </div>
            <p className="dashboard-stat-title">{card.title}</p>
            <p className="dashboard-stat-value">{card.value}</p>
            {card.title === 'Total Projects' ? (
              <small className="dashboard-card-meta">{totalProjectCount > 0 ? 'Open project workspace' : 'Awaiting scans'}</small>
            ) : (
              <small className="dashboard-card-meta">Open detail view</small>
            )}
          </button>
        ))}
      </div>

      <div className="dashboard-bottom-grid">
        <section className="dashboard-panel activity-panel">
          <header className="dashboard-panel-headline">
            <h3>Recent Activity</h3>
            <button type="button" className="dashboard-text-link" onClick={() => onOpenHistory?.()}>
              latest scans
            </button>
          </header>

          <ul className="activity-list">
            {activityRows.map((activity) => (
              <li key={activity.title} className="activity-row">
                <button
                  className={`activity-row-button ${activity.scanId ? 'interactive' : ''}`}
                  onClick={() => onOpenHistory?.(activity.scanId)}
                  type="button"
                >
                  <span className={`activity-dot ${activity.tone}`} aria-hidden="true" />
                  <div className="activity-copy">
                    <p>{activity.title}</p>
                    <small>{activity.subtitle}</small>
                  </div>
                  <span className="activity-time">{activity.time}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <aside className="dashboard-panel quick-actions-panel">
          <h3>Quick Actions</h3>
          <button type="button" className="action-primary-btn" onClick={() => onOpenHistory?.()}>
            <span>New Scan</span>
            <span aria-hidden="true">-&gt;</span>
          </button>

          <div className="action-secondary-grid">
            <button type="button" className="action-secondary-btn" onClick={onOpenProjects}>
              Add Project
            </button>
            <button type="button" className="action-secondary-btn" onClick={() => onOpenHistory?.()}>
              Scan History
            </button>
          </div>

          <section className="health-card">
            <header>
              <h4>Documentation Rot</h4>
            </header>

            <RotGauge score={healthProgress} />

            <p>Based on the latest scan&apos;s rot score.</p>

            <div className="ai-fix-card">
              <h5>AI Fix Summary</h5>
              {latestSuggestionDocName && (
                <div className="ai-fix-doc">
                  <span className="ai-fix-doc-label">Focus</span>
                  <strong>{latestSuggestionDocName}</strong>
                </div>
              )}
              
              <p className="ai-summary">{latestSuggestionSummary}</p>
              
              <div className="ai-divider" />
              
              <ul className="ai-fix-points">
                {latestSuggestionPoints.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </div>
          </section>
        </aside>
      </div>
    </section>
  )
}