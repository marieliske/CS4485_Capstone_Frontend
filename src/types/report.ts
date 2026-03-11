export interface Report {
  id: string
  name: string
  summary: string
  reportType: 'scan-summary' | 'mismatch-breakdown' | 'ci-run'
  project: string
  trigger: 'manual-cli' | 'git-hook' | 'github-actions'
  scanLabel: string
  issueCount: number
  status: 'complete' | 'warning'
  createdAt: string
}
