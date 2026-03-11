import { Spinner } from '../components/shared/Spinner'
import { formatDate } from '../utils/date'
import type { Report } from '../types/report'

interface ReportsPageProps {
  reports: Report[]
  selectedReport: Report | null
  onSelectReport: (reportId: string) => void
}

export function ReportsPage({ reports, selectedReport, onSelectReport }: ReportsPageProps) {
  const loading = false
  const error: string | null = null

  return (
    <section className="history-page">
      <header className="history-header">
        <div>
          <h3>Scan History</h3>
          <p>Select a historical scan report. The selected report is reflected on the Dashboard.</p>
        </div>
      </header>

      {loading ? <Spinner /> : null}
      {error ? <p className="error-text">{error}</p> : null}

      <div className="history-layout">
        <aside className="history-list-panel">
          <h4>Available Scans</h4>
          <ul className="history-list">
            {reports.map((report) => (
              <li key={report.id}>
                <button
                  className={
                    selectedReport?.id === report.id ? 'history-item active' : 'history-item'
                  }
                  onClick={() => onSelectReport(report.id)}
                  type="button"
                >
                  <strong>{report.scanLabel}</strong>
                  <span>{formatDate(report.createdAt)}</span>
                  <small>{report.name}</small>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <section className="history-viewer-panel">
          <h4>Selected Report</h4>
          {selectedReport ? (
            <article className="history-viewer-card">
              <div className="history-viewer-title-row">
                <h5>{selectedReport.name}</h5>
                <span className={selectedReport.status === 'warning' ? 'history-status warn' : 'history-status'}>
                  {selectedReport.status === 'warning' ? 'Needs Attention' : 'Complete'}
                </span>
              </div>
              <p>{selectedReport.summary}</p>
              <div className="history-detail-grid">
                <p>
                  <span>Scan ID</span>
                  <strong>{selectedReport.scanLabel}</strong>
                </p>
                <p>
                  <span>Date</span>
                  <strong>{formatDate(selectedReport.createdAt)}</strong>
                </p>
                <p>
                  <span>Project</span>
                  <strong>{selectedReport.project}</strong>
                </p>
                <p>
                  <span>Trigger</span>
                  <strong>{selectedReport.trigger}</strong>
                </p>
                <p>
                  <span>Issue Count</span>
                  <strong>{selectedReport.issueCount}</strong>
                </p>
                <p>
                  <span>Report Type</span>
                  <strong>{selectedReport.reportType}</strong>
                </p>
              </div>
            </article>
          ) : (
            <p className="muted">No scan report selected.</p>
          )}
        </section>
      </div>
    </section>
  )
}
