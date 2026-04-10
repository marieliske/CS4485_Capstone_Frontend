import { useDeferredValue, useMemo, useState } from 'react'
import { getRepos, getScanRunsForRepo } from '../api/firestore'
import type { ScanRecord } from '../api/scans'

interface ProjectsPageProps {
  onInspectProject?: (scanId?: string) => void
  searchQuery?: string
}

interface ProjectRow {
  name: string
  repository: string
  latestScanId?: string
  latestStatus: string
  statusTone: 'healthy' | 'degrading' | 'critical' | 'untracked'
  score: number
  scoreWidth: string
  scoreTone: 'healthy' | 'degrading' | 'critical' | 'untracked'
  latestMismatchCount: number
  scanCount: number
  lastUpdated: string
}

function clampScore(value?: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return 0
  }

  return Math.max(0, Math.min(100, Math.round(value)))
}

function projectName(repository: string): string {
  const normalized = repository.replace(/\\/g, '/')
  const parts = normalized.split('/').filter(Boolean)
  return parts[parts.length - 1] ?? repository
}

function formatRelativeTime(value?: string): string {
  if (!value) {
    return 'Not available'
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return value
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

  return `${Math.floor(hours / 24)}d ago`
}

function toProjectRow(repository: string, scans: ScanRecord[]): ProjectRow {
  const sortedScans = [...scans].sort((left, right) => {
    const leftTime = Date.parse(left.created_at ?? '')
    const rightTime = Date.parse(right.created_at ?? '')
    return rightTime - leftTime
  })

  const latestScan = sortedScans[0]
  const averageScore =
    sortedScans.length === 0
      ? 0
      : clampScore(sortedScans[0].rot_score)

  let statusTone: ProjectRow['statusTone'] = 'healthy'
  if (!latestScan) {
    statusTone = 'untracked'
  } else if (latestScan.status === 'failed' || averageScore > 50) {
    statusTone = 'critical'
  } else if ((latestScan.mismatch_count ?? 0) > 0 || averageScore > 20) {
    statusTone = 'degrading'
  }

  return {
    name: projectName(repository),
    repository,
    latestScanId: latestScan?.id,
    latestStatus: latestScan?.status ?? 'untracked',
    statusTone,
    score: averageScore,
    scoreWidth: `${averageScore}%`,
    scoreTone: statusTone,
    latestMismatchCount: latestScan?.mismatch_count ?? 0,
    scanCount: sortedScans.length,
    lastUpdated: latestScan?.created_at ?? '',
  }
}

export function ProjectsPage({ onInspectProject, searchQuery }: ProjectsPageProps) {
  const [projectRows, setProjectRows] = useState<ProjectRow[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const activeQuery = searchQuery !== undefined && searchQuery !== '' ? searchQuery : query
  const deferredQuery = useDeferredValue(activeQuery)

  useEffect(() => {
    let cancelled = false

    async function loadProjects() {
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
    { label: 'Mean Rot Score', value: `${meanRotScore}%`, warning: meanRotScore < 60 },
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
          value={activeQuery}
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
                    <div className="rot-score-cell">
                      <div className="rot-track">
                        <span className={project.scoreTone} style={{ width: project.scoreWidth }} />
                      </div>
                      <strong>{project.score}%</strong>
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
