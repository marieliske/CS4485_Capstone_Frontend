import { Card } from '../components/shared/Card'

export function SettingsPage() {
  return (
    <section className="page-stack">
      <div className="panel-grid settings-layout">
        <Card title="Scanner Runtime Configuration">
          <div className="form-grid">
            <label className="form-field">
              CLI Scan Interval (seconds)
              <input className="input" defaultValue="30" type="number" />
            </label>
            <label className="form-field">
              Mismatch Confidence Threshold
              <select className="select" defaultValue="medium">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </label>
            <label className="form-field">
              Environment
              <select className="select" defaultValue="development">
                <option value="development">Development</option>
                <option value="staging">Staging</option>
                <option value="production">Production</option>
                <option value="ci">CI / GitHub Actions</option>
              </select>
            </label>
          </div>
        </Card>

        <Card title="Workflow Integration">
          <div className="checkbox-stack">
            <label>
              <input defaultChecked type="checkbox" /> Enable local CLI scanning (offline)
            </label>
            <label>
              <input defaultChecked type="checkbox" /> Run pre-commit Git hook checks
            </label>
            <label>
              <input defaultChecked type="checkbox" /> Trigger GitHub Actions scan on PR
            </label>
            <label>
              <input defaultChecked type="checkbox" /> JWT auth for dashboard sessions
            </label>
            <label>
              <input type="checkbox" /> Optional GitHub OAuth integration
            </label>
          </div>
        </Card>

        <Card title="Platform & Persistence">
          <div className="form-grid">
            <label className="form-field">
              Platform
              <input className="input" defaultValue="CLI scanner + React dashboard" type="text" />
            </label>
            <label className="form-field">
              Database
              <input className="input" defaultValue="PostgreSQL" type="text" />
            </label>
            <label className="form-field">
              Stored Data Domains
              <input
                className="input"
                defaultValue="projects, scan history, code elements, doc references, mismatches"
                type="text"
              />
            </label>
          </div>
        </Card>
      </div>
    </section>
  )
}
