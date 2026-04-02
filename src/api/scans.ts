import { getAllScanRuns, getScanRunById, getIssuesForScan } from './firestore'
import type { JsonObject } from './client'

export interface ScanRecord {
  id: string
  repo_path?: string
  commit_sha?: string
  status?: string
  rot_score?: number
  mismatch_count?: number
  created_at?: string
  updated_at?: string
  branch?: string
  high_count?: number
  medium_count?: number
  low_count?: number
  total_issues?: number
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

export async function getScans(): Promise<ScanRecord[]> {
  return getAllScanRuns()
}

export async function getScanById(scanId: string): Promise<ScanRecord> {
  const scan = await getScanRunById(scanId)
  if (!scan) {
    return { id: scanId, status: 'unknown' }
  }
  return scan
}

export async function getScanIssues(scanId: string): Promise<ScanIssueRecord[]> {
  return getIssuesForScan(scanId)
}

export async function getScanDocs(_scanId: string): Promise<ScanDocRecord[]> {
  return []
}

export async function getScanReport(scanId: string): Promise<JsonObject> {
  const scan = await getScanRunById(scanId)
  if (!scan) return {}
  return {
    summary: `Status: ${scan.status ?? 'unknown'}, mismatches: ${scan.mismatch_count ?? 0}`,
    mismatch_count: scan.mismatch_count ?? 0,
    status: scan.status ?? 'completed',
    repo_path: scan.repo_path,
    commit_sha: scan.commit_sha,
  } as unknown as JsonObject
}

export async function getFingerprintSummary(): Promise<FingerprintSummary> {
  const scans = await getAllScanRuns()
  const totalIssues = scans.reduce((sum, s) => sum + (s.mismatch_count ?? 0), 0)
  return {
    total_scans: scans.length,
    open_issues: totalIssues,
  } as FingerprintSummary
}
