import { apiRequest, asArray, asObject, type JsonObject } from './client'

export interface ScanRecord {
  id: string
  repo_path?: string
  commit_sha?: string
  status?: string
  rot_score?: number
  mismatch_count?: number
  created_at?: string
  updated_at?: string
}

export interface ScanIssueRecord {
  [key: string]: unknown
}

export interface ScanDocRecord {
  [key: string]: unknown
}

export interface FingerprintSummary {
  [key: string]: unknown
}

function toStringValue(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}

function toNumberValue(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function normalizeScoreValue(value: unknown): number | undefined {
  const parsed = toNumberValue(value)
  if (parsed === undefined) {
    return undefined
  }

  if (parsed >= 0 && parsed <= 1) {
    return parsed * 100
  }

  return parsed
}

function toScanRecord(payload: unknown): ScanRecord {
  const obj = asObject(payload)
  return {
    id: toStringValue(obj.id) ?? '',
    repo_path: toStringValue(obj.repo_path),
    commit_sha: toStringValue(obj.commit_sha),
    status: toStringValue(obj.status),
    rot_score: normalizeScoreValue(obj.rot_score),
    mismatch_count: toNumberValue(obj.mismatch_count),
    created_at: toStringValue(obj.created_at),
    updated_at: toStringValue(obj.updated_at),
  }
}

function pickArrayFromEnvelope<T>(payload: unknown, key: string): T[] {
  if (Array.isArray(payload)) {
    return payload as T[]
  }

  const obj = asObject(payload)
  return asArray<T>(obj[key])
}

function pickObjectFromEnvelope(payload: unknown, key?: string): JsonObject {
  if (!key) {
    return asObject(payload)
  }

  const obj = asObject(payload)
  const candidate = obj[key]
  if (candidate !== undefined) {
    return asObject(candidate)
  }

  return obj
}

export async function getScans(): Promise<ScanRecord[]> {
  const payload = await apiRequest<unknown>('/scans')
  return pickArrayFromEnvelope<ScanRecord>(payload, 'scans')
}

export async function getScanById(scanId: string): Promise<ScanRecord> {
  const payload = await apiRequest<unknown>(`/scans/${encodeURIComponent(scanId)}`)
  return toScanRecord(pickObjectFromEnvelope(payload))
}

export async function getScanIssues(scanId: string): Promise<ScanIssueRecord[]> {
  try {
    const payload = await apiRequest<unknown>(`/scans/${encodeURIComponent(scanId)}/issues`)
    return pickArrayFromEnvelope<ScanIssueRecord>(payload, 'issues')
  } catch {
    const payload = await apiRequest<unknown>(`/scans/${encodeURIComponent(scanId)}/mismatches`)
    return pickArrayFromEnvelope<ScanIssueRecord>(payload, 'mismatches')
  }
}

export async function getScanDocs(scanId: string): Promise<ScanDocRecord[]> {
  const payload = await apiRequest<unknown>(`/scans/${encodeURIComponent(scanId)}/docs`)
  return pickArrayFromEnvelope<ScanDocRecord>(payload, 'docs')
}

export async function getScanReport(scanId: string): Promise<JsonObject> {
  const payload = await apiRequest<unknown>(`/scans/${encodeURIComponent(scanId)}/report`)
  return pickObjectFromEnvelope(payload)
}

export async function getFingerprintSummary(): Promise<FingerprintSummary> {
  const payload = await apiRequest<unknown>('/fingerprints/summary')
  return pickObjectFromEnvelope(payload, 'summary') as FingerprintSummary
}
