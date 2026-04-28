import type { Issue } from '../../types/issue'

interface IssueTableProps {
  issues: Issue[]
  onSelect: (issue: Issue) => void
  onClose?: (issueId: string) => void
  onReopen?: (issueId: string) => void
  selectedId?: string | null
}

function SeverityCell({ priority }: { priority: Issue['priority'] }) {
  const cls = priority === 'high' ? 'high' : priority === 'medium' ? 'medium' : 'low'
  return (
    <span className={`sev ${cls}`}>
      <span className={`dot dot-${priority === 'high' ? 'critical' : priority === 'medium' ? 'warning' : 'info'}`} />
      {priority}
    </span>
  )
}

export function IssueTable({ issues, onSelect, onClose, onReopen, selectedId }: IssueTableProps) {
  if (!issues.length) {
    return (
      <div className="empty">
        <h4>No issues found</h4>
        <p>Adjust your filters or wait for the next scan to run.</p>
      </div>
    )
  }

  return (
    <table className="tbl issue-table">
      <thead>
        <tr>
          <th style={{ width: 90 }}>Severity</th>
          <th>Issue</th>
          <th style={{ width: 140 }}>Repo</th>
          <th style={{ width: 90 }}>Type</th>
          <th style={{ width: 80 }}>Status</th>
          <th style={{ width: 60 }} />
        </tr>
      </thead>
      <tbody>
        {issues.map((issue) => {
          const leftColor = issue.priority === 'high' ? 'var(--critical)' : issue.priority === 'medium' ? 'var(--warning)' : 'var(--info)'
          const isSelected = selectedId === issue.id
          return (
            <tr
              key={issue.id}
              className={isSelected ? 'active' : undefined}
              onClick={() => onSelect(issue)}
            >
              <td style={{ boxShadow: `inset 3px 0 0 ${leftColor}`, paddingLeft: 20 }}>
                <SeverityCell priority={issue.priority} />
              </td>
              <td>
                <div style={{ fontWeight: 500, lineHeight: 1.35, fontSize: 13, marginBottom: 2 }}>
                  {issue.title}
                </div>
                <div className="issue-path">
                  <strong>{issue.codeFile || issue.sourcePath}</strong>
                  {issue.docPath ? <> <span style={{ color: 'var(--ink-4)' }}>↔</span> {issue.docPath}</> : null}
                </div>
              </td>
              <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, color: 'var(--ink-3)' }}>
                {issue.repoPath ? issue.repoPath.split('/').slice(-1)[0] : '—'}
              </td>
              <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-3)' }}>
                {issue.mismatchType.replace(/-/g, '‑')}
              </td>
              <td>
                <span className={`pill ${issue.status === 'closed' ? 'pill-success' : issue.status === 'in-progress' ? 'pill-accent' : ''}`}>
                  {issue.status === 'closed' ? 'closed' : issue.status === 'in-progress' ? 'active' : 'open'}
                </span>
              </td>
              <td onClick={(e) => e.stopPropagation()}>
                {issue.status !== 'closed' && onClose ? (
                  <button
                    type="button"
                    className="btn btn-sm btn-ghost"
                    onClick={() => onClose(issue.id)}
                    title="Mark as closed"
                  >
                    Close
                  </button>
                ) : issue.status === 'closed' && onReopen ? (
                  <button
                    type="button"
                    className="btn btn-sm btn-ghost"
                    onClick={() => onReopen(issue.id)}
                    title="Re-open issue"
                  >
                    Re-open
                  </button>
                ) : null}
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
