export function UserSettingsWireframePage() {
  return (
    <section className="wf-page wf-settings-page">
      <section className="wf-settings-profile">
        <div className="wf-settings-profile-left">
          <div className="wf-settings-avatar-wrap">
            <span className="wf-settings-profile-avatar" aria-hidden="true">
              AR
            </span>
            <button type="button" aria-label="Edit avatar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="m7 17 10-10" />
                <path d="m7 17 3.4-.7L18 8.7 15.3 6l-7.6 7.6Z" />
              </svg>
            </button>
          </div>

          <div>
            <h3>Alex Rivera</h3>
            <p>alex.rivera@docrot.io</p>
            <span className="wf-settings-role-pill">SECURITY LEAD</span>
          </div>
        </div>

        <button type="button" className="wf-settings-edit-btn">
          Edit Profile
        </button>
      </section>

      <div className="wf-settings-grid">
        <section className="wf-settings-panel">
          <h4>Account Security</h4>
          <div className="wf-settings-security-list">
            <button type="button" className="wf-settings-security-row">
              <div>
                <strong>Change Password</strong>
                <p>Update your account password</p>
              </div>
              <span aria-hidden="true">›</span>
            </button>
            <button type="button" className="wf-settings-security-row">
              <div>
                <strong>Two-Factor Auth</strong>
                <p>Secure your login process</p>
              </div>
              <span className="wf-settings-active-badge">ACTIVE</span>
            </button>
          </div>
        </section>

        <section className="wf-settings-panel">
          <h4>Notifications</h4>
          <div className="wf-settings-toggle-list">
            <button type="button" className="wf-settings-toggle-row" aria-pressed="true">
              <strong>Email Alerts</strong>
              <span className="wf-settings-toggle on" aria-hidden="true" />
            </button>
            <button type="button" className="wf-settings-toggle-row" aria-pressed="false">
              <strong>Slack Integration</strong>
              <span className="wf-settings-toggle" aria-hidden="true" />
            </button>
          </div>
        </section>
      </div>

      <section className="wf-settings-token-section">
        <div className="wf-settings-token-header">
          <h4>Personal Access Tokens</h4>
          <button type="button">Create Token</button>
        </div>

        <div className="wf-settings-token-list">
          <article className="wf-settings-token-row">
            <div>
              <div className="wf-settings-token-name">
                <strong>GitHub Actions - CI</strong>
                <span>READ-ONLY</span>
              </div>
              <code>doc_rot_*****************z9x2</code>
            </div>
            <div className="wf-settings-token-meta">
              <span>Last used: 2h ago</span>
              <button type="button" aria-label="Delete token">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M6 7h12" />
                  <path d="M9 7V5h6v2" />
                  <path d="M8 7v11h8V7" />
                </svg>
              </button>
            </div>
          </article>

          <article className="wf-settings-token-row">
            <div>
              <div className="wf-settings-token-name">
                <strong>Development Workspace</strong>
                <span>ADMIN</span>
              </div>
              <code>doc_rot_*****************a1s4</code>
            </div>
            <div className="wf-settings-token-meta">
              <span>Last used: Yesterday</span>
              <button type="button" aria-label="Delete token">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M6 7h12" />
                  <path d="M9 7V5h6v2" />
                  <path d="M8 7v11h8V7" />
                </svg>
              </button>
            </div>
          </article>
        </div>
      </section>

      <footer className="wf-settings-footer">
        <button type="button">Documentation</button>
        <button type="button">Help Center</button>
        <button type="button">Contact Support</button>
      </footer>
    </section>
  )
}
