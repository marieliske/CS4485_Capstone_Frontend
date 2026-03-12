const statCards = [
  { label: 'Total Projects', value: '24', warning: false },
  { label: 'Active Alerts', value: '12', warning: true },
  { label: 'Mean Rot Score', value: '32', warning: false },
  { label: 'Last Update', value: '2m ago', warning: false },
] as const

const projectRows = [
  {
    name: 'API Gateway',
    repository: 'github.com/org/api-gw',
    language: 'GO',
    languageTone: 'go',
    status: 'Healthy',
    statusTone: 'healthy',
    score: '12',
    scoreWidth: '16%',
    scoreTone: 'healthy',
  },
  {
    name: 'Frontend Core',
    repository: 'github.com/org/ui-kit',
    language: 'TYPESCRIPT',
    languageTone: 'typescript',
    status: 'Degrading',
    statusTone: 'degrading',
    score: '48',
    scoreWidth: '48%',
    scoreTone: 'degrading',
  },
  {
    name: 'Data Analytics',
    repository: 'github.com/org/data-v2',
    language: 'PYTHON',
    languageTone: 'python',
    status: 'Critical',
    statusTone: 'critical',
    score: '82',
    scoreWidth: '82%',
    scoreTone: 'critical',
  },
  {
    name: 'Auth Service',
    repository: 'github.com/org/identity',
    language: 'RUST',
    languageTone: 'rust',
    status: 'Healthy',
    statusTone: 'healthy',
    score: '05',
    scoreWidth: '5%',
    scoreTone: 'healthy',
  },
  {
    name: 'Payment Bridge',
    repository: 'github.com/org/payments',
    language: 'JAVA',
    languageTone: 'java',
    status: 'Untracked',
    statusTone: 'untracked',
    score: 'N/A',
    scoreWidth: '0%',
    scoreTone: 'untracked',
  },
] as const

const filters = ['All Projects', 'Language: All', 'Status', 'Score: High to Low'] as const

export function ProjectsPage() {
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
        {filters.map((filter) => (
          <button key={filter} type="button" className="projects-filter-btn">
            {filter}
            <span className="filter-chevron" aria-hidden="true">
              <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="m2.5 4.5 3.5 3 3.5-3" />
              </svg>
            </span>
          </button>
        ))}
      </div>

      <section className="projects-table-shell">
        <table className="projects-table">
          <thead>
            <tr>
              <th>Project Name</th>
              <th>Repository</th>
              <th>Language</th>
              <th>Status</th>
              <th>Rot Score</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {projectRows.map((project) => (
              <tr key={project.name}>
                <td className="project-name-cell">{project.name}</td>
                <td className="project-repo-cell">{project.repository}</td>
                <td>
                  <span className={`project-lang-pill ${project.languageTone}`}>{project.language}</span>
                </td>
                <td>
                  <span className={`project-status ${project.statusTone}`}>
                    <span className="status-dot" aria-hidden="true" />
                    {project.status}
                  </span>
                </td>
                <td>
                  <div className="rot-score-cell">
                    <div className="rot-track">
                      <span className={project.scoreTone} style={{ width: project.scoreWidth }} />
                    </div>
                    <strong>{project.score}</strong>
                  </div>
                </td>
                <td>
                  <button type="button" className="project-actions-btn" aria-label={`Actions for ${project.name}`}>
                    ⋮
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <footer className="projects-table-footer">
          <span>Showing 5 of 24 projects</span>
          <div className="projects-pagination">
            <button type="button" aria-label="Previous page">
              ‹
            </button>
            <button type="button" className="active" aria-current="page">
              1
            </button>
            <button type="button">2</button>
            <button type="button">3</button>
            <button type="button" aria-label="Next page">
              ›
            </button>
          </div>
        </footer>
      </section>
    </section>
  )
}
