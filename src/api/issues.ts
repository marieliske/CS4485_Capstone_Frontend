import { asObject } from './client'
import { getScans, getScanIssues } from './scans'
import type { ScanRecord } from './scans'
import type { Issue } from '../types/issue'

function parsePriority(value: unknown): Issue['priority'] {
  if (value === 'critical' || value === 'high') {
    return 'high'
  }

  if (value === 'medium') {
    return 'medium'
  }

  return 'low'
}

function parseStatus(value: unknown): Issue['status'] {
  if (value === 'closed' || value === 'resolved' || value === 'ignored') {
    return 'closed'
  }

  if (value === 'in-progress' || value === 'in_progress' || value === 'reviewing') {
    return 'in-progress'
  }

  return 'open'
}

function parseMismatchType(value: unknown): Issue['mismatchType'] {
  if (value === 'signature-mismatch') {
    return 'signature-mismatch'
  }

  if (value === 'removed-api-reference') {
    return 'removed-api-reference'
  }

  if (value === 'parameter-drift') {
    return 'parameter-drift'
  }

  return 'example-outdated'
}

function inferMismatchType(value: unknown): Issue['mismatchType'] {
  const normalized = typeof value === 'string' ? value.toLowerCase() : ''
  if (normalized.includes('signature')) {
    return 'signature-mismatch'
  }
  if (normalized.includes('parameter')) {
    return 'parameter-drift'
  }
  if (normalized.includes('removed') || normalized.includes('missing') || normalized.includes('broken')) {
    return 'removed-api-reference'
  }
  return 'example-outdated'
}

function toStringValue(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

function toNumberValue(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function normalizeIssue(rawPayload: unknown, index: number, scan: ScanRecord): Issue {
  const raw = asObject(rawPayload)
  const codeElement = asObject(raw.code_element)
  const docReference = asObject(raw.doc_reference)
  const nestedCode = asObject(raw.code)
  const nestedDoc = asObject(raw.doc)
  const scanId = scan.id

  const reason = toStringValue(raw.reason, toStringValue(raw.type, 'backend-issue'))
  const codePath = toStringValue(
    raw.code_path,
    toStringValue(
      raw.file_path,
      toStringValue(codeElement.file_path, toStringValue(nestedCode.path, 'unknown')),
    ),
  )
  const symbol = toStringValue(
    raw.symbol,
    toStringValue(
      raw.codeElement,
      toStringValue(codeElement.name, toStringValue(nestedCode.symbol, codePath)),
    ),
  )
  const docPath = toStringValue(
    raw.doc_path,
    toStringValue(
      raw.docPath,
      toStringValue(docReference.file_path, toStringValue(nestedDoc.path, codePath)),
    ),
  )
  const docSection = toStringValue(
    raw.docSection,
    toStringValue(
      raw.reference,
      toStringValue(
        docReference.referenced_symbol,
        toStringValue(nestedDoc.reference, toStringValue(nestedDoc.line, 'general')),
      ),
    ),
  )
  const createdAt = toStringValue(raw.created_at, toStringValue(raw.createdAt, new Date().toISOString()))
  const updatedAt = toStringValue(raw.updated_at, toStringValue(raw.updatedAt, createdAt))
  const issueNumber = toNumberValue(raw.issueNumber, index + 1)
  const score = toNumberValue(
    raw.score,
    toNumberValue(raw.cumulative_score, toNumberValue(raw.cumulativeScore, 0)),
  )
  const rawMismatchType = toStringValue(raw.mismatchType)
  const mismatchType = rawMismatchType ? parseMismatchType(rawMismatchType) : inferMismatchType(reason)

  const baseId = toStringValue(raw.id, `issue-${index + 1}`)

  return {
    id: `${scanId}:${baseId}`,
    scanId,
    repoPath: toStringValue(scan.repo_path, 'unknown-repo'),
    scanCreatedAt: toStringValue(scan.created_at, updatedAt),
    issueNumber,
    title: toStringValue(raw.title, toStringValue(raw.message, `Issue ${index + 1}`)),
    description: toStringValue(raw.description, toStringValue(raw.message, 'Documentation mismatch detected.')),
    mismatchType,
    codeElement: toStringValue(raw.codeElement, symbol),
    sourcePath: toStringValue(raw.sourcePath, codePath),
    docPath,
    docSection,
    status: parseStatus(raw.status),
    priority: parsePriority(raw.priority ?? raw.severity),
    reason,
    symbol,
    codeFile: toStringValue(raw.codeFile, codePath),
    signature: toStringValue(raw.signature, toStringValue(codeElement.signature, '')) || undefined,
    detectorTag: raw.detectorTag === 'doc_file_flagged' || reason === 'doc_file_flagged' ? 'doc_file_flagged' : 'docstring_stale',
    score,
    cumulativeScore: toNumberValue(raw.cumulativeScore, toNumberValue(raw.cumulative_score, 0)) || undefined,
    changeSummary: Array.isArray(raw.reasons)
      ? (raw.reasons as string[]).join(', ')
      : toStringValue(raw.changeSummary, toStringValue(raw.message, '')),
    suggestion: toStringValue(raw.suggestion, toStringValue(raw.suggested_action, 'Review linked documentation.')),
    createdAt,
    updatedAt,
  }
}

export async function closeIssue(repoId: string, scanId: string, issueId: string): Promise<void> {
  await firestoreCloseIssue(repoId, scanId, issueId)
}

export async function getIssues(scanId?: string) {
  const scans = await getScans()
  if (scans.length === 0) {
    return []
  }

  if (scanId) {
    const selectedScan = scans.find((scan) => scan.id === scanId)
    if (!selectedScan) {
      return []
    }

    const rawIssues = await getScanIssues(selectedScan.id)
    return rawIssues.map((issue, index) => normalizeIssue(issue, index, selectedScan))
  }

  const issuesPerScan = await Promise.all(
    scans.map(async (scan) => {
      const rawIssues = await getScanIssues(scan.id)
      return rawIssues.map((issue, index) => normalizeIssue(issue, index, scan))
    }),
  )

  return issuesPerScan.flat()
}
