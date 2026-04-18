import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { getRepos, getScanRunsForRepo } from '../api/firestore'
import type { ScanRecord } from '../api/scans'
import RotGauge from '../components/shared/RotGauge'

interface ProjectRow {
  name: string
  repository: string
  latestStatus: string
  statusTone: 'healthy' | 'degrading' | 'critical' | 'untracked'
  latestScanId?: string
  latestMismatchCount: number
  scanCount: number
  score: number
  lastUpdated: string
}

interface ProjectsPageProps {
  onInspectProject?: (scanId?: string) => void
}

function asFiniteNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function pickNumber(source: unknown, keys: string[]): number | null {
  if (!source || typeof source !== 'object') {
    return null
  }

  const record = source as Record<string, unknown>

  for (const key of keys) {
    const parsed = asFiniteNumber(record[key])
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

function getStatusTone(score: number, mismatchCount: number): ProjectRow['statusTone'] {
  if (score <= 20 && mismatchCount === 0) {
    return 'healthy'
  }
  if (score <= 60) {
    return 'degrading'
  }
  return 'critical'
}

function getLatestStatus(score: number, mismatchCount: number): string {
  if (score <= 20 && mismatchCount === 0) {
    return 'Healthy'
  }
  if (score <= 60) {
    return 'Needs Review'
  }
  return 'Rotten'
}

function toProjectRow(repoName: string, scans: ScanRecord[]): ProjectRow {
  const sortedScans = [...scans].sort((a, b) => {
    const aDate = typeof a.created_at === 'string' ? new Date(a.created_at).getTime() : 0
    const bDate = typeof b.created_at === 'string' ? new Date(b.created_at).getTime() : 0
    return bDate - aDate
  })

  const latestScan = sortedScans[0] ?? {}
  const latestScore = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        pickNumber(latestScan, ['rot_score', 'score', 'health_index', 'healthIndex']) ?? 0,
      ),
    ),
  )
  const latestMismatchCount = Math.max(
    0,
    Math.round(
      pickNumber(latestScan, ['mismatch_count', 'mismatches', 'total_issues', 'issue_count']) ?? 0,
    ),
  )
  const latestStatus =
    (typeof latestScan.status === 'string' && latestScan.status) ||
    getLatestStatus(latestScore, latestMismatchCount)

  const statusTone = getStatusTone(latestScore, latestMismatchCount)

  return {
    name: repoName.split('/').at(-1) || repoName,
    repository: repoName,
    latestStatus,
    statusTone,
    latestScanId: typeof latestScan.id === 'string' ? latestScan.id : undefined,
    latestMismatchCount,
    scanCount: sortedScans.length,
    score: latestScore,
    lastUpdated: typeof latestScan.created_at === 'string' ? latestScan.created_at : '',
  }
}

export function ProjectsPage({ onInspectProject }: ProjectsPageProps) {
  const [projectRows, setProjectRows] = useState<ProjectRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  const deferredQuery = useDeferredValue(query)

  useEffect(() => {
    let cancelled = false

    async function loadProjects() {
      setLoading(true)

      try {
        const repos = await getRepos()
        const rows: ProjectRow[] = []

        for (const repo of repos) {
          const scans = await getScanRunsForRepo(repo.id)
          rows.push(toProjectRow(repo.full_name || repo.id, scans))
        }

        if (!cancelled) {
          rows.sort((a, b) => a.name.localeCompare(b.name))
          setProjectRows(rows)
          setError(repos.length === 0 ? 'No projects are available yet. Run a scan to get started.' : null)
        }
      } catch (err) {
        if (!cancelled) {
          setProjectRows([])
          setError(err instanceof Error ? err.message : 'Unable to load projects from Firestore.')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadProjects()

    return () => {
      cancelled = true
    }
  }, [])

  const filteredRows = useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLowerCase()
    if (!normalizedQuery) {
      return projectRows
    }

    return projectRows.filter((project) =>
      [project.name, project.repository, project.latestStatus].some((value) =>
        value.toLowerCase().includes(normalizedQuery),
      ),
    )
  }, [deferredQuery, projectRows])

  const latestUpdated = projectRows
    .map((project) => project.lastUpdated)
    .filter((value) => value.length > 0)
    .sort()
    .at(-1)

  const projectsWithAlerts = projectRows.filter((project) => project.latestMismatchCount > 0).length
  const meanRotScore =
    projectRows.length === 0
      ? 0
      : Math.round(projectRows.reduce((sum, project) => sum + project.score, 0) / projectRows.length)

  const statCards = [
    { label: 'Total Projects', value: `${projectRows.length}`, warning: false },
    { label: 'Active Alerts', value: `${projectsWithAlerts}`, warning: projectsWithAlerts > 0 },
    { label: 'Mean Rot Score', value: `${meanRotScore}%`, warning: meanRotScore >= 60 },
    { label: 'Last Update', value: latestUpdated ? formatRelativeTime(latestUpdated) : 'No scans', warning: false },
  ] as const

  return (
    <section className="projects-page">
      <div className="projects-stats-grid">
        {statCards.map((card) => (
          <article key={card.label} className="projects-stat-card">
            <p>{card.label}</p>
            <strong className={card.warning ? 'warning' : undefined}>{card.value}</strong>
          </article>
        ))}
      </div>

      <div className="projects-filter-row">
        <input
          aria-label="Search projects"
          className="scan-history-search-input"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search project or repository path"
          value={query}
        />
        <span className="projects-filter-btn">Showing {filteredRows.length} projects</span>
      </div>

      <section className="projects-table-shell">
        {loading ? (
          <div className="page-placeholder">Loading projects from backend scan data…</div>
        ) : filteredRows.length === 0 ? (
          <div className="page-placeholder">{error ?? 'No projects match your search.'}</div>
        ) : (
          <table className="projects-table">
            <thead>
              <tr>
                <th>Project Name</th>
                <th>Repository</th>
                <th>Latest Status</th>
                <th>Latest Scan</th>
                <th>Rot Score</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((project) => (
                <tr key={project.repository}>
                  <td className="project-name-cell">{project.name}</td>
                  <td className="project-repo-cell">{project.repository}</td>
                  <td>
                    <span className={`project-status ${project.statusTone}`}>
                      <span className="status-dot" aria-hidden="true" />
                      {project.latestStatus}
                    </span>
                  </td>
                  <td>
                    <div className="project-scan-cell">
                      <strong>{project.latestScanId ?? 'Unavailable'}</strong>
                      <small>
                        {project.scanCount} scan{project.scanCount === 1 ? '' : 's'} • {project.latestMismatchCount} mismatch
                        {project.latestMismatchCount === 1 ? '' : 'es'}
                      </small>
                    </div>
                  </td>
                  <td>
                    <div className="project-gauge-cell">
                      <RotGauge score={project.score} compact />
                    </div>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      disabled={!project.latestScanId}
                      onClick={() => onInspectProject?.(project.latestScanId)}
                    >
                      Inspect
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <footer className="projects-table-footer">
          <span>Showing {filteredRows.length} of {projectRows.length} projects</span>
        </footer>
      </section>
    </section>
  )
}