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

function toStatusMeta(enabled: boolean): {
  status: MappingRow['status']
  tone: MappingTone
} {
  if (enabled) {
    return { status: 'Active', tone: 'active' }
  }

  return { status: 'Disabled', tone: 'disabled' }
}

export function ConfigurationPage() {
  const [mappings, setMappings] = useState<MappingRow[]>(initialMappings)
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
    const handleApply = () => {
      handleApplyChanges()
    }

    window.addEventListener('configuration:apply', handleApply)

    return () => {
      window.removeEventListener('configuration:apply', handleApply)
    }
  }, [mappings, threshold, activePatterns])

  return (
    <section className="configuration-page">
      <header className="configuration-header">
        <p className="configuration-title-copy">Global Configuration Settings</p>
        <p>Manage documentation automated detection behavior triggered on git push.</p>
      </header>

      <section className="configuration-section">
        <div className="configuration-section-head">
          <h3>{'{ }'} Doc Mappings</h3>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button type="button" className="config-link-btn" onClick={handleAddPattern}>
              + Add Pattern
            </button>

            <button type="button" className="apply-changes-btn" onClick={handleApplyChanges}>
              Apply Changes
            </button>
          </div>
        </div>

        <div className="config-table-shell">
          <table className="config-table">
            <thead>
              <tr>
                <th>Glob Pattern</th>
                <th>Documentation File</th>
                <th>Last Synced</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {mappings.map((row) => (
                <tr key={row.id}>
                  <td className="config-glob-cell">{row.glob}</td>
                  <td>{row.doc}</td>
                  <td className="config-muted-cell">{row.synced}</td>
                  <td>
                    <span className={`config-status-pill ${row.tone}`}>● {row.status}</span>
                  </td>
                  <td style={{ position: 'relative' }}>
                    <button
                      type="button"
                      className="config-action-btn"
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
                          background: '#15243f',
                          border: '1px solid #1f3355',
                          borderRadius: '10px',
                          padding: '0.35rem',
                          display: 'grid',
                          gap: '0.25rem',
                          zIndex: 10,
                        }}
                      >
                        <button
                          type="button"
                          className="btn"
                          style={{ justifyContent: 'flex-start' }}
                          onClick={() => handleEditPattern(row.id)}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="btn"
                          style={{ justifyContent: 'flex-start' }}
                          onClick={() => handleTogglePattern(row.id)}
                        >
                          {row.tone === 'disabled' ? 'Enable' : 'Disable'}
                        </button>

                        <button
                          type="button"
                          className="btn"
                          style={{ justifyContent: 'flex-start' }}
                          onClick={() => handleDeletePattern(row.id)}
                        >
                          Delete
                        </button>
                      </div>
                    ) : null}
                  </td>
                </tr>
              ))}

              {mappings.length === 0 ? (
                <tr>
                  <td colSpan={5} className="config-muted-cell">
                    No mapping patterns yet. Add one to begin linking code paths to documentation.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <div className="configuration-grid">
        <section className="configuration-section compact">
          <div className="configuration-section-head">
            <h3>Detection Sensitivity</h3>
          </div>

          <article className="config-threshold-card">
            <div className="config-threshold-head">
              <span>Threshold Score</span>
              <strong>{threshold}%</strong>
            </div>

            <div
              className="config-threshold-track"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={threshold}
            >
              <span style={{ width: `${threshold}%` }} />
            </div>

            <input
              type="range"
              min={0}
              max={100}
              value={threshold}
              onChange={(event) => setThreshold(Number(event.target.value))}
              style={{ width: '100%', marginTop: '0.9rem' }}
              aria-label="Detection threshold score"
            />

            <p>Minimum similarity score before documentation is flagged as "Rotten".</p>
          </article>
        </section>

        <section className="configuration-section compact">
          <div className="configuration-section-head">
            <h3>Quick Summary</h3>
          </div>

          <ul className="config-alert-list">
            <li>
              <div>
                <strong>{totalPatterns}</strong>
                <p>Total mapping patterns configured</p>
              </div>
              <span className="config-status-pill pending">Tracked</span>
            </li>

            <li>
              <div>
                <strong>{activePatterns}</strong>
                <p>Patterns currently enabled</p>
              </div>
              <span className="config-status-pill active">Live</span>
            </li>

            <li>
              <div>
                <strong>{threshold}%</strong>
                <p>Current documentation sensitivity threshold</p>
              </div>
              <span className="config-status-pill active">Applied</span>
            </li>
          </ul>
        </section>
      </div>

      <aside className="configuration-tip">
        <h4>Configuration Tip</h4>
        <p>
          For better results, try to keep your glob patterns as specific as possible. Broad
          patterns like "**/*" may increase scan times and result in false positives if your
          project contains a large number of assets or third-party libraries.
        </p>
      </aside>

      <footer className="configuration-footer">
        <span>© 2024 DocRot Detector. Documentation management simplified.</span>
        <div>
          <button type="button">Privacy Policy</button>
          <button type="button">API Docs</button>
          <button type="button">Help Center</button>
        </div>
      </footer>
    </section>
  )
}