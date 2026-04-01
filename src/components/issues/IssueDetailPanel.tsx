import type { Issue } from '../../types/issue'
import { Badge } from '../shared/Badge'
import { Card } from '../shared/Card'

interface IssueDetailPanelProps {
  issue: Issue | null
}

export function IssueDetailPanel({ issue }: IssueDetailPanelProps) {
  if (!issue) {
    return (
      <Card title="Mismatch Details" className="detail-card">
        <p className="detail-copy">Select a mismatch from the table to inspect the documentation drift details.</p>
      </Card>
    )
  }

  const statusVariant =
    issue.status === 'closed' ? 'success' : issue.status === 'in-progress' ? 'warning' : 'danger'
  const priorityVariant =
    issue.priority === 'high' ? 'danger' : issue.priority === 'medium' ? 'warning' : 'info'

  return (
    <Card title="Documentation Mismatch Details" className="detail-card">
      <div className="detail-header">
        <h4 className="detail-title">{issue.title}</h4>
        <p className="detail-copy">{issue.description}</p>
      </div>
      <div className="badge-row">
        <Badge variant={statusVariant}>{issue.status}</Badge>
        <Badge variant={priorityVariant}>{issue.priority}</Badge>
        <Badge variant="info">{issue.mismatchType}</Badge>
      </div>
      <div className="detail-grid">
        <div>
          <p className="detail-label">Mismatch ID</p>
          <p>{issue.id}</p>
        </div>
        <div>
          <p className="detail-label">Code Element</p>
          <p>{issue.codeElement}</p>
        </div>
        <div>
          <p className="detail-label">Source Path</p>
          <p>{issue.sourcePath}</p>
        </div>
        <div>
          <p className="detail-label">Documentation Path</p>
          <p>{issue.docPath}</p>
        </div>
        <div>
          <p className="detail-label">Documentation Section</p>
          <p>{issue.docSection}</p>
        </div>
        <div>
          <p className="detail-label">First Detected</p>
          <p>{new Date(issue.createdAt).toLocaleString()}</p>
        </div>
        <div>
          <p className="detail-label">Last Scan Update</p>
          <p>{new Date(issue.updatedAt).toLocaleString()}</p>
        </div>
        <div>
          <p className="detail-label">Detector Tag</p>
          <p>{issue.detectorTag}</p>
        </div>
        <div>
          <p className="detail-label">Score</p>
          <p>{issue.cumulativeScore ?? issue.score}</p>
        </div>
      </div>

      {issue.signature ? (
        <div className="detail-section">
          <p className="detail-label">Signature</p>
          <code className="detail-code">{issue.signature}</code>
        </div>
      ) : null}

      <div className="detail-section">
        <p className="detail-label">Change Summary</p>
        <p className="detail-copy">{issue.changeSummary || 'No detailed summary is available for this issue yet.'}</p>
      </div>

      <div className="detail-section">
        <p className="detail-label">Suggested Action</p>
        <p className="detail-copy">{issue.suggestion}</p>
      </div>
    </Card>
  )
}
