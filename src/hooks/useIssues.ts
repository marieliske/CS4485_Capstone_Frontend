import { useCallback, useEffect, useMemo, useState } from 'react'
import { getIssues, closeIssue as apiCloseIssue } from '../api/issues'
import { getScans } from '../api/scans'
import { measure } from '../utils/perf'
import type { Issue, ScanReportSummary } from '../types/issue'

const fallbackScanReport: ScanReportSummary = {
  repoPath: 'sample/docrot-detector',
  commitHash: 'sample-commit',
  scannedAt: '2026-02-26T19:39:30.859618',
  totalIssues: 0,
  highCount: 0,
  mediumCount: 0,
  lowCount: 0,
}

function buildSummary(issues: Issue[], repoPath?: string, commitHash?: string, scannedAt?: string): ScanReportSummary {
  const highCount = issues.filter((issue) => issue.priority === 'high').length
  const mediumCount = issues.filter((issue) => issue.priority === 'medium').length
  const lowCount = issues.filter((issue) => issue.priority === 'low').length

  return {
    repoPath: repoPath ?? fallbackScanReport.repoPath,
    commitHash: commitHash ?? fallbackScanReport.commitHash,
    scannedAt: scannedAt ?? fallbackScanReport.scannedAt,
    totalIssues: issues.length,
    highCount,
    mediumCount,
    lowCount,
  }
}

function getLatestIssueTimestamp(issues: Issue[]): string {
  return (
    issues
      .map((issue) => issue.scanCreatedAt ?? issue.updatedAt)
      .filter((value): value is string => Boolean(value))
      .sort()
      .at(-1) ?? fallbackScanReport.scannedAt
  )
}

export function useIssues(scanId?: string | null) {
  const [issues, setIssues] = useState<Issue[]>([])
  const [scanReport, setScanReport] = useState<ScanReportSummary>(fallbackScanReport)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadIssues() {
      try {
        const [liveIssues, scans] = await measure(`useIssues:load${scanId ? `:${scanId}` : ''}`, () =>
          Promise.all([
            getIssues(scanId ?? undefined),
            getScans().catch(() => []),
          ])
        )

        if (cancelled) {
          return
        }

        const selectedScan = scanId ? scans.find((scan) => scan.id === scanId) : scans[0]
        const openLiveIssues = liveIssues.filter((issue) => issue.status === 'open')
        const highCount = openLiveIssues.filter((issue) => issue.priority === 'high').length
        const mediumCount = openLiveIssues.filter((issue) => issue.priority === 'medium').length
        const lowCount = openLiveIssues.filter((issue) => issue.priority === 'low').length
        const hasLiveData = liveIssues.length > 0 || scans.length > 0

        if (hasLiveData) {
          setIssues(liveIssues)
          setScanReport({
            repoPath: selectedScan?.repo_path ?? 'All repositories',
            commitHash: selectedScan?.commit_sha ?? 'multiple',
            scannedAt: selectedScan?.created_at ?? getLatestIssueTimestamp(liveIssues),
            totalIssues: openLiveIssues.length,
            highCount,
            mediumCount,
            lowCount,
          })
          setError(null)
        } else {
          setIssues([])
          setScanReport(buildSummary([]))
          setError('No backend issues were returned yet.')
        }
      } catch (err) {
        if (cancelled) {
          return
        }

        const message = err instanceof Error ? err.message : 'Unable to load backend issues.'
        setIssues([])
        setScanReport(buildSummary([]))
        if (message.toLowerCase().includes('missing or insufficient permissions')) {
          setError('Issues are temporarily unavailable for this session.')
        } else {
          setError(message)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadIssues()

    return () => {
      cancelled = true
    }
  }, [scanId])

  const openIssues = useMemo(() => issues.filter((issue) => issue.status === 'open'), [issues])

  const closeIssue = useCallback(async (issueId: string) => {
    const targetIssue = issues.find((issue) => issue.id === issueId)
    const repoId = targetIssue?.repoId
    const targetScanId = targetIssue?.scanId
    if (!repoId || !targetScanId) return

    const backendIssueId = issueId.includes(':') ? issueId.split(':').slice(1).join(':') : issueId

    setIssues((prev) =>
      prev.map((issue) => (issue.id === issueId ? { ...issue, status: 'closed' as const } : issue)),
    )
    try {
      await apiCloseIssue(repoId, targetScanId, backendIssueId)
    } catch {
      setIssues((prev) =>
        prev.map((issue) => (issue.id === issueId ? { ...issue, status: 'open' as const } : issue)),
      )
    }
  }, [issues])

  return {
    issues,
    scanReport,
    loading,
    error,
    openIssues,
    closeIssue,
  }
}
