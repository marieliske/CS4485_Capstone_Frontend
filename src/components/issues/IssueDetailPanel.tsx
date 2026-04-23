import type { Issue } from '../../types/issue'

interface IssueDetailPanelProps {
  issue: Issue | null
}

function priorityPill(priority: Issue['priority']) {
  if (priority === 'high') return 'pill-critical'
  if (priority === 'medium') return 'pill-warning'
  return ''
}

function statusPill(status: Issue['status']) {
  if (status === 'closed') return 'pill-success'
  if (status === 'in-progress') return 'pill-accent'
  return ''
}

function priorityDot(priority: Issue['priority']) {
  if (priority === 'high') return 'dot-critical'
  if (priority === 'medium') return 'dot-warning'
  return 'dot-info'
}

export function IssueDetailPanel({ issue }: IssueDetailPanelProps) {
  if (!issue) {
    return (
      <div className="detail-panel" style={{ display: 'grid', placeItems: 'center' }}>
        <div className="empty">
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--bg-sunken)', display: 'grid', placeItems: 'center', color: 'var(--ink-3)', margin: '0 auto 14px' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" style={{ width: 20, height: 20 }}>
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </div>
          <h4>Select an issue</h4>
          <p>Pick a row from the table to inspect the mismatch details and suggested fix.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="detail-panel" style={{ overflowY: 'auto' }}>
      {/* Header */}
      <div className="detail-head">
        <div className="kicker">{issue.repoPath ?? issue.docPath} · #{issue.issueNumber}</div>
        <h2>{issue.title}</h2>
        <div className="detail-pills">
          <span className={`pill ${priorityPill(issue.priority)}`}>
            <span className={`dot ${priorityDot(issue.priority)}`} />
            {issue.priority}
          </span>
          <span className={`pill ${statusPill(issue.status)}`}>{issue.status}</span>
          <span className="pill" style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>{issue.mismatchType}</span>
          <span className="pill" style={{ fontFamily: 'var(--font-mono)', fontSize: 10, marginLeft: 'auto' }}>
            score: {issue.cumulativeScore ?? issue.score}
          </span>
        </div>
      </div>

      {/* Code ↔ Doc pair */}
      {(issue.sourcePath || issue.docPath) ? (
        <div className="detail-section">
          <div className="detail-label">Code ↔ Doc mismatch</div>
          <div className="detail-pair">
            <div className="dp-file">
              <strong>{issue.codeFile || issue.sourcePath}</strong>
              {issue.symbol ? <small>{issue.symbol}</small> : null}
            </div>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: 14, height: 14, color: 'var(--ink-4)', flexShrink: 0 }}>
              <path d="M5 12h14"/><path d="M12 5l7 7-7 7"/>
            </svg>
            <div className="dp-file">
              <strong>{issue.docPath}</strong>
              {issue.docSection ? <small>{issue.docSection}</small> : null}
            </div>
          </div>
        </div>
      ) : null}

      {/* Description */}
      {issue.description ? (
        <div className="detail-section">
          <div className="detail-label">Description</div>
          <p>{issue.description}</p>
        </div>
      ) : null}

      {/* Change summary */}
      {issue.changeSummary ? (
        <div className="detail-section">
          <div className="detail-label">What changed</div>
          <div className="ai-card">
            <div className="ai-head">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: 12, height: 12 }}>
                <path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5z"/>
              </svg>
              AI analysis · {issue.detectorTag}
            </div>
            <div className="ai-body">{issue.changeSummary}</div>
          </div>
        </div>
      ) : null}

      {/* Suggestion */}
      {issue.suggestion ? (
        <div className="detail-section">
          <div className="detail-label">Suggested fix</div>
          <p>{issue.suggestion}</p>
        </div>
      ) : null}

      {/* Signature */}
      {issue.signature ? (
        <div className="detail-section">
          <div className="detail-label">Signature</div>
          <code className="detail-code">{issue.signature}</code>
        </div>
      ) : null}

      {/* Key-value metadata */}
      <div className="detail-section">
        <div className="detail-label">Details</div>
        <div className="detail-kv">
          <div className="detail-kv-row">
            <span className="k">ID</span>
            <span className="v mono">{issue.id}</span>
          </div>
          <div className="detail-kv-row">
            <span className="k">Code element</span>
            <span className="v">{issue.codeElement || '—'}</span>
          </div>
          <div className="detail-kv-row">
            <span className="k">Detector</span>
            <span className="v mono">{issue.detectorTag}</span>
          </div>
          <div className="detail-kv-row">
            <span className="k">First detected</span>
            <span className="v mono">{new Date(issue.createdAt).toLocaleString()}</span>
          </div>
          <div className="detail-kv-row">
            <span className="k">Last updated</span>
            <span className="v mono">{new Date(issue.updatedAt).toLocaleString()}</span>
          </div>
          {issue.scanCreatedAt ? (
            <div className="detail-kv-row">
              <span className="k">Scan date</span>
              <span className="v mono">{new Date(issue.scanCreatedAt).toLocaleString()}</span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
