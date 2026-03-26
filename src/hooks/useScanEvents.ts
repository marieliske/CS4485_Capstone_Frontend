import { useEffect, useRef, useState } from 'react'

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api'
const TOKEN = import.meta.env.VITE_DOCROT_TOKEN
const EVENTS_PATH = import.meta.env.VITE_SCAN_EVENTS_PATH ?? '/events/scans'

function buildEventsUrl(lastSeenId: number): string {
  const normalizedBase = API_BASE.endsWith('/') ? API_BASE.slice(0, -1) : API_BASE
  const normalizedPath = EVENTS_PATH.startsWith('/') ? EVENTS_PATH : `/${EVENTS_PATH}`
  const url = new URL(`${normalizedBase}${normalizedPath}`, window.location.origin)

  if (TOKEN) {
    url.searchParams.set('token', TOKEN)
  }

  url.searchParams.set('last_id', `${lastSeenId}`)
  return url.toString()
}

interface ScanEventPayload {
  scan_id?: unknown
}

export function useScanEvents(onScanAdded: () => void, initialLastId = 0, enabled = true) {
  const esRef = useRef<EventSource | null>(null)
  const lastIdRef = useRef(initialLastId)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    lastIdRef.current = Math.max(lastIdRef.current, initialLastId)
  }, [initialLastId])

  useEffect(() => {
    if (!enabled || !TOKEN) {
      esRef.current?.close()
      esRef.current = null
      setIsConnected(false)
      return
    }

    if (esRef.current) {
      return
    }

    const es = new EventSource(buildEventsUrl(lastIdRef.current))
    esRef.current = es

    es.addEventListener('open', () => {
      setIsConnected(true)
    })

    es.addEventListener('connected', () => {
      setIsConnected(true)
    })

    es.addEventListener('scan_added', (evt) => {
      try {
        const payload = JSON.parse((evt as MessageEvent).data) as ScanEventPayload
        if (typeof payload.scan_id === 'number') {
          lastIdRef.current = Math.max(lastIdRef.current, payload.scan_id)
        }
      } catch {
        // Ignore malformed SSE payloads and still refresh scans.
      }

      onScanAdded()
    })

    es.onerror = () => {
      // Browser auto-reconnect handles stream recovery.
      setIsConnected(false)
    }

    return () => {
      es.close()
      esRef.current = null
      setIsConnected(false)
    }
  }, [enabled, onScanAdded])

  return { isConnected }
}
