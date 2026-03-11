import { useMemo, useState } from 'react'
import type { Issue, ScanReportSummary } from '../types/issue'

const scanReport: ScanReportSummary = {
  repoPath: 'C:\\Users\\Richard\\CS4485_Capstone',
  commitHash: 'unknown',
  scannedAt: '2026-02-26T19:39:30.859618',
  totalIssues: 4,
  highCount: 3,
  mediumCount: 1,
  lowCount: 0,
}

const mockIssues: Issue[] = [
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
    codeElement: 'Architecture.md',
    sourcePath: 'Architecture.md',
    docPath: 'Architecture.md',
    docSection: 'File-level reference',
    status: 'open',
    priority: 'high',
    reason: 'docstring_stale',
    symbol: 'Architecture.md',
    codeFile: 'Architecture.md',
    detectorTag: 'doc_file_flagged',
    score: 16,
    cumulativeScore: 16,
    changeSummary:
      'literal/constant changed, branch condition changed, loop behavior changed, core control path added/removed',
    suggestion: "Review 'Architecture.md' - linked code logic has changed.",
    createdAt: '2026-02-26T19:39:30.859618',
    updatedAt: '2026-02-26T19:39:30.859618',
  },
  {
    id: 'DOC-203',
    issueNumber: 3,
    title: 'README file flagged from cumulative linked changes',
    description: 'Main README includes references impacted by code-path changes.',
    mismatchType: 'example-outdated',
    codeElement: 'Readme.md',
    sourcePath: 'Readme.md',
    docPath: 'Readme.md',
    docSection: 'File-level reference',
    status: 'open',
    priority: 'high',
    reason: 'docstring_stale',
    symbol: 'Readme.md',
    codeFile: 'Readme.md',
    detectorTag: 'doc_file_flagged',
    score: 16,
    cumulativeScore: 16,
    changeSummary:
      'literal/constant changed, branch condition changed, loop behavior changed, core control path added/removed',
    suggestion: "Review 'Readme.md' - linked code logic has changed.",
    createdAt: '2026-02-26T19:39:30.859618',
    updatedAt: '2026-02-26T19:39:30.859618',
  },
  {
    id: 'DOC-204',
    issueNumber: 4,
    title: '_scan_repo function changed while docs lag behind',
    description: 'Function internals changed and docstring details are now outdated.',
    mismatchType: 'parameter-drift',
    codeElement: 'src/run.py::_scan_repo',
    sourcePath: 'src/run.py',
    docPath: 'src/run.py',
    docSection: '_scan_repo',
    status: 'in-progress',
    priority: 'medium',
    reason: 'docstring_stale',
    symbol: 'src/run.py::_scan_repo',
    codeFile: 'src/run.py',
    signature:
      "_scan_repo(repo_path, py_files) -> Subscript(value=Name(id='tuple', ctx=Load()), slice=Tuple(elts=[Subscript(value=Name(id='Dict', ctx=Load()), slice=Tuple(elts=[Name(id='str', ctx=Load()), Subscript(value=Name(id='Dict', ctx=Load()), slice=Tuple(elts=[Name(id='str', ctx=Load()), Name(id='FunctionFingerprint', ctx=Load())], ctx=Load()), ctx=Load())], ctx=Load()), ctx=Load()), Subscript(value=Name(id='List', ctx=Load()), slice=Name(id='str', ctx=Load()), ctx=Load())], ctx=Load()), ctx=Load())",
    detectorTag: 'docstring_stale',
    score: 1,
    changeSummary: 'literal/constant changed',
    suggestion: "Review documentation for 'src/run.py::_scan_repo' - logic may have changed.",
    createdAt: '2026-02-26T19:39:30.859618',
    updatedAt: '2026-02-26T19:39:30.859618',
  },
]

export function useIssues() {
  const [issues] = useState<Issue[]>(mockIssues)

  const loading = false
  const error: string | null = null

  const openIssues = useMemo(() => issues.filter((issue) => issue.status !== 'closed'), [issues])

  return {
    issues,
    scanReport,
    loading,
    error,
    openIssues,
  }
}
