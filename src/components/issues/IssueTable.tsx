import { Table } from '../shared/Table'
import { Badge } from '../shared/Badge'
import type { Issue } from '../../types/issue'

interface IssueTableProps {
  issues: Issue[]
  onSelect: (issue: Issue) => void
}

export function IssueTable({ issues, onSelect }: IssueTableProps) {
  const getStatusVariant = (status: Issue['status']) => {
    if (status === 'closed') {
      return 'success'
    }

    if (status === 'in-progress') {
      return 'warning'
    }

    return 'danger'
  }

  if (!issues.length) {
    return <p style={{ padding: '16px' }}>No documentation alerts found 🎉</p>
  }

  return (
    <Table
      columns={[
        {
          key: 'codeElement',
          label: 'Code Element',
          render: (issue) => issue.codeElement,
        },
        {
          key: 'docSection',
          label: 'Documentation Section',
          render: (issue) => `${issue.docPath} - ${issue.docSection}`,
        },
        {
          key: 'mismatchType',
          label: 'Mismatch Type',
          render: (issue) => <Badge variant="info">{issue.mismatchType}</Badge>,
        },
        {
          key: 'priority',
          label: 'Severity',
          render: (issue) => {
            const variant = issue.priority === 'high' ? 'danger' : issue.priority === 'medium' ? 'warning' : 'info'
            return <Badge variant={variant}>{issue.priority.toUpperCase()}</Badge>
          },
        },
        {
          key: 'status',
          label: 'Status',
          render: (issue) => (
            <Badge variant={getStatusVariant(issue.status)}>
              {issue.status === 'closed'
                ? 'Resolved'
                : issue.status === 'in-progress'
                ? 'Under Review'
                : 'Flagged'}
            </Badge>
          ),
        },
        {
          key: 'id',
          label: 'Actions',
          render: (issue) => (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="btn btn-ghost"
                style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #ccc' }}
                onClick={() => onSelect(issue)}
                type="button"
              >
                View
              </button>
            </div>
          ),
        },
      ]}
      data={issues}
      getRowKey={(issue) => issue.id}
    />
  )
}