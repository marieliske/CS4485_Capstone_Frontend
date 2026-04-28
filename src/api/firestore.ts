import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  type DocumentData,
} from 'firebase/firestore'
import { db } from '../firebase'
import { measure } from '../utils/perf'
import type { ScanRecord } from './scans'

// ---------------------------------------------------------------------------
// TTL cache
// ---------------------------------------------------------------------------

const CACHE_TTL = 60_000

interface CacheEntry<T> { data: T; fetchedAt: number }
const cache = new Map<string, CacheEntry<unknown>>()

function getCached<T>(key: string): T | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined
  if (!entry) return null
  if (Date.now() - entry.fetchedAt > CACHE_TTL) { cache.delete(key); return null }
  return entry.data
}

function setCached<T>(key: string, data: T): void {
  cache.set(key, { data, fetchedAt: Date.now() })
}

export function clearCache(): void { cache.clear() }

function invalidateCachedByPrefix(prefix: string): void {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) {
      cache.delete(key)
    }
  }
}

// ---------------------------------------------------------------------------
// GitHub username filter — set at sign-in, used to filter repos
// ---------------------------------------------------------------------------

let _githubUsername: string | null = null

export function setGithubUsernameFilter(username: string | null) {
  _githubUsername = username
  clearCache()
}

export function getGithubUsernameFilter(): string | null {
  return _githubUsername
}

// ---------------------------------------------------------------------------
// Repos
// ---------------------------------------------------------------------------

export interface RepoRecord {
  id: string
  full_name: string
  github_url: string
  first_seen_at: string
  latest_scan_id: string
}

function toISOString(value: unknown): string {
  if (typeof value === 'string') return value
  if (value && typeof value === 'object' && 'toDate' in value) {
    return (value as { toDate(): Date }).toDate().toISOString()
  }
  return new Date().toISOString()
}

function toRepoRecord(id: string, data: DocumentData): RepoRecord {
  return {
    id,
    full_name: data.full_name ?? id,
    github_url: data.github_url ?? '',
    first_seen_at: toISOString(data.first_seen_at),
    latest_scan_id: data.latest_scan_id ?? '',
  }
}

function belongsToUser(repo: RepoRecord): boolean {
  if (!_githubUsername) return true
  const owner = repo.full_name.split('/')[0]
  return owner.toLowerCase() === _githubUsername.toLowerCase()
}

export async function getRepos(): Promise<RepoRecord[]> {
  const key = `repos:${_githubUsername ?? ''}`
  const cached = getCached<RepoRecord[]>(key)
  if (cached) return cached
  const snapshot = await measure('getRepos', () => getDocs(collection(db, 'repos')))
  const result = snapshot.docs.map((d) => toRepoRecord(d.id, d.data())).filter(belongsToUser)
  setCached(key, result)
  return result
}

export async function getRepoById(repoId: string): Promise<RepoRecord | null> {
  const snap = await getDoc(doc(db, 'repos', repoId))
  if (!snap.exists()) return null
  const record = toRepoRecord(snap.id, snap.data())
  if (!belongsToUser(record)) return null
  return record
}

// ---------------------------------------------------------------------------
// Scan runs  —  repos/{repoId}/scan_runs/{scanId}
// ---------------------------------------------------------------------------

function toScanRecord(scanId: string, data: DocumentData, repoId: string): ScanRecord {
  return {
    id: scanId,
    repo_path: data.full_name ?? repoId,
    commit_sha: data.commit_hash ?? undefined,
    status: data.status ?? 'completed',
    rot_score: (data.rot_score ?? undefined) as number | undefined,
    mismatch_count: (data.total_issues ?? 0) as number,
    created_at: toISOString(data.scanned_at),
    updated_at: toISOString(data.scanned_at),
    branch: data.branch as string | undefined,
    high_count: (data.high_count ?? 0) as number,
    medium_count: (data.medium_count ?? 0) as number,
    low_count: (data.low_count ?? 0) as number,
    total_issues: (data.total_issues ?? 0) as number,
  }
}

function isIssueOpen(status: unknown): boolean {
  return status !== 'closed' && status !== 'resolved' && status !== 'ignored'
}

function parseIssuePriority(priority: unknown): 'high' | 'medium' | 'low' {
  if (priority === 'high' || priority === 'critical') return 'high'
  if (priority === 'medium') return 'medium'
  return 'low'
}

function applyLiveIssueMetrics(scan: ScanRecord, issues: DocumentData[]): ScanRecord {
  const openIssues = issues.filter((issue) => isIssueOpen(issue['status']))
  const highCount = openIssues.filter((issue) => parseIssuePriority(issue['priority'] ?? issue['severity']) === 'high').length
  const mediumCount = openIssues.filter((issue) => parseIssuePriority(issue['priority'] ?? issue['severity']) === 'medium').length
  const lowCount = openIssues.filter((issue) => parseIssuePriority(issue['priority'] ?? issue['severity']) === 'low').length

  const baseTotal = typeof scan.total_issues === 'number' && scan.total_issues > 0
    ? scan.total_issues
    : issues.length
  const baseRot = typeof scan.rot_score === 'number' && Number.isFinite(scan.rot_score)
    ? scan.rot_score
    : 0
  const rotRatio = baseTotal > 0 ? openIssues.length / baseTotal : 0
  const derivedRot = Math.max(0, Math.min(100, Math.round(baseRot * rotRatio)))

  return {
    ...scan,
    mismatch_count: openIssues.length,
    high_count: highCount,
    medium_count: mediumCount,
    low_count: lowCount,
    rot_score: derivedRot,
    total_issues: baseTotal,
  }
}

async function getIssuesForScanInRepo(repoId: string, scanId: string): Promise<DocumentData[]> {
  const key = `issues:${scanId}`
  const cached = getCached<DocumentData[]>(key)
  if (cached) return cached

  const issuesRef = collection(db, 'repos', repoId, 'scan_runs', scanId, 'flags')
  const snap = await measure(`getIssuesForScan:${repoId}`, () => getDocs(issuesRef))
  const result = snap.docs.map((d) => ({ id: d.id, _repoId: repoId, ...d.data() }))
  setCached(key, result)
  return result
}

export async function getAllScanRuns(): Promise<ScanRecord[]> {
  const key = `allScanRuns:${_githubUsername ?? ''}`
  const cached = getCached<ScanRecord[]>(key)
  if (cached) return cached

  const repos = await getRepos()
  const perRepo = await Promise.all(
    repos.map(async (repo) => {
      const scansRef = collection(db, 'repos', repo.id, 'scan_runs')
      const scansSnap = await measure(`getAllScanRuns:${repo.id}`, () =>
        getDocs(query(scansRef, orderBy('scanned_at', 'desc')))
      )
      const baseScans = scansSnap.docs.map((scanDoc) => toScanRecord(scanDoc.id, scanDoc.data(), repo.id))
      return Promise.all(
        baseScans.map(async (scan) => {
          const issues = await getIssuesForScanInRepo(repo.id, scan.id)
          return applyLiveIssueMetrics(scan, issues)
        }),
      )
    })
  )

  const result = perRepo.flat().sort((a, b) => Date.parse(b.created_at ?? '') - Date.parse(a.created_at ?? ''))
  setCached(key, result)
  return result
}

export async function getScanRunsForRepo(repoId: string): Promise<ScanRecord[]> {
  const key = `scanRuns:${repoId}`
  const cached = getCached<ScanRecord[]>(key)
  if (cached) return cached
  const scansRef = collection(db, 'repos', repoId, 'scan_runs')
  const scansSnap = await getDocs(query(scansRef, orderBy('scanned_at', 'desc')))
  const baseScans = scansSnap.docs.map((d) => toScanRecord(d.id, d.data(), repoId))
  const result = await Promise.all(
    baseScans.map(async (scan) => {
      const issues = await getIssuesForScanInRepo(repoId, scan.id)
      return applyLiveIssueMetrics(scan, issues)
    }),
  )
  setCached(key, result)
  return result
}

export async function getScanRunById(scanId: string): Promise<ScanRecord | null> {
  const repos = await getRepos()
  for (const repo of repos) {
    const scanRef = doc(db, 'repos', repo.id, 'scan_runs', scanId)
    const snap = await getDoc(scanRef)
    if (snap.exists()) {
      const baseScan = toScanRecord(snap.id, snap.data(), repo.id)
      const issues = await getIssuesForScanInRepo(repo.id, scanId)
      return applyLiveIssueMetrics(baseScan, issues)
    }
  }
  return null
}

// ---------------------------------------------------------------------------
// Flags  —  repos/{repoId}/scan_runs/{scanId}/flags/{flagId}
// ---------------------------------------------------------------------------

export async function getIssuesForScan(scanId: string): Promise<DocumentData[]> {
  const key = `issues:${scanId}`
  const cached = getCached<DocumentData[]>(key)
  if (cached) return cached
  const repos = await getRepos()
  for (const repo of repos) {
    const result = await getIssuesForScanInRepo(repo.id, scanId)
    if (result.length > 0) return result
  }
  setCached(key, [])
  return []
}

export async function closeIssue(repoId: string, scanId: string, issueId: string): Promise<void> {
  const flagRef = doc(db, 'repos', repoId, 'scan_runs', scanId, 'flags', issueId)
  await updateDoc(flagRef, { status: 'closed' })
  const key = `issues:${scanId}`
  const cached = getCached<DocumentData[]>(key)
  if (cached) {
    setCached(key, cached.map((issue) => issue['id'] === issueId ? { ...issue, status: 'closed' } : issue))
  }
  invalidateCachedByPrefix('allScanRuns:')
  invalidateCachedByPrefix('scanRuns:')
}

export async function reopenIssue(repoId: string, scanId: string, issueId: string): Promise<void> {
  const flagRef = doc(db, 'repos', repoId, 'scan_runs', scanId, 'flags', issueId)
  await updateDoc(flagRef, { status: 'open' })
  const key = `issues:${scanId}`
  const cached = getCached<DocumentData[]>(key)
  if (cached) {
    setCached(key, cached.map((issue) => issue['id'] === issueId ? { ...issue, status: 'open' } : issue))
  }
  invalidateCachedByPrefix('allScanRuns:')
  invalidateCachedByPrefix('scanRuns:')
}

// ---------------------------------------------------------------------------
// AI suggestions  —  repos/{repoId}/scan_runs/{scanId}/ai_suggestions
// ---------------------------------------------------------------------------

export interface AISuggestionDoc {
  id: string
  doc_path: string
  suggestion: string
  model_used: string
  triggered_by: string[]
}

export async function getAISuggestionsForScan(scanId: string): Promise<AISuggestionDoc[]> {
  const repos = await getRepos()
  for (const repo of repos) {
    const ref = collection(db, 'repos', repo.id, 'scan_runs', scanId, 'ai_suggestions')
    const snap = await measure(`getAISuggestionsForScan:${repo.id}`, () => getDocs(ref))
    if (!snap.empty) {
      return snap.docs.map((d) => {
        const data = d.data()
        return {
          id: d.id,
          doc_path: (data.doc_path ?? '') as string,
          suggestion: (data.suggestion ?? '') as string,
          model_used: (data.model_used ?? '') as string,
          triggered_by: (data.triggered_by ?? []) as string[],
        }
      })
    }
  }
  return []
}

// ---------------------------------------------------------------------------
// Fingerprint baselines  —  repos/{repoId}/fingerprint_baselines
// ---------------------------------------------------------------------------

export async function getFingerprintBaselines(repoId: string): Promise<DocumentData[]> {
  const ref = collection(db, 'repos', repoId, 'fingerprint_baselines')
  const snap = await getDocs(ref)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}
