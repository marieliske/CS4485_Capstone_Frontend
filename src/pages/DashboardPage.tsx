const statCards = [
  { title: 'Total Projects', value: '12', delta: '+2%', tone: 'positive', icon: 'folder' },
  { title: 'Total Scans', value: '148', delta: '-5%', tone: 'negative', icon: 'search' },
  { title: 'Open Issues', value: '34', delta: '+12%', tone: 'positive', icon: 'warning' },
  { title: 'Latest Scan Score', value: '92%', delta: '-1%', tone: 'negative', icon: 'chart' },
] as const

const activityRows = [
  {
    title: 'Scan Completed: Core API Reference',
    subtitle: 'Found 3 outdated endpoints and 1 broken link.',
    time: '2h ago',
    tone: 'success',
  },
  {
    title: 'New Issue: Authentication Flow',
    subtitle: 'Screenshot checksum mismatch detected in v2.4 docs.',
    time: '5h ago',
    tone: 'warning',
  },
  {
    title: 'Project Created: Mobile SDK Beta',
    subtitle: 'Initial scan scheduled for midnight tonight.',
    time: '1d ago',
    tone: 'info',
  },
  {
    title: 'Critical Alert: User Guides',
    subtitle: 'High severity: 12 broken external links identified.',
    time: '2d ago',
    tone: 'danger',
  },
] as const

function StatIcon({ type }: { type: (typeof statCards)[number]['icon'] }) {
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
  return (
    <section className="dashboard-page">
      <header className="dashboard-welcome">
        <h2>Welcome back, Team 2</h2>
        <p>Here's a summary of your documentation health across 12 projects.</p>
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
              view all
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
              <strong>85%</strong>
            </header>
            <div className="health-track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={85}>
              <span style={{ width: '85%' }} />
            </div>
            <p>"Your documentation is healthier than 78% of teams in your industry."</p>
          </section>
        </aside>
      </div>
    </section>
  )
}
