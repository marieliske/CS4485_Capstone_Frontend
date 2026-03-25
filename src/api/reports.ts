import { getScans, getScanReport } from './scans'
import type { Report } from '../types/report'

function toStringValue(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

function toNumberValue(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function toReportStatus(value: unknown): Report['status'] {
  return value === 'complete' ? 'complete' : 'warning'
}

function toReportType(value: unknown): Report['reportType'] {
  if (value === 'scan-summary' || value === 'mismatch-breakdown' || value === 'ci-run') {
    return value
  }
  return 'scan-summary'
}

export async function getReports() {
  const scans = await getScans()

  const reports = await Promise.all(
    scans.slice(0, 25).map(async (scan, index) => {
      const scanId = scan.id
      const fallbackName = `Scan ${index + 1}`

      if (!scanId) {
        return {
          id: `unknown-${index + 1}`,
          name: fallbackName,
          summary: 'No report available for this scan.',
          reportType: 'scan-summary',
          project: toStringValue(scan.repo_path, 'unknown-project'),
          trigger: 'manual-cli',
          scanLabel: fallbackName,
          issueCount: toNumberValue(scan.mismatch_count, 0),
          status: 'warning',
          createdAt: toStringValue(scan.created_at, new Date().toISOString()),
        } as Report
      }

      const report = await getScanReport(scanId)

      return {
        id: scanId,
        name: toStringValue(report.name, `Scan ${scanId}`),
        summary: toStringValue(report.summary, 'Scan report retrieved from backend.'),
        reportType: toReportType(report.reportType),
        project: toStringValue(report.repo_path, toStringValue(scan.repo_path, 'unknown-project')),
        trigger: 'manual-cli',
        scanLabel: toStringValue(report.scanLabel, scanId),
        issueCount: toNumberValue(report.mismatch_count, toNumberValue(scan.mismatch_count, 0)),
        status: toReportStatus(report.status),
        createdAt: toStringValue(report.timestamp, toStringValue(scan.created_at, new Date().toISOString())),
      } as Report
    }),
  )

  return reports
}
