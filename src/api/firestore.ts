import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  type DocumentData,
} from 'firebase/firestore'
import { db } from '../firebase'
import type { ScanRecord } from './scans'

// ---------------------------------------------------------------------------
// GitHub username filter — set at sign-in, used to filter repos
// ---------------------------------------------------------------------------

let _githubUsername: string | null = null

export function setGithubUsernameFilter(username: string | null) {
  _githubUsername = username
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
  const snapshot = await getDocs(collection(db, 'repos'))
  const all = snapshot.docs.map((d) => toRepoRecord(d.id, d.data()))
  return all.filter(belongsToUser)
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
    rot_score: undefined,
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

export async function getAllScanRuns(): Promise<ScanRecord[]> {
  const repos = await getRepos()
  const allScans: ScanRecord[] = []

  for (const repo of repos) {
    const scansRef = collection(db, 'repos', repo.id, 'scan_runs')
    const scansSnap = await getDocs(query(scansRef, orderBy('scanned_at', 'desc')))
    for (const scanDoc of scansSnap.docs) {
      allScans.push(toScanRecord(scanDoc.id, scanDoc.data(), repo.id))
    }
  }

  allScans.sort((a, b) => {
    const aTime = Date.parse(a.created_at ?? '')
    const bTime = Date.parse(b.created_at ?? '')
    return bTime - aTime
  })

  return allScans
}

export async function getScanRunsForRepo(repoId: string): Promise<ScanRecord[]> {
  const scansRef = collection(db, 'repos', repoId, 'scan_runs')
  const scansSnap = await getDocs(query(scansRef, orderBy('scanned_at', 'desc')))
  return scansSnap.docs.map((d) => toScanRecord(d.id, d.data(), repoId))
}

export async function getScanRunById(scanId: string): Promise<ScanRecord | null> {
  const repos = await getRepos()
  for (const repo of repos) {
    const scanRef = doc(db, 'repos', repo.id, 'scan_runs', scanId)
    const snap = await getDoc(scanRef)
    if (snap.exists()) {
      return toScanRecord(snap.id, snap.data(), repo.id)
    }
  }
  return null
}

// ---------------------------------------------------------------------------
// Issues  —  repos/{repoId}/scan_runs/{scanId}/issues/{issueId}
// ---------------------------------------------------------------------------

export async function getIssuesForScan(scanId: string): Promise<DocumentData[]> {
  const repos = await getRepos()
  for (const repo of repos) {
    const issuesRef = collection(db, 'repos', repo.id, 'scan_runs', scanId, 'issues')
    const snap = await getDocs(issuesRef)
    if (!snap.empty) {
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
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
