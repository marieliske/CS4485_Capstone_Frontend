import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { getRepos, getScanRunsForRepo } from '../api/firestore'
import { getScanIssues } from '../api/scans'
import type { ScanIssueRecord, ScanRecord } from '../api/scans'
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

function asObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object') {
    return {}
  }
  return value as Record<string, unknown>
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
  if (score <= 40) {
    return 'Slightly Stale'
  }
  if (score <= 60) {
    return 'Needs Review'
  }
  if (score <= 80) {
    return 'At Risk'
  }
  return 'Rotten'
}

function summarizeIssue(record: ScanIssueRecord, index: number): string {
  const issue = asObject(record)
  return (
    (typeof issue.title === 'string' && issue.title) ||
    (typeof issue.message === 'string' && issue.message) ||
    (typeof issue.symbol === 'string' && issue.symbol) ||
    (typeof issue.code_path === 'string' && issue.code_path) ||
    `Issue ${index + 1}`
  )
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

const PAGE_SIZE = 25

export function ProjectsPage({ onInspectProject, searchQuery }: ProjectsPageProps) {
  const [projectRows, setProjectRows] = useState<ProjectRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [newRepository, setNewRepository] = useState('')
  const [expandedProjectKey, setExpandedProjectKey] = useState<string | null>(null)
  const [expandedIssues, setExpandedIssues] = useState<Record<string, ScanIssueRecord[]>>({})
  const [expandedLoadingKey, setExpandedLoadingKey] = useState<string | null>(null)

  useEffect(() => { setPage(0) }, [deferredQuery])

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

  useEffect(() => {
    const handleCreateProject = () => {
      setShowCreateForm(true)
    }

    window.addEventListener('projects:create', handleCreateProject)

    return () => {
      window.removeEventListener('projects:create', handleCreateProject)
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

  const totalPages = Math.ceil(filteredRows.length / PAGE_SIZE)
  const pagedRows = filteredRows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

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
    {
      label: 'Last Update',
      value: latestUpdated ? formatRelativeTime(latestUpdated) : 'No scans',
      warning: false,
    },
  ] as const

  const handleCreateProject = () => {
    const trimmedName = newProjectName.trim()
    const trimmedRepo = newRepository.trim()

    if (!trimmedName || !trimmedRepo) {
      window.alert('Please enter both a project name and repository path.')
      return
    }

    const newProject: ProjectRow = {
      name: trimmedName,
      repository: trimmedRepo,
      latestStatus: 'Untracked',
      statusTone: 'untracked',
      latestScanId: undefined,
      latestMismatchCount: 0,
      scanCount: 0,
      score: 0,
      lastUpdated: '',
    }

    setProjectRows((prev) => [newProject, ...prev])
    setNewProjectName('')
    setNewRepository('')
    setShowCreateForm(false)
    setError(null)
  }

  const handleToggleExpand = async (project: ProjectRow) => {
    const key = project.repository

    if (expandedProjectKey === key) {
      setExpandedProjectKey(null)
      return
    }

    setExpandedProjectKey(key)

    if (!project.latestScanId || expandedIssues[key]) {
      return
    }

    try {
      setExpandedLoadingKey(key)
      const issues = await getScanIssues(project.latestScanId)
      setExpandedIssues((prev) => ({ ...prev, [key]: issues }))
    } catch {
      setExpandedIssues((prev) => ({ ...prev, [key]: [] }))
    } finally {
      setExpandedLoadingKey(null)
    }
  }

  return (
    <section className="projects-page">
      {showCreateForm ? (
        <section className="configuration-section" style={{ display: 'grid', gap: '0.9rem' }}>
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
              {filteredRows.map((project) => {
                const isExpanded = expandedProjectKey === project.repository
                const issues = expandedIssues[project.repository] ?? []

                return (
                  <>
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
                          <strong>{formatScanRunLabel(project.lastUpdated)}</strong>
                          <small>
                            {project.scanCount} scan{project.scanCount === 1 ? '' : 's'} • {project.latestMismatchCount} mismatch
                            {project.latestMismatchCount === 1 ? '' : 'es'}
                          </small>
                          <small className="scan-id-meta">ID: {shortenScanId(project.latestScanId)}</small>
                        </div>
                      </td>
                      <td>
                        <div className="project-gauge-cell">
                          <RotGauge score={project.score} compact />
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            className="btn btn-ghost"
                            onClick={() => handleToggleExpand(project)}
                          >
                            {isExpanded ? 'Hide Details' : 'Inspect'}
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
                      </td>
                    </tr>

                    {isExpanded ? (
                      <tr key={`${project.repository}-details`} className="project-details-row">
                        <td colSpan={6}>
                          <div className="project-details-panel">
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
                              <p className="detail-label">Latest Scan Issues</p>

                              {!project.latestScanId ? (
                                <p className="detail-copy">
                                  This project does not have a latest scan yet.
                                </p>
                              ) : expandedLoadingKey === project.repository ? (
                                <p className="detail-copy">Loading issues…</p>
                              ) : issues.length === 0 ? (
                                <p className="detail-copy">
                                  No linked issues were returned for the latest scan.
                                </p>
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
                        </td>
                      </tr>
                    ) : null}
                  </>
                )
              })}
            </tbody>
          </table>
        )}

        <footer className="projects-table-footer">
          <span>
            Showing {filteredRows.length} of {projectRows.length} projects
          </span>
        </footer>
      </section>
    </section>
  )
}