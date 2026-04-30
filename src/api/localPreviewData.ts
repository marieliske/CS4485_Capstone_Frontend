import type { DocumentData } from 'firebase/firestore'

interface PreviewRepoRecord {
  id: string
  full_name: string
  github_url: string
  first_seen_at: string
  latest_scan_id: string
}

interface PreviewScanRecord {
  id: string
  repo_path: string
  commit_sha: string
  status: string
  rot_score: number
  mismatch_count: number
  created_at: string
  updated_at: string
  branch: string
  high_count: number
  medium_count: number
  low_count: number
  total_issues: number
}

interface PreviewIssueRecord extends DocumentData {
  id: string
}

interface PreviewSuggestionRecord {
  id: string
  doc_path: string
  suggestion: string
  model_used: string
  triggered_by: string[]
}

interface PreviewState {
  repos: PreviewRepoRecord[]
  scansByRepo: Record<string, PreviewScanRecord[]>
  issuesByScan: Record<string, PreviewIssueRecord[]>
  suggestionsByScan: Record<string, PreviewSuggestionRecord[]>
  baselinesByRepo: Record<string, DocumentData[]>
}

function scanKey(repoId: string, scanId: string): string {
  return `${repoId}:${scanId}`
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

const state: PreviewState = {
  repos: [
    {
      id: 'docrot-detector',
      full_name: 'marieliske/docrot-detector',
      github_url: 'https://github.com/marieliske/docrot-detector',
      first_seen_at: '2026-04-28T14:10:00.000Z',
      latest_scan_id: 'scan-20260430-0915',
    },
    {
      id: 'dashboard-starter',
      full_name: 'marieliske/dashboard-starter',
      github_url: 'https://github.com/marieliske/dashboard-starter',
      first_seen_at: '2026-04-27T16:20:00.000Z',
      latest_scan_id: 'scan-20260429-1045',
    },
  ],
  scansByRepo: {
    'docrot-detector': [
      {
        id: 'scan-20260430-0915',
        repo_path: 'marieliske/docrot-detector',
        commit_sha: 'd1f7a9c',
        status: 'completed',
        rot_score: 18,
        mismatch_count: 5,
        created_at: '2026-04-30T09:15:00.000Z',
        updated_at: '2026-04-30T09:15:00.000Z',
        branch: 'cleanup-marie',
        high_count: 1,
        medium_count: 2,
        low_count: 2,
        total_issues: 5,
      },
      {
        id: 'scan-20260429-1730',
        repo_path: 'marieliske/docrot-detector',
        commit_sha: '7c2b8ee',
        status: 'completed',
        rot_score: 26,
        mismatch_count: 4,
        created_at: '2026-04-29T17:30:00.000Z',
        updated_at: '2026-04-29T17:30:00.000Z',
        branch: 'feature/ui-cleanup',
        high_count: 1,
        medium_count: 1,
        low_count: 2,
        total_issues: 4,
      },
    ],
    'dashboard-starter': [
      {
        id: 'scan-20260429-1045',
        repo_path: 'marieliske/dashboard-starter',
        commit_sha: 'a38c01d',
        status: 'completed',
        rot_score: 12,
        mismatch_count: 3,
        created_at: '2026-04-29T10:45:00.000Z',
        updated_at: '2026-04-29T10:45:00.000Z',
        branch: 'main',
        high_count: 0,
        medium_count: 1,
        low_count: 2,
        total_issues: 3,
      },
    ],
  },
  issuesByScan: {
    [scanKey('docrot-detector', 'scan-20260430-0915')]: [
      {
        id: 'issue-1',
        title: 'README example still uses the old applyFix signature',
        description: 'The documentation example omits the keyword-only scope parameter added in the latest API.',
        code_path: 'src/api/autoFix.ts',
        file_path: 'docs/README.md',
        code_element: { name: 'applyAutoFix', signature: '(req: ApplyFixRequest)' },
        doc_reference: { file_path: 'docs/README.md', referenced_symbol: 'applyAutoFix' },
        doc_file: 'docs/README.md',
        doc_path: 'docs/README.md',
        docSection: 'API reference',
        status: 'open',
        priority: 'high',
        reason: 'signature-mismatch',
        symbol: 'applyAutoFix',
        codeElement: 'applyAutoFix',
        sourcePath: 'src/api/autoFix.ts',
        codeFile: 'src/api/autoFix.ts',
        detectorTag: 'docstring_stale',
        score: 92,
        cumulative_score: 92,
        changeSummary: 'Signature changed and docs were not updated.',
        suggestion: 'Update the README example to include the new argument list and a preview note.',
        created_at: '2026-04-30T09:10:00.000Z',
        updated_at: '2026-04-30T09:10:00.000Z',
      },
      {
        id: 'issue-2',
        title: 'Dashboard copy still mentions Firestore-only onboarding',
        description: 'The onboarding text should mention the local preview path as well.',
        code_path: 'src/App.tsx',
        file_path: 'src/pages/DashboardPage.tsx',
        code_element: { name: 'DashboardPage', signature: '({ userName })' },
        doc_reference: { file_path: 'README.md', referenced_symbol: 'Setup' },
        doc_file: 'README.md',
        doc_path: 'README.md',
        docSection: 'Setup',
        status: 'open',
        priority: 'medium',
        reason: 'example-outdated',
        symbol: 'DashboardPage',
        codeElement: 'DashboardPage',
        sourcePath: 'src/pages/DashboardPage.tsx',
        codeFile: 'src/pages/DashboardPage.tsx',
        detectorTag: 'doc_file_flagged',
        score: 61,
        cumulativeScore: 61,
        changeSummary: 'Setup flow was updated but docs were not.',
        suggestion: 'Add a preview-mode testing note to the setup instructions.',
        created_at: '2026-04-30T08:50:00.000Z',
        updated_at: '2026-04-30T08:50:00.000Z',
      },
      {
        id: 'issue-3',
        title: 'Issues page example references removed status chip',
        description: 'One of the onboarding screenshots still references a removed filter state.',
        code_path: 'src/pages/IssuesPage.tsx',
        file_path: 'docs/issue-workflow.md',
        code_element: { name: 'IssuesPage', signature: '({ scanId })' },
        doc_reference: { file_path: 'docs/issue-workflow.md', referenced_symbol: 'Status chips' },
        doc_file: 'docs/issue-workflow.md',
        doc_path: 'docs/issue-workflow.md',
        docSection: 'Workflow',
        status: 'open',
        priority: 'medium',
        reason: 'removed-api-reference',
        symbol: 'IssuesPage',
        codeElement: 'IssuesPage',
        sourcePath: 'src/pages/IssuesPage.tsx',
        codeFile: 'src/pages/IssuesPage.tsx',
        detectorTag: 'docstring_stale',
        score: 54,
        cumulativeScore: 54,
        changeSummary: 'UI changed but a reference to the old filter remains.',
        suggestion: 'Replace the screenshot and the chip labels with the current issue states.',
        created_at: '2026-04-30T08:35:00.000Z',
        updated_at: '2026-04-30T08:35:00.000Z',
      },
      {
        id: 'issue-4',
        title: 'Settings page docs still describe the old auth flow',
        description: 'The account settings copy should mention the preview-friendly local boot path.',
        code_path: 'src/pages/UserSettingsWireframePage.tsx',
        file_path: 'docs/user-settings.md',
        code_element: { name: 'UserSettingsWireframePage', signature: '()' },
        doc_reference: { file_path: 'docs/user-settings.md', referenced_symbol: 'Authentication' },
        doc_file: 'docs/user-settings.md',
        doc_path: 'docs/user-settings.md',
        docSection: 'Account',
        status: 'in-progress',
        priority: 'low',
        reason: 'parameter-drift',
        symbol: 'UserSettingsWireframePage',
        codeElement: 'UserSettingsWireframePage',
        sourcePath: 'src/pages/UserSettingsWireframePage.tsx',
        codeFile: 'src/pages/UserSettingsWireframePage.tsx',
        detectorTag: 'doc_file_flagged',
        score: 33,
        cumulativeScore: 33,
        changeSummary: 'Auth behavior changed but the settings guide has not caught up yet.',
        suggestion: 'Add a short callout that settings can still be explored in local preview mode.',
        created_at: '2026-04-30T07:55:00.000Z',
        updated_at: '2026-04-30T07:55:00.000Z',
      },
      {
        id: 'issue-5',
        title: 'Auto-fix guide still points at an old branch name',
        description: 'The branch label in the demo docs should match the cleanup branch that is under review.',
        code_path: 'src/components/issues/AutoFixButton.tsx',
        file_path: 'docs/auto-fix.md',
        code_element: { name: 'AutoFixButton', signature: '({ issue })' },
        doc_reference: { file_path: 'docs/auto-fix.md', referenced_symbol: 'branch name' },
        doc_file: 'docs/auto-fix.md',
        doc_path: 'docs/auto-fix.md',
        docSection: 'Auto-fix',
        status: 'closed',
        priority: 'low',
        reason: 'example-outdated',
        symbol: 'AutoFixButton',
        codeElement: 'AutoFixButton',
        sourcePath: 'src/components/issues/AutoFixButton.tsx',
        codeFile: 'src/components/issues/AutoFixButton.tsx',
        detectorTag: 'docstring_stale',
        score: 11,
        cumulativeScore: 11,
        changeSummary: 'A stale branch label was left behind in one example.',
        suggestion: 'Update the branch label to Cleanup-Marie and mark the example as current.',
        created_at: '2026-04-29T22:25:00.000Z',
        updated_at: '2026-04-29T22:25:00.000Z',
      },
    ],
    [scanKey('docrot-detector', 'scan-20260429-1730')]: [
      {
        id: 'issue-1',
        title: 'Configuration page examples still mention the old validation rule',
        description: 'The onboarding copy still says empty mappings are rejected even though preview mode allows them.',
        code_path: 'src/pages/ConfigurationPage.tsx',
        file_path: 'docs/configuration.md',
        code_element: { name: 'ConfigurationPage', signature: '()' },
        doc_reference: { file_path: 'docs/configuration.md', referenced_symbol: 'validation rule' },
        doc_file: 'docs/configuration.md',
        doc_path: 'docs/configuration.md',
        docSection: 'Validation',
        status: 'open',
        priority: 'high',
        reason: 'signature-mismatch',
        symbol: 'ConfigurationPage',
        codeElement: 'ConfigurationPage',
        sourcePath: 'src/pages/ConfigurationPage.tsx',
        codeFile: 'src/pages/ConfigurationPage.tsx',
        detectorTag: 'docstring_stale',
        score: 88,
        cumulativeScore: 88,
        changeSummary: 'Validation language diverged from the current behavior.',
        suggestion: 'Clarify that preview mode uses sample data and does not require Firebase.',
        created_at: '2026-04-29T17:10:00.000Z',
        updated_at: '2026-04-29T17:10:00.000Z',
      },
      {
        id: 'issue-2',
        title: 'Scan history docs still show the legacy badge style',
        description: 'The badge style in the screenshot no longer matches the current design system.',
        code_path: 'src/pages/ScanHistoryPage.tsx',
        file_path: 'docs/scan-history.md',
        code_element: { name: 'ScanHistoryPage', signature: '()' },
        doc_reference: { file_path: 'docs/scan-history.md', referenced_symbol: 'badge' },
        doc_file: 'docs/scan-history.md',
        doc_path: 'docs/scan-history.md',
        docSection: 'Visual design',
        status: 'open',
        priority: 'medium',
        reason: 'example-outdated',
        symbol: 'ScanHistoryPage',
        codeElement: 'ScanHistoryPage',
        sourcePath: 'src/pages/ScanHistoryPage.tsx',
        codeFile: 'src/pages/ScanHistoryPage.tsx',
        detectorTag: 'doc_file_flagged',
        score: 42,
        cumulativeScore: 42,
        changeSummary: 'A screenshot was not refreshed after a UI polish pass.',
        suggestion: 'Replace the old badge screenshot with a current capture.',
        created_at: '2026-04-29T17:00:00.000Z',
        updated_at: '2026-04-29T17:00:00.000Z',
      },
      {
        id: 'issue-3',
        title: 'Report viewer text should reference the new metrics panel',
        description: 'The report viewer instructions still describe the old metrics strip wording.',
        code_path: 'src/components/reports/ReportViewer.tsx',
        file_path: 'docs/reports.md',
        code_element: { name: 'ReportViewer', signature: '({ report })' },
        doc_reference: { file_path: 'docs/reports.md', referenced_symbol: 'metrics panel' },
        doc_file: 'docs/reports.md',
        doc_path: 'docs/reports.md',
        docSection: 'Reports',
        status: 'closed',
        priority: 'low',
        reason: 'removed-api-reference',
        symbol: 'ReportViewer',
        codeElement: 'ReportViewer',
        sourcePath: 'src/components/reports/ReportViewer.tsx',
        codeFile: 'src/components/reports/ReportViewer.tsx',
        detectorTag: 'docstring_stale',
        score: 19,
        cumulativeScore: 19,
        changeSummary: 'The text was left behind after the metrics panel was renamed.',
        suggestion: 'Refresh the report viewer language to match the current metrics panel.',
        created_at: '2026-04-29T16:20:00.000Z',
        updated_at: '2026-04-29T16:20:00.000Z',
      },
      {
        id: 'issue-4',
        title: 'User settings docs still assume email/password sign in',
        description: 'The preview flow does not need Firebase auth, so the help copy should say that explicitly.',
        code_path: 'src/auth/AuthContext.tsx',
        file_path: 'docs/auth.md',
        code_element: { name: 'AuthContext', signature: '({ children })' },
        doc_reference: { file_path: 'docs/auth.md', referenced_symbol: 'sign in' },
        doc_file: 'docs/auth.md',
        doc_path: 'docs/auth.md',
        docSection: 'Local testing',
        status: 'open',
        priority: 'low',
        reason: 'example-outdated',
        symbol: 'AuthContext',
        codeElement: 'AuthContext',
        sourcePath: 'src/auth/AuthContext.tsx',
        codeFile: 'src/auth/AuthContext.tsx',
        detectorTag: 'doc_file_flagged',
        score: 27,
        cumulativeScore: 27,
        changeSummary: 'The local preview path was added after the docs were written.',
        suggestion: 'Add a note that local preview boot bypasses Firebase entirely.',
        created_at: '2026-04-29T15:30:00.000Z',
        updated_at: '2026-04-29T15:30:00.000Z',
      },
    ],
    [scanKey('dashboard-starter', 'scan-20260429-1045')]: [
      {
        id: 'issue-1',
        title: 'Quick-start guide still points to an unavailable backend',
        description: 'The local preview path should be documented for people checking the branch quickly.',
        code_path: 'src/api/client.ts',
        file_path: 'docs/quick-start.md',
        code_element: { name: 'apiRequest', signature: '(path, init?)' },
        doc_reference: { file_path: 'docs/quick-start.md', referenced_symbol: 'backend' },
        doc_file: 'docs/quick-start.md',
        doc_path: 'docs/quick-start.md',
        docSection: 'Setup',
        status: 'open',
        priority: 'medium',
        reason: 'example-outdated',
        symbol: 'apiRequest',
        codeElement: 'apiRequest',
        sourcePath: 'src/api/client.ts',
        codeFile: 'src/api/client.ts',
        detectorTag: 'docstring_stale',
        score: 48,
        cumulativeScore: 48,
        changeSummary: 'The setup doc still assumes the backend is online.',
        suggestion: 'Add a fast local preview section that does not depend on Firebase or the backend.',
        created_at: '2026-04-29T10:40:00.000Z',
        updated_at: '2026-04-29T10:40:00.000Z',
      },
      {
        id: 'issue-2',
        title: 'Feature list should mention the guest preview mode',
        description: 'A short note about the no-env boot path would help reviewers validate the branch faster.',
        code_path: 'src/App.tsx',
        file_path: 'README.md',
        code_element: { name: 'Root', signature: '()' },
        doc_reference: { file_path: 'README.md', referenced_symbol: 'features' },
        doc_file: 'README.md',
        doc_path: 'README.md',
        docSection: 'Features',
        status: 'open',
        priority: 'low',
        reason: 'example-outdated',
        symbol: 'Root',
        codeElement: 'Root',
        sourcePath: 'src/App.tsx',
        codeFile: 'src/App.tsx',
        detectorTag: 'docstring_stale',
        score: 24,
        cumulativeScore: 24,
        changeSummary: 'The branch now supports a local preview path but the docs do not mention it yet.',
        suggestion: 'Document the preview-mode boot path in the README.',
        created_at: '2026-04-29T10:30:00.000Z',
        updated_at: '2026-04-29T10:30:00.000Z',
      },
      {
        id: 'issue-3',
        title: 'Theme controls doc is missing the latest layout polish',
        description: 'The controls page has a simplified demo layout that is not captured in the docs yet.',
        code_path: 'src/pages/ConfigurationPage.tsx',
        file_path: 'docs/theme.md',
        code_element: { name: 'ConfigurationPage', signature: '()' },
        doc_reference: { file_path: 'docs/theme.md', referenced_symbol: 'layout polish' },
        doc_file: 'docs/theme.md',
        doc_path: 'docs/theme.md',
        docSection: 'Theme controls',
        status: 'closed',
        priority: 'low',
        reason: 'removed-api-reference',
        symbol: 'ConfigurationPage',
        codeElement: 'ConfigurationPage',
        sourcePath: 'src/pages/ConfigurationPage.tsx',
        codeFile: 'src/pages/ConfigurationPage.tsx',
        detectorTag: 'doc_file_flagged',
        score: 14,
        cumulativeScore: 14,
        changeSummary: 'A stale note was left behind after the layout pass.',
        suggestion: 'Update the theme controls doc to match the current demo layout.',
        created_at: '2026-04-29T09:55:00.000Z',
        updated_at: '2026-04-29T09:55:00.000Z',
      },
    ],
  },
  suggestionsByScan: {
    [scanKey('docrot-detector', 'scan-20260430-0915')]: [
      {
        id: 'suggestion-1',
        doc_path: 'docs/README.md',
        suggestion: 'Update the usage example so it includes the current applyAutoFix argument shape.',
        model_used: 'llama-3.3-70b-versatile',
        triggered_by: ['signature-mismatch', 'preview-mode'],
      },
      {
        id: 'suggestion-2',
        doc_path: 'docs/user-settings.md',
        suggestion: 'Add a small note that local preview mode skips Firebase sign-in.',
        model_used: 'llama-3.3-70b-versatile',
        triggered_by: ['auth-flow'],
      },
    ],
    [scanKey('docrot-detector', 'scan-20260429-1730')]: [
      {
        id: 'suggestion-1',
        doc_path: 'docs/configuration.md',
        suggestion: 'Explain the preview-mode behavior alongside the mapping validation copy.',
        model_used: 'llama-3.3-70b-versatile',
        triggered_by: ['validation'],
      },
    ],
    [scanKey('dashboard-starter', 'scan-20260429-1045')]: [
      {
        id: 'suggestion-1',
        doc_path: 'docs/quick-start.md',
        suggestion: 'Add a "run locally without Firebase" section for fast branch validation.',
        model_used: 'llama-3.3-70b-versatile',
        triggered_by: ['local-preview'],
      },
    ],
  },
  baselinesByRepo: {
    'docrot-detector': [
      { id: 'baseline-1', symbol: 'applyAutoFix', doc_path: 'docs/README.md' },
      { id: 'baseline-2', symbol: 'DashboardPage', doc_path: 'docs/user-settings.md' },
    ],
    'dashboard-starter': [
      { id: 'baseline-1', symbol: 'apiRequest', doc_path: 'docs/quick-start.md' },
    ],
  },
}

export function getPreviewRepos(): PreviewRepoRecord[] {
  return clone(state.repos)
}

export function getPreviewRepoById(repoId: string): PreviewRepoRecord | null {
  return clone(state.repos.find((repo) => repo.id === repoId) ?? null)
}

export function getPreviewScansForRepo(repoId: string): PreviewScanRecord[] {
  return clone(state.scansByRepo[repoId] ?? [])
}

export function getPreviewScanById(scanId: string): { repoId: string; scan: PreviewScanRecord } | null {
  for (const [repoId, scans] of Object.entries(state.scansByRepo)) {
    const scan = scans.find((entry) => entry.id === scanId)
    if (scan) {
      return { repoId, scan: clone(scan) }
    }
  }
  return null
}

export function getPreviewIssuesForScan(repoId: string, scanId: string): PreviewIssueRecord[] {
  return clone(state.issuesByScan[scanKey(repoId, scanId)] ?? [])
}

export function setPreviewIssueStatus(repoId: string, scanId: string, issueId: string, status: string): void {
  const key = scanKey(repoId, scanId)
  const issues = state.issuesByScan[key]
  if (!issues) return

  const target = issues.find((issue) => issue.id === issueId)
  if (!target) return

  target.status = status
  target.updated_at = new Date().toISOString()
}

export function getPreviewSuggestionsForScan(repoId: string, scanId: string): PreviewSuggestionRecord[] {
  return clone(state.suggestionsByScan[scanKey(repoId, scanId)] ?? [])
}

export function getPreviewBaselinesForRepo(repoId: string): DocumentData[] {
  return clone(state.baselinesByRepo[repoId] ?? [])
}
