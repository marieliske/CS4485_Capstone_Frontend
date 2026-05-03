import { useEffect, useMemo, useState } from 'react'

type MappingTone = 'active' | 'pending' | 'disabled'

type MappingRow = {
  id: string
  glob: string
  doc: string
  synced: string
  status: 'Active' | 'Pending' | 'Disabled'
  tone: MappingTone
}

const initialMappings: MappingRow[] = [
  {
    id: 'mapping-1',
    glob: 'src/**/*.ts',
    doc: 'docs/api/core-concepts.md',
    synced: '14 min ago',
    status: 'Active',
    tone: 'active',
  },
  {
    id: 'mapping-2',
    glob: 'libs/ui/**/*.{js,jsx}',
    doc: 'docs/design-system/components.md',
    synced: '2h ago',
    status: 'Pending',
    tone: 'pending',
  },
  {
    id: 'mapping-3',
    glob: 'scripts/*.sh',
    doc: 'docs/ops/deployment-guide.md',
    synced: 'Never',
    status: 'Disabled',
    tone: 'disabled',
  },
]

const mappingsStorageKey = 'docrot_configuration_mappings_v1'

function isMappingTone(value: unknown): value is MappingTone {
  return value === 'active' || value === 'pending' || value === 'disabled'
}

function isMappingStatus(value: unknown): value is MappingRow['status'] {
  return value === 'Active' || value === 'Pending' || value === 'Disabled'
}

function isMappingRow(value: unknown): value is MappingRow {
  if (!value || typeof value !== 'object') return false

  const row = value as Record<string, unknown>

  return (
    typeof row.id === 'string' &&
    typeof row.glob === 'string' &&
    typeof row.doc === 'string' &&
    typeof row.synced === 'string' &&
    isMappingStatus(row.status) &&
    isMappingTone(row.tone)
  )
}

function loadSavedMappings(): MappingRow[] | null {
  if (typeof window === 'undefined') return null

  try {
    const raw = window.localStorage.getItem(mappingsStorageKey)
    if (!raw) return null

    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return null
    if (parsed.length === 0) return []

    const validRows = parsed.filter(isMappingRow)
    if (validRows.length !== parsed.length) return null

    return validRows
  } catch {
    return null
  }
}

function toStatusMeta(enabled: boolean): {
  status: MappingRow['status']
  tone: MappingTone
} {
  if (enabled) {
    return { status: 'Active', tone: 'active' }
  }

  return { status: 'Disabled', tone: 'disabled' }
}

function toneToPill(tone: MappingTone): string {
  if (tone === 'active') return 'pill-success'
  if (tone === 'pending') return 'pill-warning'
  return ''
}

function toneToDotClass(tone: MappingTone): string {
  if (tone === 'active') return 'config-status-dot-active'
  if (tone === 'pending') return 'config-status-dot-pending'
  return 'config-status-dot-disabled'
}

export function ConfigurationPage() {
  const [mappings, setMappings] = useState<MappingRow[]>(() => loadSavedMappings() ?? initialMappings)
  const [threshold, setThreshold] = useState(85)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  const totalPatterns = mappings.length
  const activePatterns = useMemo(
    () => mappings.filter((row) => row.tone === 'active').length,
    [mappings],
  )

  const handleAddPattern = () => {
    const nextIndex = mappings.length + 1

    const newRow: MappingRow = {
      id: `mapping-${Date.now()}`,
      glob: `new/path/pattern-${nextIndex}/**/*`,
      doc: `docs/new-doc-${nextIndex}.md`,
      synced: 'Never',
      status: 'Pending',
      tone: 'pending',
    }

    setMappings((prev) => [newRow, ...prev])
    setOpenMenuId(null)
  }

  const handleEditPattern = (id: string) => {
    const row = mappings.find((item) => item.id === id)
    if (!row) return

    const nextGlob = window.prompt('Edit glob pattern', row.glob)
    if (nextGlob === null) return

    const nextDoc = window.prompt('Edit documentation file', row.doc)
    if (nextDoc === null) return

    setMappings((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              glob: nextGlob.trim() || item.glob,
              doc: nextDoc.trim() || item.doc,
              synced: 'Just now',
              status: item.tone === 'disabled' ? 'Disabled' : 'Pending',
              tone: item.tone === 'disabled' ? 'disabled' : 'pending',
            }
          : item,
      ),
    )

    setOpenMenuId(null)
  }

  const handleTogglePattern = (id: string) => {
    setMappings((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item

        const currentlyEnabled = item.tone !== 'disabled'
        const nextMeta = toStatusMeta(!currentlyEnabled)

        return {
          ...item,
          ...nextMeta,
          synced: item.synced === 'Never' ? 'Never' : 'Just now',
        }
      }),
    )

    setOpenMenuId(null)
  }

  const handleDeletePattern = (id: string) => {
    setMappings((prev) => prev.filter((item) => item.id !== id))
    setOpenMenuId(null)
  }

  const handleApplyChanges = () => {
    window.alert(
      `Configuration saved.\n\nPatterns: ${mappings.length}\nActive: ${activePatterns}\nThreshold: ${threshold}%`,
    )
  }

  useEffect(() => {
    try {
      window.localStorage.setItem(mappingsStorageKey, JSON.stringify(mappings))
    } catch {
      // Ignore persistence failures (e.g., private mode or blocked storage).
    }
  }, [mappings])

  useEffect(() => {
    const handleApply = () => {
      handleApplyChanges()
    }

    window.addEventListener('configuration:apply', handleApply)

    return () => {
      window.removeEventListener('configuration:apply', handleApply)
    }
  }, [mappings, threshold, activePatterns])

  return (
    <div>
      {/* Page head */}
      <div className="page-head">
        <div>
          <div className="kicker">workspace settings</div>
          <h1>Configuration</h1>
          <p className="sub">
            Manage documentation detection behaviour triggered on git push.
          </p>
        </div>
        <div className="page-head-actions">
          <button type="button" className="btn btn-ghost" onClick={handleAddPattern}>
            + Add Pattern
          </button>
          <button type="button" className="btn btn-accent" onClick={handleApplyChanges}>
            Apply Changes
          </button>
        </div>
      </div>

      {/* Doc Mappings */}
      <div className="card" style={{ marginBottom: 20, overflow: 'visible' }}>
        <div className="card-head">
          <h3>{'{ }'} Doc Mappings</h3>
          <span className="hint">{totalPatterns} patterns</span>
        </div>
        <table className="tbl">
          <thead>
            <tr>
              <th>Glob Pattern</th>
              <th>Documentation File</th>
              <th style={{ width: 110 }}>Last Synced</th>
              <th style={{ width: 132 }}>Status</th>
              <th style={{ width: 50 }} />
            </tr>
          </thead>
          <tbody>
            {mappings.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  style={{ textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}
                >
                  No mapping patterns yet. Add one to begin linking code paths to documentation.
                </td>
              </tr>
            ) : (
              mappings.map((row) => (
                <tr key={row.id} style={{ cursor: 'default' }}>
                  <td>
                    <code
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 12,
                        color: 'var(--ink-2)',
                        background: 'var(--bg-sunken)',
                        padding: '2px 6px',
                        borderRadius: 4,
                      }}
                    >
                      {row.glob}
                    </code>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{row.doc}</td>
                  <td
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 11.5,
                      color: 'var(--ink-3)',
                    }}
                  >
                    {row.synced}
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <span className={`pill config-status-pill ${toneToPill(row.tone)}`}>
                      <span className={`config-status-dot ${toneToDotClass(row.tone)}`} />
                      {row.status}
                    </span>
                  </td>
                  <td style={{ position: 'relative' }}>
                    <button
                      type="button"
                      className="btn btn-sm btn-ghost"
                      aria-label={`Actions for ${row.glob}`}
                      onClick={() =>
                        setOpenMenuId((current) => (current === row.id ? null : row.id))
                      }
                    >
                      ⋮
                    </button>

                    {openMenuId === row.id ? (
                      <div
                        style={{
                          position: 'absolute',
                          right: 0,
                          top: 'calc(100% + 6px)',
                          minWidth: '152px',
                          background: 'var(--bg-elev)',
                          border: '1px solid var(--border)',
                          borderRadius: 'var(--r-md)',
                          padding: '0.35rem',
                          display: 'grid',
                          gap: '0.25rem',
                          zIndex: 40,
                          boxShadow: 'var(--shadow-md)',
                        }}
                      >
                        <button
                          type="button"
                          className="btn btn-sm"
                          style={{ justifyContent: 'flex-start' }}
                          onClick={() => handleEditPattern(row.id)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm"
                          style={{ justifyContent: 'flex-start' }}
                          onClick={() => handleTogglePattern(row.id)}
                        >
                          {row.tone === 'disabled' ? 'Enable' : 'Disable'}
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-danger"
                          style={{ justifyContent: 'flex-start' }}
                          onClick={() => handleDeletePattern(row.id)}
                        >
                          Delete
                        </button>
                      </div>
                    ) : null}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Grid: threshold + summary */}
      <div className="grid-2 config-grid-2" style={{ marginBottom: 20 }}>
        {/* Detection Sensitivity */}
        <div className="card card-pad">
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10.5,
              color: 'var(--ink-3)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: 16,
            }}
          >
            Detection Sensitivity
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              marginBottom: 10,
            }}
          >
            <span style={{ fontSize: 13, color: 'var(--ink-2)' }}>Threshold Score</span>
            <strong
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 28,
                letterSpacing: '-0.03em',
              }}
            >
              {threshold}%
            </strong>
          </div>
          <div
            style={{
              height: 6,
              background: 'var(--border)',
              borderRadius: 99,
              overflow: 'hidden',
              marginBottom: 12,
            }}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={threshold}
          >
            <div
              style={{
                height: '100%',
                width: `${threshold}%`,
                background:
                  threshold > 70
                    ? 'var(--success)'
                    : threshold > 40
                      ? 'var(--warning)'
                      : 'var(--critical)',
                borderRadius: 99,
                transition: 'width 200ms',
              }}
            />
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={threshold}
            onChange={(event) => setThreshold(Number(event.target.value))}
            style={{ width: '100%', marginBottom: 12 }}
            aria-label="Detection threshold score"
          />
          <p style={{ fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.5 }}>
            Minimum similarity score before documentation is flagged as "Rotten".
          </p>
        </div>

        {/* Quick Summary */}
        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="card-head">
            <h3>Quick Summary</h3>
          </div>
          <div className="kv-list">
            {[
              {
                k: 'Total patterns',
                v: `${totalPatterns} configured`,
                pill: 'pill',
                pillLabel: 'Tracked',
              },
              {
                k: 'Active patterns',
                v: `${activePatterns} enabled`,
                pill: 'pill pill-success',
                pillLabel: 'Live',
              },
              {
                k: 'Sensitivity',
                v: `${threshold}% threshold`,
                pill: 'pill pill-accent',
                pillLabel: 'Applied',
              },
            ].map(({ k, v, pill, pillLabel }) => (
              <div key={k} className="kv-row">
                <span className="k">{k}</span>
                <span className="v">{v}</span>
                <span className={pill}>{pillLabel}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tip */}
      <div
        className="card card-pad"
        style={{
          borderLeft: '3px solid var(--accent)',
          background: 'color-mix(in oklab, var(--accent) 5%, var(--bg-elev))',
          marginBottom: 20,
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10.5,
            color: 'var(--accent-ink)',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginBottom: 8,
          }}
        >
          Configuration tip
        </div>
        <p style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.55 }}>
          For better results, keep your glob patterns as specific as possible. Broad patterns
          like "**/*" may increase scan times and produce false positives if your project
          contains many assets or third-party libraries.
        </p>
      </div>

    </div>
  )
}
