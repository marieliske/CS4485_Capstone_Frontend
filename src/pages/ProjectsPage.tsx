import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { getRepos, getScanRunsForRepo } from '../api/firestore'
import type { ScanRecord } from '../api/scans'

interface ProjectsPageProps {
  onInspectProject?: (scanId?: string) => void
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
      : Math.round(sortedScans.reduce((sum, scan) => sum + clampScore(scan.rot_score), 0) / sortedScans.length)

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

export function ProjectsPage({ onInspectProject }: ProjectsPageProps) {
  const [projectRows, setProjectRows] = useState<ProjectRow[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const deferredQuery = useDeferredValue(query)

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
      {showCreateForm ? (
        <section className="configuration-section" style={{ display: 'grid', gap: '0.9rem', marginBottom: '1rem' }}>
          <div className="configuration-section-head">
            <h3>Create New Project</h3>
            <button type="button" className="config-link-btn" onClick={() => setShowCreateForm(false)}>
              Cancel
            </button>
          </div>

          <input
            aria-label="Project name"
            className="scan-history-search-input"
            placeholder="Project name"
            value={newProjectName}
            onChange={(event) => setNewProjectName(event.target.value)}
          />

          <input
            aria-label="Repository path"
            className="scan-history-search-input"
            placeholder="owner/repository"
            value={newRepository}
            onChange={(event) => setNewRepository(event.target.value)}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="button" className="create-project-btn" onClick={handleCreateProject}>
              Save Project
            </button>
          </div>
        </section>
      ) : null}

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
          placeholder="Search projects"
          value={query}
        />
        <span className="projects-filter-btn">Showing {filteredRows.length} projects</span>
      </div>

      <section className="projects-list-shell">
        {loading ? (
          <div className="page-placeholder">Loading projects from backend scan data…</div>
        ) : filteredRows.length === 0 ? (
          <div className="page-placeholder">{error ?? 'No projects match your search.'}</div>
        ) : (
          <div className="projects-card-list">
            {filteredRows.map((project) => {
              const isExpanded = expandedProjectKey === project.repository
              const issues = expandedIssues[project.repository] ?? []

              return (
                <article key={project.repository} className="project-card">
                  <div className="project-card-top">
                    <div className="project-card-main">
                      <div className="project-card-title-row">
                        <h3 className="project-card-title">{project.name}</h3>
                        <span className={`project-status ${project.statusTone}`}>
                          <span className="status-dot" aria-hidden="true" />
                          {project.latestStatus}
                        </span>
                      </div>

                      <p className="project-card-repo">{project.repository}</p>

                      <div className="project-card-meta">
                        <span><strong>{formatScanRunLabel(project.lastUpdated)}</strong></span>
                        <span>{project.scanCount} scan{project.scanCount === 1 ? '' : 's'}</span>
                        <span>
                          {project.latestMismatchCount} mismatch{project.latestMismatchCount === 1 ? '' : 'es'}
                        </span>
                        <span>ID: {shortenScanId(project.latestScanId)}</span>
                      </div>
                    </div>

                    <div className="project-card-gauge">
                      <RotGauge score={project.score} compact />
                    </div>
                  </div>

                  <div className="project-card-actions">
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => handleToggleExpand(project)}
                    >
                      {isExpanded ? 'Hide' : 'Inspect'}
                    </button>

                    {project.latestScanId ? (
                      <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() => onInspectProject?.(project.latestScanId)}
                      >
                        Full View
                      </button>
                    ) : null}
                  </div>

                  {isExpanded ? (
                    <div className="project-card-expanded">
                      <div className="project-details-grid">
                        <div className="project-details-card">
                          <p className="detail-label">Project Summary</p>
                          <p className="detail-copy">
                            <strong>{project.name}</strong> has {project.scanCount} total scan
                            {project.scanCount === 1 ? '' : 's'}, a latest rot score of{' '}
                            <strong>{project.score}%</strong>, and{' '}
                            <strong>{project.latestMismatchCount}</strong> detected mismatch
                            {project.latestMismatchCount === 1 ? '' : 'es'}.
                          </p>
                        </div>

                        <div className="project-details-card">
                          <p className="detail-label">Latest Run</p>
                          <p className="detail-copy">{formatScanRunLabel(project.lastUpdated)}</p>
                          <p className="detail-copy" style={{ opacity: 0.75 }}>
                            Scan ref: {shortenScanId(project.latestScanId)}
                          </p>
                        </div>
                      </div>

                      <div className="project-details-card">
                        <p className="detail-label">Issues</p>

                        {!project.latestScanId ? (
                          <p className="detail-copy">This project does not have a latest scan yet.</p>
                        ) : expandedLoadingKey === project.repository ? (
                          <p className="detail-copy">Loading issues…</p>
                        ) : issues.length === 0 ? (
                          <p className="detail-copy">No linked issues were returned for the latest scan.</p>
                        ) : (
                          <ul className="project-issues-list">
                            {issues.slice(0, 5).map((issue, index) => (
                              <li key={`${project.repository}-issue-${index}`}>
                                {summarizeIssue(issue, index)}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  ) : null}
                </article>
              )
            })}
          </div>
        )}

        <footer className="projects-table-footer">
          <span>Showing {filteredRows.length} of {projectRows.length} projects</span>
        </footer>
      </section>
    </section>
  )
}
