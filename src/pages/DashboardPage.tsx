import { Card } from '../components/shared/Card'
import { useIssues } from '../hooks/useIssues'
import { useReports } from '../hooks/useReports'

export function DashboardPage() {
  const { issues, openIssues } = useIssues()
  const { reports } = useReports()

  const highPriority = issues.filter((issue) => issue.priority === 'high').length
  const closedIssues = issues.filter((issue) => issue.status === 'closed').length

  return (
    <section className="page-stack">
      <div className="stats-grid">
        <Card title="Detected Mismatches" className="stat-card">
          <p className="stat-value">{issues.length}</p>
        </Card>
        <Card title="Flagged for Review" className="stat-card">
          <p className="stat-value">{openIssues.length}</p>
        </Card>
        <Card title="High Severity" className="stat-card">
          <p className="stat-value">{highPriority}</p>
        </Card>
        <Card title="Resolved in Docs" className="stat-card">
          <p className="stat-value">{closedIssues}</p>
        </Card>
      </div>

      <div className="panel-grid">
        <Card title="Recent Code-to-Doc Drift">
          <ul className="simple-list">
            {issues.map((issue) => (
              <li key={issue.id}>
                <strong>{issue.codeElement}</strong>
                <span>{issue.docSection}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card title="Latest Scan Reports">
          <ul className="simple-list">
            {reports.map((report) => (
              <li key={report.id}>
                <strong>{report.name}</strong>
                <span>{report.trigger}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </section>
  )
}
