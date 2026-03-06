import { useState } from 'react'
import type { Report } from '../types/report'

const mockReports: Report[] = [
  {
    id: 'REP-401',
    name: 'Weekly Documentation Drift Summary',
    summary: 'Aggregated mismatches detected across CLI and CI scans in the last 7 days.',
    reportType: 'scan-summary',
    project: 'docrot-detector',
    trigger: 'github-actions',
    createdAt: '2026-03-03T12:00:00.000Z',
  },
  {
    id: 'REP-402',
    name: 'Mismatch Breakdown by Documentation Section',
    summary: 'Counts mismatches by section, severity, and mismatch type for maintainer triage.',
    reportType: 'mismatch-breakdown',
    project: 'docrot-detector',
    trigger: 'manual-cli',
    createdAt: '2026-03-04T12:00:00.000Z',
  },
]

export function useReports() {
  const [reports] = useState<Report[]>(mockReports)
  const [selectedReport, setSelectedReport] = useState<Report | null>(mockReports[0] ?? null)

  const loading = false
  const error: string | null = null

  return {
    reports,
    loading,
    error,
    selectedReport,
    setSelectedReport,
  }
}
