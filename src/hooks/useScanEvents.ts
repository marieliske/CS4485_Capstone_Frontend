import { useEffect, useState } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db, localPreviewMode } from '../firebase'

/**
 * Listens to the top-level `repos` collection for any changes.
 * When a document is added or modified (e.g. latest_scan_id updates),
 * it fires the onScanAdded callback so pages can refresh.
 */
export function useScanEvents(onScanAdded: () => void, _initialLastId = 0, enabled = true) {
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    if (localPreviewMode || !enabled) return

    let firstSnapshot = true

    const unsubscribe = onSnapshot(
      collection(db, 'repos'),
      () => {
        setIsConnected(true)
        // Skip the initial snapshot — only fire on subsequent changes
        if (firstSnapshot) {
          firstSnapshot = false
          return
        }
        onScanAdded()
      },
      () => {
        setIsConnected(false)
      },
    )

    return () => {
      unsubscribe()
      setIsConnected(false)
    }
  }, [enabled, onScanAdded])

  return { isConnected }
}
