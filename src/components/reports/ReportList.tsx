import type { Report } from '../../types/report'

interface ReportListProps {
  reports: Report[]
  selectedReportId: string | null
  onSelect: (report: Report) => void
}

export function ReportList({ reports, selectedReportId, onSelect }: ReportListProps) {
  return (
    <ul className="report-list">
      {reports.map((report) => (
        <li key={report.id}>
          <button
            className={selectedReportId === report.id ? 'report-list-item active' : 'report-list-item'}
            onClick={() => onSelect(report)}
            type="button"
          >
            <strong>{report.name}</strong>
            <small className="muted">{report.reportType}</small>
          </button>
        </li>
      ))}
    </ul>
  )
}
