import { useEffect, useMemo, useState } from 'react'
import { getIssues } from '../api/issues'
import { getScans } from '../api/scans'
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

const fallbackIssues: Issue[] = [
  {
    id: 'DOC-201',
    issueNumber: 1,
    title: 'run function behavior changed and docstring is stale',
    description: 'Logic updates were detected but documentation still reflects prior behavior.',
    mismatchType: 'signature-mismatch',
    codeElement: 'src/run.py::run',
    sourcePath: 'src/run.py',
    docPath: 'src/run.py',
    docSection: 'run',
    status: 'open',
    priority: 'high',
    reason: 'docstring_stale',
    symbol: 'src/run.py::run',
    codeFile: 'src/run.py',
    signature: "run(repo_path, commit_hash) -> Name(id='int', ctx=Load())",
    detectorTag: 'docstring_stale',
    score: 15,
    changeSummary:
      'literal/constant changed, branch condition changed, loop behavior changed, core control path added/removed',
    suggestion: "Review documentation for 'src/run.py::run' - logic may have changed.",
    createdAt: '2026-02-26T19:39:30.859618',
    updatedAt: '2026-02-26T19:39:30.859618',
  },
  {
    id: 'DOC-202',
    issueNumber: 2,
    title: 'Architecture.md is flagged from linked code drift',
    description: 'Documentation file was flagged due to cumulative code behavior changes.',
    mismatchType: 'removed-api-reference',
    codeElement: 'docs/Architecture.md',
    sourcePath: 'src/run.py',
    docPath: 'docs/Architecture.md',
    docSection: 'File-level reference',
    status: 'open',
    priority: 'high',
    reason: 'doc_file_flagged',
    symbol: 'docs/Architecture.md',
    codeFile: 'src/run.py',
    detectorTag: 'doc_file_flagged',
    score: 16,
    cumulativeScore: 16,
    changeSummary:
      'literal/constant changed, branch condition changed, loop behavior changed, core control path added/removed',
    suggestion: "Review 'docs/Architecture.md' - linked code logic has changed.",
    createdAt: '2026-02-26T19:39:30.859618',
    updatedAt: '2026-02-26T19:39:30.859618',
  },
]

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
        const [liveIssues, scans] = await Promise.all([
          getIssues(scanId ?? undefined),
          getScans().catch(() => []),
        ])

        if (cancelled) {
          return
        }

        const selectedScan = scanId ? scans.find((scan) => scan.id === scanId) : undefined
        const openLiveIssues = liveIssues.filter((issue) => issue.status === 'open')
        const highCount = openLiveIssues.filter((issue) => issue.priority === 'high').length
        const mediumCount = openLiveIssues.filter((issue) => issue.priority === 'medium').length
        const lowCount = openLiveIssues.filter((issue) => issue.priority === 'low').length
        const hasLiveData = liveIssues.length > 0 || Boolean(selectedScan)

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
          setIssues(fallbackIssues)
          setScanReport(buildSummary(fallbackIssues))
          setError('No backend issues were returned yet, so sample data is shown.')
        }
      } catch (err) {
        if (cancelled) {
          return
        }

        setIssues(fallbackIssues)
        setScanReport(buildSummary(fallbackIssues))
        setError(err instanceof Error ? `${err.message} Showing sample data instead.` : 'Showing sample data instead.')
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

  return {
    issues,
    scanReport,
    loading,
    error,
    openIssues,
  }
}
