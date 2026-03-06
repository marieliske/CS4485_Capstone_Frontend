import { Button } from '../shared/Button'
import type { Report } from '../../types/report'

interface ExportButtonProps {
  report: Report | null
}

export function ExportButton({ report }: ExportButtonProps) {
  const handleExport = () => {
    if (!report) {
      return
    }

    window.alert(`Export mismatch report placeholder for ${report.name}`)
  }

  return (
    <Button className="btn-primary" disabled={!report} onClick={handleExport} type="button">
      Export Report
    </Button>
  )
}
