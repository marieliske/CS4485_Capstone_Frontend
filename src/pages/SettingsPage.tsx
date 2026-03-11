export function SettingsPage() {
  const mappingRows = [
    { codePath: 'src/**/*.py', docFile: 'docs/api.md' },
    { codePath: 'lib/utils/*.ts', docFile: 'docs/utils.md' },
  ]

  return (
    <section className="config-page">
      <header className="config-header">
        <div>
          <h3>Configuration</h3>
          <p>Manage your code-to-documentation mappings and detection thresholds.</p>
        </div>
        <div className="config-actions">
          <button className="config-btn" type="button">
            Discard Changes
          </button>
          <button className="config-btn primary" type="button">
            Save Changes
          </button>
        </div>
      </header>

      <section className="config-block">
        <h4>Doc Mappings</h4>
        <p>Define which parts of your codebase correspond to specific documentation files.</p>

        <div className="config-mapping-table-wrap">
          <table className="config-mapping-table">
            <thead>
              <tr>
                <th>Code Path (Glob)</th>
                <th>Documentation File</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {mappingRows.map((row) => (
                <tr key={row.codePath}>
                  <td>
                    <span className="config-code-pill">{row.codePath}</span>
                  </td>
                  <td>{row.docFile}</td>
                  <td>
                    <button className="config-delete-btn" type="button">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="config-add-row">
            <label>
              Code Path
              <input className="input" defaultValue="e.g. src/*.py" type="text" />
            </label>
            <label>
              Documentation File
              <input className="input" defaultValue="e.g. docs/api.md" type="text" />
            </label>
            <button className="config-btn add" type="button">
              + Add
            </button>
          </div>
        </div>
      </section>

      <section className="config-block">
        <h4>Threshold Settings</h4>
        <p>Define the sensitivity levels for triggering "stale documentation" alerts.</p>

        <div className="config-threshold-grid">
          <article className="config-threshold-card">
            <h5>Per-Function Substantial</h5>
            <p>The number of meaningful code changes required within a single function before a doc update is flagged.</p>
            <div className="config-threshold-input-row">
              <input className="input" defaultValue="4" type="number" />
              <span>commits</span>
            </div>
            <small>Default: 4 commits</small>
          </article>

          <article className="config-threshold-card">
            <h5>Per-Doc Cumulative</h5>
            <p>Total combined changes across all mapped files before the entire document is marked as needing review.</p>
            <div className="config-threshold-input-row">
              <input className="input" defaultValue="8" type="number" />
              <span>diffs</span>
            </div>
            <small>Default: 8 total diff units</small>
          </article>
        </div>

        <aside className="config-tip">
          <h6>Configuration Tip</h6>
          <p>
            Lower thresholds will result in more frequent alerts. For mature codebases, we recommend
            starting with the default values and adjusting based on the "Drift Score" seen in your
            Dashboard.
          </p>
        </aside>
      </section>
    </section>
  )
}
