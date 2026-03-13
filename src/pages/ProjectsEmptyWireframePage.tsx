function ProjectsEmptyIcon({ type }: { type: 'link' | 'bell' }) {
  if (type === 'link') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M10.3 13.7 8.2 15.8a3.2 3.2 0 1 1-4.5-4.5l2.9-2.9a3.2 3.2 0 0 1 4.5 0" />
        <path d="m13.7 10.3 2.1-2.1a3.2 3.2 0 1 1 4.5 4.5l-2.9 2.9a3.2 3.2 0 0 1-4.5 0" />
        <path d="m9 15 6-6" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 5.5a5.8 5.8 0 0 1 5.8 5.8v3l1.6 2.2H4.6l1.6-2.2v-3A5.8 5.8 0 0 1 12 5.5Z" />
      <path d="M10.2 19.2a1.8 1.8 0 0 0 3.6 0" />
    </svg>
  )
}

export function ProjectsEmptyWireframePage() {
  return (
    <section className="wf-page wf-projects-page">
      <div className="wf-projects-empty-content">
        <div className="wf-projects-illustration">
          <svg viewBox="0 0 220 220" fill="none" aria-hidden="true">
            <rect x="22" y="18" width="176" height="176" rx="22" stroke="rgba(75,101,153,0.35)" strokeDasharray="3 5" />
            <circle cx="52" cy="46" r="5" fill="rgba(84,111,167,0.6)" />
            <circle cx="155" cy="149" r="6" stroke="rgba(76,101,150,0.5)" />
            <path d="M86 84h25l12 13h30v45H86z" stroke="#425e96" strokeWidth="7" strokeLinejoin="round" />
            <path d="M86 84 72 70" stroke="#425e96" strokeWidth="7" strokeLinecap="round" />
            <path d="M124 97 110 83" stroke="#425e96" strokeWidth="7" strokeLinecap="round" />
            <path d="M173 99h17" stroke="rgba(66,94,150,0.45)" strokeWidth="3" strokeLinecap="round" />
            <circle cx="135" cy="113" r="18" fill="#111827" stroke="#2e446d" />
            <circle cx="134.5" cy="109.5" r="6" stroke="#7397d5" strokeWidth="3" />
            <path d="m140.5 116.5 8 8" stroke="#7397d5" strokeWidth="3" strokeLinecap="round" />
          </svg>
        </div>

        <h3>No Projects Yet</h3>
        <p>
          Start monitoring your documentation for rot. Connect a GitHub repository or upload your
          technical documentation files to begin tracking technical debt and outdated content in your docs.
        </p>

        <button type="button" className="wf-projects-primary-btn">
          <span aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M12 5v14" />
              <path d="M5 12h14" />
              <rect x="4" y="4" width="16" height="16" rx="3" />
            </svg>
          </span>
          Create Your First Project
        </button>

        <div className="wf-projects-action-grid">
          <button type="button" className="wf-projects-action-card">
            <span className="wf-projects-action-icon" aria-hidden="true">
              <ProjectsEmptyIcon type="link" />
            </span>
            <h4>Connect Git</h4>
            <p>Auto-sync with GitHub, GitLab or Bitbucket.</p>
          </button>
          <button type="button" className="wf-projects-action-card">
            <span className="wf-projects-action-icon" aria-hidden="true">
              <ProjectsEmptyIcon type="bell" />
            </span>
            <h4>Get Alerts</h4>
            <p>Receive notifications when documentation rots.</p>
          </button>
        </div>

        <footer className="wf-projects-footer">@ 2024 DocRot Detector. Built for healthy technical documentation.</footer>
      </div>
    </section>
  )
}
