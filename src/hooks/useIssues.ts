import { useMemo, useState } from 'react'
import type { Issue } from '../types/issue'

const mockIssues: Issue[] = [
  {
    id: 'DOC-101',
    title: 'Function signature changed but docs still show old parameters',
    description:
      'AST parser detected that scanRepository now takes ScanContext, but README examples still pass repoPath and mode separately.',
    mismatchType: 'signature-mismatch',
    codeElement: 'scanRepository(context: ScanContext)',
    sourcePath: 'src/scanner/scanRepository.ts',
    docPath: 'docs/getting-started.md',
    docSection: 'CLI Usage',
    status: 'open',
    priority: 'high',
    createdAt: '2026-03-01T10:00:00.000Z',
    updatedAt: '2026-03-03T09:00:00.000Z',
  },
  {
    id: 'DOC-102',
    title: 'Removed class still referenced in architecture docs',
    description:
      'Class LegacyDocMapper was removed in refactor, but architecture.md still describes it as the mapper entry point.',
    mismatchType: 'removed-api-reference',
    codeElement: 'LegacyDocMapper',
    sourcePath: 'src/analyzer/mapping/',
    docPath: 'docs/architecture.md',
    docSection: 'Code-to-Docs Linking',
    status: 'in-progress',
    priority: 'medium',
    createdAt: '2026-03-02T08:30:00.000Z',
    updatedAt: '2026-03-04T16:45:00.000Z',
  },
  {
    id: 'DOC-103',
    title: 'Markdown example still returns old JSON schema',
    description:
      'Output schema now includes mismatchConfidence, but docs only show mismatchType and location.',
    mismatchType: 'example-outdated',
    codeElement: 'MismatchReportItem',
    sourcePath: 'src/types/report.ts',
    docPath: 'docs/report-format.md',
    docSection: 'Response Schema',
    status: 'open',
    priority: 'high',
    createdAt: '2026-03-04T11:00:00.000Z',
    updatedAt: '2026-03-05T09:10:00.000Z',
  },
]

export function useIssues() {
  const [issues] = useState<Issue[]>(mockIssues)
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(mockIssues[0] ?? null)

  const loading = false
  const error: string | null = null

  const openIssues = useMemo(() => issues.filter((issue) => issue.status !== 'closed'), [issues])

  return {
    issues,
    loading,
    error,
    selectedIssue,
    setSelectedIssue,
    openIssues,
  }
}
