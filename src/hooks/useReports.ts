import { useEffect, useState } from 'react'
import { getScans } from '../api/scans'
import type { Report } from '../types/report'

export function useReports() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadReports() {
      try {
        const scans = await getScans()

        if (cancelled) return

        const mapped: Report[] = scans.map((scan, index) => ({
          id: scan.id,
          name: `Scan ${scan.repo_path ?? `#${index + 1}`}`,
          summary: `Status: ${scan.status ?? 'unknown'}, ${scan.mismatch_count ?? 0} mismatch(es) detected.`,
          reportType: 'scan-summary' as const,
          project: scan.repo_path ?? 'unknown-project',
          trigger: 'github-actions' as const,
          scanLabel: scan.id,
          issueCount: scan.mismatch_count ?? 0,
          status: (scan.mismatch_count ?? 0) > 0 ? ('warning' as const) : ('complete' as const),
          createdAt: scan.created_at ?? new Date().toISOString(),
        }))

        setReports(mapped)
        setError(null)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unable to load reports.')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadReports()

    return () => {
      cancelled = true
    }
  }, [])

  return { reports, loading, error }
}
