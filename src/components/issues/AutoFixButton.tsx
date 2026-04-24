import { useState } from 'react'
import type { Issue } from '../../types/issue'
import { applyAutoFix, AutoFixError, type ApplyFixResponse } from '../../api/autoFix'

interface AutoFixButtonProps {
  issue: Issue
}

const TOKEN_STORAGE_KEY = 'docrot.github_token'

const SUPPORTED_REASONS = new Set([
  'signature_changed',
  'parameter_added',
  'parameter_removed',
  'parameter_renamed',
  'return_type_changed',
  'symbol_removed',
])

function readStoredToken(): string {
  try {
    return sessionStorage.getItem(TOKEN_STORAGE_KEY) ?? ''
  } catch {
    return ''
  }
}

function storeToken(token: string) {
  try {
    sessionStorage.setItem(TOKEN_STORAGE_KEY, token)
  } catch {
    // storage may be unavailable (private mode); ignore
  }
}

export function AutoFixButton({ issue }: AutoFixButtonProps) {
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<ApplyFixResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const canRun = Boolean(issue.repoId && issue.scanId && issue.id)
  const reasonSupported = SUPPORTED_REASONS.has(issue.reason)

  async function run(dryRun: boolean) {
    setBusy(true)
    setError(null)
    setResult(null)

    if (!canRun) {
      setError('Missing repo or scan context for this issue.')
      setBusy(false)
      return
    }

    let token = readStoredToken()
    if (!token) {
      const entered = window.prompt(
        'Paste a GitHub personal access token with `repo` scope. ' +
          'It will be kept only for this browser session.',
      )
      token = (entered ?? '').trim()
      if (!token) {
        setError('A GitHub token is required to open a pull request.')
        setBusy(false)
        return
      }
      storeToken(token)
    }

    try {
      const response = await applyAutoFix({
        repoId: issue.repoId!,
        scanId: issue.scanId!,
        flagId: issue.id,
        userToken: token,
        dryRun,
      })
      setResult(response)
      if (!response.success && response.error) {
        setError(response.error)
      }
    } catch (err) {
      const message = err instanceof AutoFixError ? err.message : 'Auto-fix failed.'
      setError(message)
    } finally {
      setBusy(false)
    }
  }

  if (!reasonSupported) {
    return (
      <div className="detail-section">
        <p className="detail-label">Auto-Fix</p>
        <p className="detail-copy">
          Auto-fix is not available for <strong>{issue.reason}</strong> flags. The
          deterministic patch generator handles signature, parameter, return-type, and
          symbol-removed changes only.
        </p>
      </div>
    )
  }

  return (
    <div className="detail-section">
      <p className="detail-label">Auto-Fix</p>
      <p className="detail-copy">
        Apply a deterministic documentation patch for this issue and open a pull
        request on the source repo. Dry-run previews the patch without touching GitHub.
      </p>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => run(true)}
          disabled={busy || !canRun}
        >
          {busy ? 'Working…' : 'Preview Fix (Dry Run)'}
        </button>
        <button
          type="button"
          className="btn btn-accent btn-sm"
          onClick={() => run(false)}
          disabled={busy || !canRun}
        >
          {busy ? 'Opening PR…' : 'Apply Fix & Open PR'}
        </button>
      </div>

      {!canRun ? (
        <p style={{ marginTop: '0.5rem', fontSize: 12, color: 'var(--critical)' }}>
          This issue is missing repo/scan identifiers, so auto-fix can't run.
        </p>
      ) : null}

      {error ? (
        <p style={{ marginTop: '0.5rem', fontSize: 12, color: 'var(--critical)' }}>
          {error}
        </p>
      ) : null}

      {result && result.success ? (
        <div style={{ marginTop: '0.75rem', fontSize: 13 }}>
          {result.dry_run ? (
            <p><strong>Dry run OK.</strong> {result.summary ?? 'Patch generated successfully.'}</p>
          ) : (
            <p>
              <strong>PR opened.</strong>{' '}
              {result.pr_url ? (
                <a href={result.pr_url} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>
                  {result.pr_url}
                </a>
              ) : (
                'See your repository for the new pull request.'
              )}
            </p>
          )}
          {result.doc_path ? (
            <p style={{ marginTop: '0.25rem', color: 'var(--ink-3)' }}>
              <em>Doc:</em> {result.doc_path}
            </p>
          ) : null}
          {result.todo_notes && result.todo_notes.length > 0 ? (
            <ul style={{ marginTop: '0.25rem', paddingLeft: '1rem' }}>
              {result.todo_notes.map((note, idx) => (
                <li key={idx}>{note}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
