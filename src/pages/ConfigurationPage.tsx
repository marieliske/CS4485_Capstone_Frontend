const mappings = [
  {
    glob: 'src/**/*.ts',
    doc: 'docs/api/core-concepts.md',
    synced: '14 min ago',
    status: 'Active',
    tone: 'active',
  },
  {
    glob: 'libs/ui/**/*.{js,jsx}',
    doc: 'docs/design-system/components.md',
    synced: '2h ago',
    status: 'Pending',
    tone: 'pending',
  },
  {
    glob: 'scripts/*.sh',
    doc: 'docs/ops/deployment-guide.md',
    synced: 'Never',
    status: 'Disabled',
    tone: 'disabled',
  },
] as const


export function ConfigurationPage() {
  return (
    <section className="configuration-page">
      <header className="configuration-header">
        <p className="configuration-title-copy">Global Configuration Settings</p>
        <p>Manage documentation automated detection behavior triggered on git push.</p>
      </header>

      <section className="configuration-section">
        <div className="configuration-section-head">
          <h3>{'{ }'} Doc Mappings</h3>
          <button type="button" className="config-link-btn">
            + Add Pattern
          </button>
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
                <tr key={row.glob}>
                  <td className="config-glob-cell">{row.glob}</td>
                  <td>{row.doc}</td>
                  <td className="config-muted-cell">{row.synced}</td>
                  <td>
                    <span className={`config-status-pill ${row.tone}`}>● {row.status}</span>
                  </td>
                  <td>
                    <button type="button" className="config-action-btn" aria-label={`Actions for ${row.glob}`}>
                      ⋮
                    </button>
                  </td>
                </tr>
              ))}
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
              <strong>85%</strong>
            </div>
            <div className="config-threshold-track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={85}>
              <span style={{ width: '85%' }} />
            </div>
            <p>Minimum similarity score before documentation is flagged as "Rotten".</p>
          </article>
        </section>

      </div>

      <aside className="configuration-tip">
        <h4>Configuration Tip</h4>
        <p>
          For better results, try to keep your glob patterns as specific as possible. Broad patterns like
          "**/*" may increase scan times and result in false positives if your project contains a large
          number of assets or third-party libraries.
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
