/**
 * Measures the duration of an async operation and logs it to the console.
 *
 * Usage:
 *   const result = await measure('getRepos', () => getDocs(...))
 *
 * Output (console.debug):
 *   [perf] getRepos: 142.3ms
 *   [perf] getRepos: failed after 12.1ms
 */
export async function measure<T>(label: string, fn: () => Promise<T>): Promise<T> {
  const start = performance.now()
  try {
    const result = await fn()
    console.debug(`[perf] ${label}: ${(performance.now() - start).toFixed(1)}ms`)
    return result
  } catch (err) {
    console.debug(`[perf] ${label}: failed after ${(performance.now() - start).toFixed(1)}ms`)
    throw err
  }
}

/**
 * Callback for React's <Profiler> component.
 * Only logs renders that took longer than the threshold (default 100ms).
 */
export function onRenderCallback(
  id: string,
  phase: 'mount' | 'update' | 'nested-update',
  actualDuration: number,
  _baseDuration: number,
  _startTime: number,
  _commitTime: number,
  threshold = 100,
): void {
  if (actualDuration > threshold) {
    console.debug(`[perf:render] ${id} (${phase}): ${actualDuration.toFixed(1)}ms`)
  }
}
