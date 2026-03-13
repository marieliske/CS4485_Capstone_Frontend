export function IssueDrawerWireframePage() {
  return (
    <section className="wf-page wf-issue-page">
      <div className="wf-issue-backdrop">
        <div className="wf-issue-backdrop-title">
          <h3>Issues List</h3>
          <span>42 issues</span>
        </div>
        <div className="wf-issue-backdrop-table">
          <div className="wf-issue-backdrop-head">
            <span>Issue ID</span>
            <span>Severity</span>
            <span>Status</span>
          </div>
          {[
            ['#DR-8291', 'CRITICAL', 'OPEN'],
            ['#DR-8290', 'HIGH', 'OPEN'],
            ['#DR-8289', 'MEDIUM', 'OPEN'],
          ].map(([id, severity, status]) => (
            <button key={id} type="button" className="wf-issue-backdrop-row">
              <span>{id}</span>
              <span className={`wf-issue-pill ${severity.toLowerCase()}`}>{severity}</span>
              <span className="wf-issue-status-pill">{status}</span>
            </button>
          ))}
        </div>
      </div>

      <aside className="wf-issue-drawer">
        <header className="wf-issue-drawer-header">
          <div>
            <div className="wf-issue-drawer-title-row">
              <h2>Issue #DR-8291</h2>
              <button type="button" aria-label="Copy issue id">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                  <rect x="9" y="9" width="10" height="10" rx="2" />
                  <path d="M15 9V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
                </svg>
              </button>
            </div>
            <div className="wf-issue-label-row">
              <button type="button" className="wf-issue-chip critical">
                CRITICAL
              </button>
              <button type="button" className="wf-issue-chip open">
                OPEN
              </button>
            </div>
          </div>

          <button type="button" className="wf-issue-close" aria-label="Close drawer">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="m6 6 12 12" />
              <path d="M18 6 6 18" />
            </svg>
          </button>
        </header>

        <div className="wf-issue-meta">
          <div>
            <span>Project</span>
            <strong>Auth-Service-v2</strong>
          </div>
          <div>
            <span>File</span>
            <strong>auth_handler.py</strong>
          </div>
          <div>
            <span>Symbol</span>
            <strong>verify_token_v3()</strong>
          </div>
        </div>

        <div className="wf-issue-body">
          <section>
            <div className="wf-issue-section-title">
              <span aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect x="6" y="4" width="12" height="16" rx="2" />
                  <path d="M9 9h6M9 13h6" />
                </svg>
              </span>
              <h4>Description</h4>
            </div>
            <div className="wf-issue-panel">
              <p>
                Documentation refers to a deprecated authentication endpoint. This creates a security risk
                where client applications may attempt to use insecure legacy pathways that lack modern rate
                limiting and token validation checks.
              </p>
            </div>
          </section>

          <section>
            <div className="wf-issue-section-title">
              <span aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="m8 9-4 3 4 3" />
                  <path d="m16 9 4 3-4 3" />
                  <path d="m13 6-2 12" />
                </svg>
              </span>
              <h4>Code Evidence</h4>
            </div>
            <button type="button" className="wf-issue-code stale">
              <span>Stale Documentation</span>
              <pre>{`* @param {string} token - User auth token
* @returns {object} status - Call /v2/auth/validate`}</pre>
            </button>
            <button type="button" className="wf-issue-code current">
              <span>Current Implementation</span>
              <pre>{`def verify_token_v3(token):
    return internal_call("/v3/secure/validate", token)`}</pre>
            </button>
          </section>

          <section>
            <div className="wf-issue-section-title ai">
              <span aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M12 4v4M12 16v4M4 12h4M16 12h4M6.4 6.4l2.8 2.8M14.8 14.8l2.8 2.8M17.6 6.4l-2.8 2.8M9.2 14.8l-2.8 2.8" />
                </svg>
              </span>
              <h4>AI Suggestion</h4>
            </div>
            <button type="button" className="wf-issue-panel">
              <p>
                Update the docstring in <strong>auth_handler.py</strong> to reflect the q3 endpoint
                requirement.
              </p>
              <div className="wf-issue-inline-code">
                <code>@returns {'{object}'} status - Call /v3/secure/validate</code>
              </div>
            </button>
          </section>

          <div className="wf-issue-stats">
            <button type="button">
              <span>DETECTED</span>
              <strong>Oct 24, 2023 - 14:22:01</strong>
            </button>
            <button type="button">
              <span>ACTUAL HASH</span>
              <strong>e99a18c428cb38d5f260...</strong>
            </button>
          </div>
        </div>

        <footer className="wf-issue-drawer-footer">
          <button type="button" className="wf-issue-ticket-btn">
            Create Ticket
          </button>
          <button type="button" className="wf-issue-resolve-btn">
            Resolve
          </button>
          <button type="button" className="wf-issue-more-btn" aria-label="More actions">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="5" r="1.8" />
              <circle cx="12" cy="12" r="1.8" />
              <circle cx="12" cy="19" r="1.8" />
            </svg>
          </button>
        </footer>
      </aside>
    </section>
  )
}
