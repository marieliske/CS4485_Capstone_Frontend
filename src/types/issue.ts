export type IssueStatus = 'open' | 'in-progress' | 'closed'
export type IssuePriority = 'low' | 'medium' | 'high'
export type MismatchType =
  | 'signature-mismatch'
  | 'removed-api-reference'
  | 'parameter-drift'
  | 'example-outdated'

export interface ScanReportSummary {
  repoPath: string
  commitHash: string
  scannedAt: string
  totalIssues: number
  highCount: number
  mediumCount: number
  lowCount: number
}

export interface Issue {
  id: string
  backendIssueId?: string
  scanId?: string
  repoId?: string
  repoPath?: string
  scanCreatedAt?: string
  issueNumber: number
  title: string
  description: string
  mismatchType: MismatchType
  codeElement: string
  sourcePath: string
  docPath: string
  docSection: string
  status: IssueStatus
  priority: IssuePriority
  reason: string
  symbol: string
  codeFile: string
  signature?: string
  detectorTag: 'docstring_stale' | 'doc_file_flagged'
  score: number
  cumulativeScore?: number
  changeSummary: string
  suggestion: string
  createdAt: string
  updatedAt: string
}
