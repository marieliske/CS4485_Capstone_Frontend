/**
 * Auto-fix API client — calls the `applyFix` Cloud Function to open a
 * PR on the user's repo that applies a deterministic doc patch.
 *
 * The Cloud Function URL is read from `VITE_APPLY_FIX_URL`. Typical
 * value for a v2 onRequest function:
 *   https://<region>-<project>.cloudfunctions.net/applyFix
 */

export interface ApplyFixRequest {
  repoId: string
  scanId: string
  flagId: string
  userToken: string
  dryRun?: boolean
  baseBranch?: string | null
}

export interface ApplyFixResponse {
  success: boolean
  dry_run?: boolean
  doc_path?: string
  reason?: string
  summary?: string
  todo_notes?: string[]
  branch?: string
  pr_url?: string
  pr_number?: number
  error?: string
}

const FUNCTION_URL = import.meta.env.VITE_APPLY_FIX_URL ?? ''

export class AutoFixError extends Error {
  status?: number
  constructor(message: string, status?: number) {
    super(message)
    this.name = 'AutoFixError'
    this.status = status
  }
}

export async function applyAutoFix(req: ApplyFixRequest): Promise<ApplyFixResponse> {
  if (!FUNCTION_URL) {
    throw new AutoFixError(
      'VITE_APPLY_FIX_URL is not configured. Set it to the applyFix Cloud Function URL.',
    )
  }

  const body: Record<string, unknown> = {
    repo_id: req.repoId,
    scan_id: req.scanId,
    flag_id: req.flagId,
    user_token: req.userToken,
    dry_run: req.dryRun === true,
  }
  if (req.baseBranch) {
    body.base_branch = req.baseBranch
  }

  let response: Response
  try {
    response = await fetch(FUNCTION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch (err) {
    throw new AutoFixError(
      err instanceof Error ? `Network error: ${err.message}` : 'Network error',
    )
  }

  let payload: ApplyFixResponse | null = null
  try {
    payload = (await response.json()) as ApplyFixResponse
  } catch {
    // non-JSON response
  }

  if (!response.ok) {
    const message = payload?.error || `Auto-fix failed with status ${response.status}`
    throw new AutoFixError(message, response.status)
  }

  return payload ?? { success: false, error: 'Empty response' }
}
