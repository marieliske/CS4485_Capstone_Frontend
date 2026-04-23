import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { getRepos, getScanRunsForRepo } from '../api/firestore'
import { getScanIssues } from '../api/scans'
import type { ScanIssueRecord, ScanRecord } from '../api/scans'

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

function rotColor(score: number): string {
  return score >= 65 ? 'var(--critical)' : score >= 35 ? 'var(--warning)' : 'var(--success)'
}

export function ProjectsPage({ onInspectProject }: ProjectsPageProps) {
  const [projectRows, setProjectRows] = useState<ProjectRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sort, setSort] = useState('name')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [newRepository, setNewRepository] = useState('')
  const [expandedProjectKey, setExpandedProjectKey] = useState<string | null>(null)
  const [expandedIssues, setExpandedIssues] = useState<Record<string, ScanIssueRecord[]>>({})
  const [expandedLoadingKey, setExpandedLoadingKey] = useState<string | null>(null)
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

  useEffect(() => {
    const handleCreateProject = () => {
      setShowCreateForm(true)
    }

    window.addEventListener('projects:create', handleCreateProject)

    return () => {
      window.removeEventListener('projects:create', handleCreateProject)
    }
  }, [])

  const counts = {
    all: projectRows.length,
    critical: projectRows.filter((p) => p.statusTone === 'critical').length,
    degrading: projectRows.filter((p) => p.statusTone === 'degrading').length,
    healthy: projectRows.filter((p) => p.statusTone === 'healthy').length,
    untracked: projectRows.filter((p) => p.statusTone === 'untracked').length,
  }

  const filteredRows = useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLowerCase()
    return projectRows.filter((project) => {
      const matchesStatus = statusFilter === 'all' || project.statusTone === statusFilter
      if (!matchesStatus) return false
      if (!normalizedQuery) return true
      return [project.name, project.repository, project.latestStatus].some((v) =>
        v.toLowerCase().includes(normalizedQuery),
      )
    })
  }, [deferredQuery, projectRows, statusFilter])

  const sortedRows = useMemo(() => {
    return [...filteredRows].sort((a, b) => {
      if (sort === 'rot-desc') return b.score - a.score
      if (sort === 'rot-asc') return a.score - b.score
      return a.name.localeCompare(b.name)
    })
  }, [filteredRows, sort])

  const meanRotScore =
    projectRows.length === 0
      ? 0
      : Math.round(
          projectRows
            .filter((p) => p.statusTone !== 'untracked')
            .reduce((sum, p) => sum + p.score, 0) /
            Math.max(1, projectRows.filter((p) => p.statusTone !== 'untracked').length),
        )

  const totalIssues = projectRows.reduce((s, p) => s + p.latestMismatchCount, 0)

  const mostRottenRepo = [...projectRows].sort((a, b) => b.score - a.score)[0]

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
    <div>
      <div className="page-head">
        <div>
          <div className="kicker">{projectRows.length} repositories</div>
          <h1>Projects</h1>
          <p className="sub">
            Everything DocRot is watching.
            {mostRottenRepo && mostRottenRepo.score > 0
              ? ` Rot is concentrated in ${mostRottenRepo.name} — start there.`
              : ''}
          </p>
        </div>
        <div className="page-head-actions">
          <button
            type="button"
            className="btn btn-accent"
            onClick={() => setShowCreateForm(true)}
          >
            + Add repository
          </button>
        </div>
      </div>

      {showCreateForm ? (
        <div className="card" style={{ marginBottom: 16, overflow: 'visible' }}>
          <div className="card-head">
            <h3>Add Repository</h3>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setShowCreateForm(false)}
            >
              Cancel
            </button>
          </div>
          <div style={{ padding: 20, display: 'grid', gap: 12 }}>
            <input
              aria-label="Project name"
              className="input"
              placeholder="Project name"
              value={newProjectName}
              onChange={(event) => setNewProjectName(event.target.value)}
            />
            <input
              aria-label="Repository path"
              className="input"
              placeholder="owner/repository"
              value={newRepository}
              onChange={(event) => setNewRepository(event.target.value)}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-accent" onClick={handleCreateProject}>
                Save Project
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Stat strip */}
      <div className="hist-stat-strip" style={{ marginBottom: 16 }}>
        {[
          {
            label: 'Repos watched',
            value: projectRows.filter((p) => p.statusTone !== 'untracked').length,
            note: `${counts.untracked} untracked`,
            color: null,
          },
          {
            label: 'Critical',
            value: counts.critical,
            note: 'need attention now',
            color: counts.critical > 0 ? 'var(--critical)' : null,
          },
          {
            label: 'Avg rot score',
            value: `${meanRotScore}%`,
            note: 'tracked repos',
            color:
              meanRotScore > 50
                ? 'var(--critical)'
                : meanRotScore > 25
                  ? 'var(--warning)'
                  : null,
          },
          {
            label: 'Open issues',
            value: totalIssues,
            note: 'across workspace',
            color: totalIssues > 10 ? 'var(--critical)' : null,
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
            ['all', 'All', counts.all],
            ['critical', 'Critical', counts.critical],
            ['degrading', 'Degrading', counts.degrading],
            ['healthy', 'Healthy', counts.healthy],
            ['untracked', 'Untracked', counts.untracked],
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
        <div className="filter-search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="11" cy="11" r="5.5" />
            <path d="m15 15 5 5" />
          </svg>
          <input
            type="text"
            placeholder="Search projects…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search projects"
          />
        </div>
        <select
          className="select"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          style={{ padding: '5px 9px', fontSize: 12 }}
          aria-label="Sort projects"
        >
          <option value="rot-desc">Rot ↓</option>
          <option value="rot-asc">Rot ↑</option>
          <option value="name">Name A–Z</option>
        </select>
      </div>

      {/* Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div className="page-placeholder">Loading projects from backend scan data…</div>
        ) : sortedRows.length === 0 ? (
          <div className="empty">
            <h4>No projects found</h4>
            <p>{error ?? 'No projects match your current filters.'}</p>
          </div>
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th>Repository</th>
                <th style={{ width: 210 }}>Rot score</th>
                <th style={{ width: 90 }}>Issues</th>
                <th style={{ width: 80 }}>Scans</th>
                <th style={{ width: 130 }}>Last scan</th>
                <th style={{ width: 110 }}>Status</th>
                <th style={{ width: 100 }} />
              </tr>
            </thead>
            <tbody>
              {sortedRows.map((project) => {
                const isExpanded = expandedProjectKey === project.repository
                const issues = expandedIssues[project.repository] ?? []
                const leftColor =
                  project.statusTone === 'critical'
                    ? 'var(--critical)'
                    : project.statusTone === 'degrading'
                      ? 'var(--warning)'
                      : project.statusTone === 'healthy'
                        ? 'var(--success)'
                        : 'var(--border)'
                const avatarBg =
                  project.statusTone === 'critical'
                    ? 'linear-gradient(135deg, oklch(0.65 0.15 25), oklch(0.5 0.18 15))'
                    : project.statusTone === 'healthy'
                      ? 'linear-gradient(135deg, oklch(0.62 0.1 145), oklch(0.48 0.12 140))'
                      : 'linear-gradient(135deg, oklch(0.68 0.12 75), oklch(0.52 0.14 70))'

                return (
                  <>
                    <tr
                      key={project.repository}
                      style={{ opacity: project.statusTone === 'untracked' ? 0.6 : 1 }}
                    >
                      <td style={{ boxShadow: `inset 3px 0 0 ${leftColor}`, paddingLeft: 20 }}>
                        <div className="proj-row-name">
                          <div className="proj-avatar" style={{ background: avatarBg }}>
                            {project.name[0].toUpperCase()}
                          </div>
                          <div>
                            <strong style={{ fontSize: 13.5 }}>{project.name}</strong>
                            <small>{project.repository}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        {project.statusTone === 'untracked' ? (
                          <span
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: 11,
                              color: 'var(--ink-3)',
                            }}
                          >
                            not scanned
                          </span>
                        ) : (
                          <div className="mini-score">
                            <div className="mini-score-bar" style={{ width: 100 }}>
                              <span
                                style={{
                                  width: `${project.score}%`,
                                  background: rotColor(project.score),
                                }}
                              />
                            </div>
                            <strong
                              style={{
                                fontFamily: 'var(--font-serif)',
                                fontSize: 20,
                                letterSpacing: '-0.03em',
                                color: rotColor(project.score),
                              }}
                            >
                              {project.score}%
                            </strong>
                          </div>
                        )}
                      </td>
                      <td>
                        {project.latestMismatchCount > 0 ? (
                          <span
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: 12,
                              color:
                                project.latestMismatchCount > 10
                                  ? 'var(--critical)'
                                  : project.latestMismatchCount > 3
                                    ? 'var(--warning)'
                                    : 'inherit',
                            }}
                          >
                            {project.latestMismatchCount}
                          </span>
                        ) : (
                          <span
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: 11,
                              color: 'var(--ink-4)',
                            }}
                          >
                            —
                          </span>
                        )}
                      </td>
                      <td
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 11.5,
                          color: 'var(--ink-3)',
                        }}
                      >
                        {project.scanCount || '—'}
                      </td>
                      <td
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 11.5,
                          color: 'var(--ink-3)',
                        }}
                      >
                        {formatRelativeTime(project.lastUpdated)}
                      </td>
                      <td>
                        <span
                          className={`pill ${
                            project.statusTone === 'critical'
                              ? 'pill-critical'
                              : project.statusTone === 'degrading'
                                ? 'pill-warning'
                                : project.statusTone === 'healthy'
                                  ? 'pill-success'
                                  : ''
                          }`}
                        >
                          {project.latestStatus}
                        </span>
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            className="btn btn-sm btn-ghost"
                            onClick={() => handleToggleExpand(project)}
                          >
                            {isExpanded ? 'Hide' : 'Inspect'}
                          </button>
                          {project.latestScanId ? (
                            <button
                              type="button"
                              className="btn btn-sm btn-ghost"
                              onClick={() => onInspectProject?.(project.latestScanId)}
                            >
                              Full View
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>

                    {isExpanded ? (
                      <tr key={`${project.repository}-details`}>
                        <td
                          colSpan={7}
                          style={{ padding: 0, background: 'var(--bg-sunken)' }}
                        >
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
                              <div className="card card-pad" style={{ fontSize: 13 }}>
                                <div className="detail-label" style={{ marginBottom: 6 }}>
                                  Project Summary
                                </div>
                                <p style={{ color: 'var(--ink-2)', lineHeight: 1.5 }}>
                                  <strong>{project.name}</strong> has {project.scanCount} scan
                                  {project.scanCount === 1 ? '' : 's'}, rot score{' '}
                                  <strong>{project.score}%</strong>, and{' '}
                                  <strong>{project.latestMismatchCount}</strong> mismatch
                                  {project.latestMismatchCount === 1 ? '' : 'es'}.
                                </p>
                              </div>
                              <div className="card card-pad" style={{ fontSize: 13 }}>
                                <div className="detail-label" style={{ marginBottom: 6 }}>
                                  Latest Run
                                </div>
                                <p style={{ color: 'var(--ink-2)' }}>
                                  {formatScanRunLabel(project.lastUpdated)}
                                </p>
                                <p
                                  style={{
                                    color: 'var(--ink-4)',
                                    fontSize: 11,
                                    fontFamily: 'var(--font-mono)',
                                    marginTop: 4,
                                  }}
                                >
                                  Scan ref: {shortenScanId(project.latestScanId)}
                                </p>
                              </div>
                            </div>
                            <div className="card card-pad" style={{ fontSize: 13 }}>
                              <div className="detail-label" style={{ marginBottom: 6 }}>
                                Latest Scan Issues
                              </div>
                              {!project.latestScanId ? (
                                <p style={{ color: 'var(--ink-3)' }}>
                                  This project does not have a latest scan yet.
                                </p>
                              ) : expandedLoadingKey === project.repository ? (
                                <p style={{ color: 'var(--ink-3)' }}>Loading issues…</p>
                              ) : issues.length === 0 ? (
                                <p style={{ color: 'var(--ink-3)' }}>
                                  No linked issues found for the latest scan.
                                </p>
                              ) : (
                                <ul style={{ paddingLeft: 16, display: 'grid', gap: 4 }}>
                                  {issues.slice(0, 5).map((issue, index) => (
                                    <li
                                      key={`${project.repository}-issue-${index}`}
                                      style={{ color: 'var(--ink-2)', fontSize: 12 }}
                                    >
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
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            background: 'var(--bg-sunken)',
          }}
        >
          <span
            style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-3)' }}
          >
            Showing {sortedRows.length} of {projectRows.length} projects
          </span>
        </div>
      </div>
    </div>
  )
}
