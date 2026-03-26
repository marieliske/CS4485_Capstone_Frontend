const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'
const DOCROT_TOKEN = import.meta.env.VITE_DOCROT_TOKEN

export type JsonObject = Record<string, unknown>

function buildHeaders(initHeaders?: HeadersInit, hasBody = false): Headers {
  const headers = new Headers(initHeaders)
  if (hasBody && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  if (DOCROT_TOKEN) {
    headers.set('Authorization', `Bearer ${DOCROT_TOKEN}`)
    headers.set('X-Docrot-Token', DOCROT_TOKEN)
  }

  return headers
}

async function parseErrorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as JsonObject
    const message = body.message
    const error = body.error
    if (typeof message === 'string' && message.length > 0) {
      return message
    }
    if (typeof error === 'string' && error.length > 0) {
      return error
    }
  } catch {
    // Ignore JSON parse errors and fall back to the status text.
  }

  return `API request failed with status ${response.status}${response.statusText ? ` ${response.statusText}` : ''}`
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const hasBody = init.body !== undefined && init.body !== null
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: buildHeaders(init.headers, hasBody),
  })

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response))
  }

  return (await response.json()) as T
}

export function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : []
}

export function asObject(value: unknown): JsonObject {
  return value !== null && typeof value === 'object' ? (value as JsonObject) : {}
}
