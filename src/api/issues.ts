import { getScans, getScanIssues } from './scans'
import type { Issue } from '../types/issue'

function parsePriority(value: unknown): Issue['priority'] {
  if (value === 'high' || value === 'medium' || value === 'low') {
    return value
  }
  return 'medium'
}

function parseStatus(value: unknown): Issue['status'] {
  if (value === 'open' || value === 'in-progress' || value === 'closed') {
    return value
  }
  return 'open'
}

function parseMismatchType(value: unknown): Issue['mismatchType'] {
  if (
    value === 'signature-mismatch' ||
    value === 'removed-api-reference' ||
    value === 'parameter-drift' ||
    value === 'example-outdated'
  ) {
    return value
  }
  return 'example-outdated'
}

function toStringValue(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

function toNumberValue(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function normalizeIssue(raw: Record<string, unknown>, index: number, scanId: string): Issue {
  const rawId = toStringValue(raw.id, '')
  const id = rawId.length > 0 ? rawId : `${scanId}-issue-${index + 1}`
  const title = toStringValue(raw.title, toStringValue(raw.message, `Issue ${index + 1}`))
  const description = toStringValue(raw.description, toStringValue(raw.message, 'Documentation mismatch detected.'))
  const sourcePath = toStringValue(raw.sourcePath, toStringValue(raw.code_path, 'unknown'))
  const docPath = toStringValue(raw.docPath, toStringValue(raw.doc_path, 'unknown'))
  const docSection = toStringValue(raw.docSection, toStringValue(raw.reference, 'general'))
  const symbol = toStringValue(raw.symbol, toStringValue(raw.codeElement, sourcePath))
  const createdAt = toStringValue(raw.createdAt, new Date().toISOString())
  const updatedAt = toStringValue(raw.updatedAt, createdAt)
  const issueNumber = toNumberValue(raw.issueNumber, index + 1)
  const score = toNumberValue(raw.score, toNumberValue(raw.rot_score, 0))

  return {
    id,
    issueNumber,
    title,
    description,
    mismatchType: parseMismatchType(raw.mismatchType),
    codeElement: toStringValue(raw.codeElement, symbol),
    sourcePath,
    docPath,
    docSection,
    status: parseStatus(raw.status),
    priority: parsePriority(raw.priority),
    reason: toStringValue(raw.reason, 'backend-issue'),
    symbol,
    codeFile: toStringValue(raw.codeFile, sourcePath),
    signature: typeof raw.signature === 'string' ? raw.signature : undefined,
    detectorTag: raw.detectorTag === 'doc_file_flagged' ? 'doc_file_flagged' : 'docstring_stale',
    score,
    cumulativeScore:
      typeof raw.cumulativeScore === 'number' && Number.isFinite(raw.cumulativeScore)
        ? raw.cumulativeScore
        : undefined,
    changeSummary: toStringValue(raw.changeSummary, toStringValue(raw.message, '')),
    suggestion: toStringValue(raw.suggestion, 'Review linked documentation.'),
    createdAt,
    updatedAt,
  }
}

export async function getIssues() {
  const scans = await getScans()
  if (scans.length === 0) {
    return []
  }

  const latestScan = scans[0]
  const scanId = latestScan.id
  if (!scanId) {
    return []
  }

  const rawIssues = await getScanIssues(scanId)
  return rawIssues.map((issue, index) => normalizeIssue(issue as Record<string, unknown>, index, scanId))
}
