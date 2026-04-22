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
            return <Badge variant={variant}>{issue.priority}</Badge>
          },
        },
        {
          key: 'repoPath',
          label: 'Repo',
          render: (issue) => issue.repoPath ?? 'unknown-repo',
        },
        {
          key: 'updatedAt',
          label: 'Last Updated',
          render: (issue) => new Date(issue.scanCreatedAt ?? issue.updatedAt).toLocaleString(),
        },
        {
          key: 'status',
          label: 'Status',
          render: (issue) => <Badge variant={getStatusVariant(issue.status)}>{issue.status}</Badge>,
        },
        {
          key: 'id',
          label: 'Actions',
          render: (issue) => (
            <button className="btn btn-ghost" onClick={() => onSelect(issue)} type="button">
              View
            </button>
          ),
        },
      ]}
      data={issues}
      getRowKey={(issue) => issue.id}
    />
  )
}
