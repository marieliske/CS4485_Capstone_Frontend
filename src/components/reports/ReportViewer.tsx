import { Card } from '../shared/Card'
import { formatDate } from '../../utils/date'
import type { Report } from '../../types/report'

interface ReportViewerProps {
  report: Report | null
}

export function ReportViewer({ report }: ReportViewerProps) {
  if (!report) {
    return <Card title="Report Viewer">Select a report from the list.</Card>
  }

  return (
    <Card title={report.name} className="report-viewer-card">
      <p className="muted">{report.summary}</p>
      <p className="detail-label">Project: {report.project}</p>
      <p className="detail-label">Trigger: {report.trigger}</p>
      <p className="detail-label">Generated: {formatDate(report.createdAt)}</p>
    </Card>
  )
}
