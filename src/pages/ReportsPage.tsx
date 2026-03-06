import { ExportButton } from '../components/reports/ExportButton'
import { ReportList } from '../components/reports/ReportList'
import { ReportViewer } from '../components/reports/ReportViewer'
import { Spinner } from '../components/shared/Spinner'
import { useReports } from '../hooks/useReports'

export function ReportsPage() {
  const { reports, loading, error, selectedReport, setSelectedReport } = useReports()

  return (
    <section className="page-stack">
      {loading ? <Spinner /> : null}
      {error ? <p className="error-text">{error}</p> : null}
      <div className="panel-grid reports-layout">
        <ReportList
          onSelect={setSelectedReport}
          reports={reports}
          selectedReportId={selectedReport?.id ?? null}
        />
        <div className="page-stack">
          <ReportViewer report={selectedReport} />
          <div>
            <ExportButton report={selectedReport} />
          </div>
        </div>
      </div>
    </section>
  )
}
