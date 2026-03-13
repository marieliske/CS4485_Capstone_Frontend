type LoginWireframePageProps = {
  onSignIn?: () => void
}

export function LoginWireframePage({ onSignIn }: LoginWireframePageProps) {
  return (
    <section className="wf-page wf-login-page wf-login-page-standalone">
      <div className="wf-login-main">
        <article className="wf-login-card">
          <div className="wf-login-card-top">
            <span className="wf-login-shield" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M12 3.8 18 5.9v5.4c0 4-2.4 6.9-6 8.5-3.6-1.6-6-4.5-6-8.5V5.9z" />
                <path d="M12 8.3v5" />
                <path d="M9.5 11h5" />
              </svg>
            </span>
          </div>

          <div className="wf-login-card-body">
            <h2>Welcome Back</h2>
            <p>Manage your technical documentation integrity</p>

            <button type="button" className="wf-login-github">
              <span aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 .7a11.3 11.3 0 0 0-3.58 22c.57.1.78-.25.78-.55v-2.15c-3.19.7-3.87-1.36-3.87-1.36-.52-1.32-1.27-1.66-1.27-1.66-1.03-.7.08-.69.08-.69 1.15.08 1.74 1.17 1.74 1.17 1 .17 2.13.73 2.66 1.96.89 1.52 2.34 1.08 2.91.82.09-.72.35-1.21.63-1.49-2.55-.29-5.22-1.28-5.22-5.7 0-1.26.45-2.28 1.17-3.08-.12-.28-.51-1.44.11-2.99 0 0 .96-.31 3.14 1.17a10.8 10.8 0 0 1 5.72 0c2.18-1.48 3.13-1.17 3.13-1.17.63 1.55.24 2.71.12 2.99.73.8 1.17 1.82 1.17 3.08 0 4.43-2.68 5.4-5.24 5.69.42.36.78 1.05.78 2.14v3.17c0 .31.2.66.79.55A11.3 11.3 0 0 0 12 .7Z" />
                </svg>
              </span>
              Continue with GitHub
            </button>

            <div className="wf-login-divider">
              <span>OR CONTINUE WITH EMAIL</span>
            </div>

            <label className="wf-login-field">
              <span>Email Address</span>
              <input type="email" placeholder="name@company.com" />
            </label>

            <label className="wf-login-field">
              <span className="wf-login-field-row">
                <span>Password</span>
                <button type="button">Forgot password?</button>
              </span>
              <input type="password" placeholder="........" />
            </label>

            <button type="button" className="wf-login-submit" onClick={onSignIn}>
              <span>Sign In</span>
              <span aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M5 12h14" />
                  <path d="m13 7 6 5-6 5" />
                </svg>
              </span>
            </button>

            <p className="wf-login-secondary">
              Don&apos;t have an account? <button type="button">Start free trial</button>
            </p>
          </div>
        </article>

        <footer className="wf-login-footer">
          <button type="button">Privacy Policy</button>
          <button type="button">Terms of Service</button>
          <button type="button">Help Center</button>
        </footer>
      </div>
    </section>
  )
}
