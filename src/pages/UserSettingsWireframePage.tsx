import { useState } from 'react'
import { updateProfile, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth'
import { useAuth } from '../auth/AuthContext'
import { localPreviewMode } from '../firebase'
import { useSettings, type AccentSetting, type FontSetting, type ThemeSetting, type VizSetting } from '../context/SettingsContext'

type SettingsSection = 'profile' | 'appearance' | 'notifications' | 'tokens' | 'billing'

const ACCENT_SWATCHES: { key: AccentSetting; label: string; color: string }[] = [
  { key: 'moss',  label: 'Moss',  color: 'oklch(0.45 0.075 130)' },
  { key: 'ink',   label: 'Ink',   color: 'oklch(0.3 0.06 250)'   },
  { key: 'coral', label: 'Coral', color: 'oklch(0.62 0.13 25)'   },
  { key: 'amber', label: 'Amber', color: 'oklch(0.62 0.13 75)'   },
  { key: 'plum',  label: 'Plum',  color: 'oklch(0.45 0.09 340)'  },
]

type NotifKey = 'critical' | 'digest' | 'failures' | 'aiReady'
type NotifState = Record<NotifKey, { on: boolean; channels: string[] }>

const NAV_ITEMS: { key: SettingsSection; label: string }[] = [
  { key: 'profile',       label: 'Profile'       },
  { key: 'appearance',    label: 'Appearance'    },
  { key: 'notifications', label: 'Notifications' },
  { key: 'tokens',        label: 'API tokens'    },
  { key: 'billing',       label: 'Billing'       },
]

export function UserSettingsWireframePage() {
  const { user } = useAuth()
  const { settings, setTheme, setAccent, setViz, setFont } = useSettings()

  const initials = (user?.displayName ?? user?.email ?? 'U')
    .split(/[\s@]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0].toUpperCase())
    .join('')

  const [section, setSection] = useState<SettingsSection>('profile')

  const [displayName, setDisplayName] = useState(user?.displayName ?? '')
  const [profileMsg, setProfileMsg] = useState<string | null>(null)
  const [savingProfile, setSavingProfile] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)
  const [passwordMsg, setPasswordMsg] = useState<string | null>(null)

  const [notifState, setNotifState] = useState<NotifState>({
    critical: { on: true,  channels: ['email']           },
    digest:   { on: true,  channels: ['email', 'github'] },
    failures: { on: false, channels: []                  },
    aiReady:  { on: false, channels: []                  },
  })

  const isEmailUser = user?.providerData.some((p) => p.providerId === 'password') ?? false

  function toggleNotif(key: NotifKey) {
    setNotifState((s) => ({ ...s, [key]: { ...s[key], on: !s[key].on } }))
  }
  function toggleChannel(key: NotifKey, ch: string) {
    setNotifState((s) => {
      const chans = s[key].channels.includes(ch)
        ? s[key].channels.filter((c) => c !== ch)
        : [...s[key].channels, ch]
      return { ...s, [key]: { ...s[key], channels: chans } }
    })
  }

  async function handleSaveProfile() {
    if (!user) return
    if (localPreviewMode) {
      setProfileMsg('Profile editing is disabled in local preview mode.')
      return
    }
    setSavingProfile(true)
    try {
      await updateProfile(user, { displayName })
      setProfileMsg('Profile updated.')
    } catch (err) {
      setProfileMsg(err instanceof Error ? err.message : 'Failed to update profile.')
    } finally {
      setSavingProfile(false)
    }
  }

  async function handleChangePassword() {
    if (!user || !user.email) return
    if (localPreviewMode) {
      setPasswordMsg('Password changes are disabled in local preview mode.')
      return
    }
    setPasswordMsg(null)
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword)
      await reauthenticateWithCredential(user, credential)
      await updatePassword(user, newPassword)
      setPasswordMsg('Password updated.')
      setCurrentPassword('')
      setNewPassword('')
      setChangingPassword(false)
    } catch (err) {
      setPasswordMsg(err instanceof Error ? err.message : 'Failed to change password.')
    }
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="kicker">Account</div>
          <h1>Settings</h1>
          <p className="sub">
            Your personal preferences. Workspace-wide config lives on the{' '}
            <span style={{ color: 'var(--accent-ink)', borderBottom: '1px dashed currentColor', cursor: 'pointer' }}>
              Configuration
            </span>{' '}
            page.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 24 }}>
        {/* Sidebar nav */}
        <div>
          {/* User card */}
          <div className="card card-pad" style={{ marginBottom: 12, textAlign: 'center' }}>
            <div
              className="sidebar-user-avatar"
              style={{
                width: 52, height: 52,
                margin: '0 auto 10px',
                fontSize: 22,
                background: 'linear-gradient(135deg, oklch(0.65 0.12 var(--accent-h)), oklch(0.48 0.14 calc(var(--accent-h) + 40)))',
              }}
            >
              {user?.photoURL ? (
                <img src={user.photoURL} alt={user.displayName ?? ''} />
              ) : (
                initials
              )}
            </div>
            <div style={{ fontWeight: 500, fontSize: 14 }}>{user?.displayName ?? user?.email ?? 'User'}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>
              {user?.email ?? ''}
            </div>
            <span className="pill" style={{ marginTop: 8, fontSize: 10, display: 'inline-block' }}>
              {localPreviewMode ? 'Local preview' : user?.providerData[0]?.providerId === 'github.com' ? 'GitHub Auth' : 'Email Auth'}
            </span>
          </div>

          <div className="settings-nav">
            {NAV_ITEMS.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                className={`settings-nav-item${section === key ? ' active' : ''}`}
                onClick={() => setSection(key)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* ── Profile ── */}
          {section === 'profile' && (
            <>
              <div className="card">
                <div className="card-head">
                  <h3>Profile</h3>
                  <button
                    type="button"
                    className="btn btn-sm btn-accent"
                    onClick={handleSaveProfile}
                    disabled={savingProfile}
                  >
                    {savingProfile ? 'Saving…' : 'Save profile'}
                  </button>
                </div>
                <div className="kv-list">
                  <div className="kv-row">
                    <span className="k">Display name</span>
                    <input
                      className="input"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Your name"
                    />
                    <span />
                  </div>
                  <div className="kv-row">
                    <span className="k">Email</span>
                    <input
                      className="input"
                      defaultValue={user?.email ?? ''}
                      readOnly
                      style={{ color: 'var(--ink-3)', cursor: 'not-allowed' }}
                    />
                    <span />
                  </div>
                  <div className="kv-row">
                    <span className="k">GitHub</span>
                    <span className="v" style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                      <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 14, height: 14 }}>
                        <path d="M12 .7a11.3 11.3 0 0 0-3.58 22c.57.1.78-.25.78-.55v-2.15c-3.19.7-3.87-1.36-3.87-1.36-.52-1.32-1.27-1.66-1.27-1.66-1.03-.7.08-.69.08-.69 1.15.08 1.74 1.17 1.74 1.17 1 .17 2.13.73 2.66 1.96.89 1.52 2.34 1.08 2.91.82.09-.72.35-1.21.63-1.49-2.55-.29-5.22-1.28-5.22-5.7 0-1.26.45-2.28 1.17-3.08-.12-.28-.51-1.44.11-2.99 0 0 .96-.31 3.14 1.17a10.8 10.8 0 0 1 5.72 0c2.18-1.48 3.13-1.17 3.13-1.17.63 1.55.24 2.71.12 2.99.73.8 1.17 1.82 1.17 3.08 0 4.43-2.68 5.4-5.24 5.69.42.36.78 1.05.78 2.14v3.17c0 .31.2.66.79.55A11.3 11.3 0 0 0 12 .7Z" />
                      </svg>
                      {user?.providerData.find((p) => p.providerId === 'github.com')?.displayName ?? '—'}
                    </span>
                    <span className={`pill${user?.providerData.some((p) => p.providerId === 'github.com') ? ' pill-success' : ''}`}>
                      {user?.providerData.some((p) => p.providerId === 'github.com') ? 'linked' : 'not linked'}
                    </span>
                  </div>
                  <div className="kv-row">
                    <span className="k">Timezone</span>
                    <select className="select">
                      <option>America/Chicago (UTC−05:00)</option>
                      <option>America/New_York (UTC−04:00)</option>
                      <option>UTC</option>
                      <option>Europe/London (UTC+01:00)</option>
                    </select>
                    <span />
                  </div>
                  <div className="kv-row">
                    <span className="k">Account created</span>
                    <span className="v" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                      {user?.metadata.creationTime ?? '—'}
                    </span>
                    <span />
                  </div>
                  <div className="kv-row">
                    <span className="k">Last sign-in</span>
                    <span className="v" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                      {user?.metadata.lastSignInTime ?? '—'}
                    </span>
                    <span />
                  </div>
                </div>
                {profileMsg ? (
                  <div style={{ padding: '10px 18px', borderTop: '1px solid var(--border)', fontSize: 12, color: profileMsg.includes('updated') ? 'var(--success)' : 'var(--critical)' }}>
                    {profileMsg}
                  </div>
                ) : null}
              </div>

              {/* Security */}
              <div className="card">
                <div className="card-head"><h3>Security</h3></div>
                <div className="kv-list">
                  {localPreviewMode ? (
                    <div className="kv-row" style={{ display: 'block', padding: '14px 18px' }}>
                      <strong style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>Local preview mode</strong>
                      <p style={{ fontSize: 12, color: 'var(--ink-3)', margin: 0 }}>
                        Firebase profile actions are disabled while the branch runs without env vars.
                      </p>
                    </div>
                  ) : isEmailUser ? (
                    <div className="kv-row" style={{ display: 'block', padding: '14px 18px' }}>
                      <strong style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>Change password</strong>
                      {changingPassword ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                          <input type="password" placeholder="Current password" value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)} className="input" />
                          <input type="password" placeholder="New password" value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)} className="input" />
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button type="button" className="btn btn-accent btn-sm" onClick={handleChangePassword}>Update</button>
                            <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setChangingPassword(false); setPasswordMsg(null) }}>Cancel</button>
                          </div>
                          {passwordMsg ? (
                            <p style={{ fontSize: 12, color: passwordMsg.includes('updated') ? 'var(--success)' : 'var(--critical)' }}>{passwordMsg}</p>
                          ) : null}
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <p style={{ fontSize: 12, color: 'var(--ink-3)' }}>Update your account password</p>
                          <button type="button" className="btn btn-sm btn-ghost" onClick={() => setChangingPassword(true)}>Change</button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="kv-row">
                      <div>
                        <strong style={{ display: 'block', fontSize: 13 }}>GitHub OAuth</strong>
                        <small style={{ color: 'var(--ink-3)', fontSize: 12 }}>Your account is secured via GitHub</small>
                      </div>
                      <span className="pill pill-success">Active</span>
                      <span />
                    </div>
                  )}
                  <div className="kv-row">
                    <span className="k">User ID</span>
                    <span className="v" style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5 }}>{user?.uid ?? '—'}</span>
                    <span />
                  </div>
                  <div className="kv-row">
                    <span className="k">Sign-in provider</span>
                    <span className="v" style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5 }}>{user?.providerData[0]?.providerId ?? '—'}</span>
                    <span />
                  </div>
                </div>
              </div>

              {/* Danger zone */}
              <div className="card">
                <div className="card-head">
                  <h3 style={{ color: 'var(--critical)' }}>Danger zone</h3>
                </div>
                <div className="kv-list">
                  <div className="kv-row">
                    <span className="k">Delete account</span>
                    <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>Permanently remove your account and all workspace data.</span>
                    <button
                      type="button"
                      className="btn btn-sm"
                      style={{ borderColor: 'color-mix(in oklab, var(--critical) 40%, transparent)', color: 'var(--critical)', flexShrink: 0 }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── Appearance ── */}
          {section === 'appearance' && (
            <div className="card card-pad">
              <div className="kicker">Design</div>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 400, margin: '4px 0 20px' }}>Make it yours</h3>

              <div className="tweak-group" style={{ paddingTop: 0 }}>
                <label>Theme</label>
                <div className="tweak-row">
                  {(['light', 'dark'] as ThemeSetting[]).map((v) => (
                    <button
                      key={v}
                      type="button"
                      className={`tweak-chip${settings.theme === v ? ' active' : ''}`}
                      onClick={() => setTheme(v)}
                    >
                      {v === 'light' ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: 12, height: 12, display: 'inline', verticalAlign: 'middle', marginRight: 4 }}>
                          <circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: 12, height: 12, display: 'inline', verticalAlign: 'middle', marginRight: 4 }}>
                          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                        </svg>
                      )}
                      {v.charAt(0).toUpperCase() + v.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="tweak-group">
                <label>Accent color</label>
                <div className="tweak-row" style={{ alignItems: 'center', gap: 10 }}>
                  {ACCENT_SWATCHES.map(({ key, label, color }) => (
                    <div key={key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                      <button
                        type="button"
                        className={`tweak-swatch${settings.accent === key ? ' active' : ''}`}
                        style={{ background: color, width: 32, height: 32 }}
                        onClick={() => setAccent(key as AccentSetting)}
                        title={label}
                      />
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="tweak-group">
                <label>Rot score visualization</label>
                <div className="tweak-row">
                  {([
                    { k: 'gauge'     as VizSetting, label: 'Ring gauge'   },
                    { k: 'sparkline' as VizSetting, label: 'Sparkline'    },
                    { k: 'colony'    as VizSetting, label: 'Mold colony'  },
                  ]).map(({ k, label }) => (
                    <button
                      key={k}
                      type="button"
                      className={`tweak-chip${settings.viz === k ? ' active' : ''}`}
                      onClick={() => setViz(k)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="tweak-group" style={{ borderBottom: 0 }}>
                <label>Headline typeface</label>
                <div className="tweak-row">
                  {([
                    { k: 'instrument' as FontSetting, family: '"Instrument Serif", serif', label: 'Instrument' },
                    { k: 'fraunces'   as FontSetting, family: '"Fraunces", serif',          label: 'Fraunces'   },
                    { k: 'source'     as FontSetting, family: '"Source Serif 4", serif',    label: 'Source'     },
                  ]).map(({ k, family, label }) => (
                    <button
                      key={k}
                      type="button"
                      className={`tweak-chip${settings.font === k ? ' active' : ''}`}
                      onClick={() => setFont(k)}
                    >
                      <span style={{ fontFamily: family, fontStyle: 'italic', fontSize: 14 }}>{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Notifications ── */}
          {section === 'notifications' && (
            <div className="card">
              <div className="card-head">
                <h3>Notifications</h3>
                <span className="hint">email · GitHub</span>
              </div>
              <div className="kv-list">
                {([
                  { key: 'critical' as NotifKey, label: 'Critical mismatches', desc: 'When a critical-severity issue is found in a scan'     },
                  { key: 'digest'   as NotifKey, label: 'Weekly digest',        desc: 'Roll-up of rot trends, sent every Monday morning'     },
                  { key: 'failures' as NotifKey, label: 'Scan failures',        desc: 'When a scan errors out before completing'             },
                  { key: 'aiReady'  as NotifKey, label: 'AI suggestion ready',  desc: 'When an AI-drafted fix is ready to review and apply'  },
                ]).map(({ key, label, desc }) => {
                  const ns = notifState[key]
                  return (
                    <div key={key} className="kv-row" style={{ alignItems: 'start', paddingTop: 14, paddingBottom: 14 }}>
                      <span className="k" style={{ paddingTop: 2 }}>{label}</span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>{desc}</span>
                        {ns.on && (
                          <div style={{ display: 'flex', gap: 6 }}>
                            {([['email', 'Email'], ['github', 'GitHub Issue']] as const).map(([ch, chLabel]) => (
                              <button
                                key={ch}
                                type="button"
                                className={`tweak-chip${ns.channels.includes(ch) ? ' active' : ''}`}
                                style={{ padding: '3px 8px', fontSize: 11 }}
                                onClick={() => toggleChannel(key, ch)}
                              >
                                {chLabel}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        className={`toggle${ns.on ? ' on' : ''}`}
                        onClick={() => toggleNotif(key)}
                        aria-label={`Toggle ${label}`}
                      />
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── API Tokens ── */}
          {section === 'tokens' && (
            <div className="card card-pad">
              <div className="kicker">CLI / CI</div>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 400, margin: '4px 0 6px' }}>API tokens</h3>
              <p style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 16, lineHeight: 1.55 }}>
                Use these to authenticate the Docrot CLI or run scans in CI. Tokens inherit your repo permissions.
              </p>
              <div className="card" style={{ background: 'var(--bg-sunken)', overflow: 'hidden' }}>
                {[
                  { name: 'ci-runner', token: 'drx_live_9f3…a21', scopes: ['scan', 'read'],          created: '2026-02-01', last: '4m ago' },
                  { name: 'local-cli', token: 'drx_live_0a2…4c1', scopes: ['scan', 'read', 'write'], created: '2026-01-14', last: '2d ago' },
                ].map((tok, i, arr) => (
                  <div key={tok.name} style={{ padding: '14px 18px', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div>
                        <strong style={{ fontSize: 13 }}>{tok.name}</strong>
                        <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                          {tok.scopes.map((s) => (
                            <span key={s} className="pill" style={{ fontSize: 10 }}>{s}</span>
                          ))}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button type="button" className="btn btn-sm">Copy</button>
                        <button type="button" className="btn btn-sm btn-ghost" style={{ color: 'var(--critical)' }}>Revoke</button>
                      </div>
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-2)', background: 'var(--bg)', padding: '6px 10px', borderRadius: 'var(--r-xs)', border: '1px solid var(--border)', letterSpacing: '0.05em' }}>
                      {tok.token}
                    </div>
                    <div style={{ display: 'flex', gap: 16, marginTop: 8, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-4)' }}>
                      <span>Created {tok.created}</span>
                      <span>Last used {tok.last}</span>
                    </div>
                  </div>
                ))}
              </div>
              <button type="button" className="btn btn-accent" style={{ marginTop: 14 }}>
                + Generate new token
              </button>
            </div>
          )}

          {/* ── Billing ── */}
          {section === 'billing' && (
            <div className="card card-pad">
              <div className="kicker">Plan</div>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 400, margin: '4px 0 4px' }}>Team · $49/mo</h3>
              <p style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 20 }}>
                Next invoice <strong style={{ color: 'var(--ink)' }}>May 1, 2026</strong> · Billed annually
              </p>

              <div style={{ display: 'grid', gap: 14, marginBottom: 20 }}>
                {[
                  { label: 'Repos watched',      used: 8,    limit: null,  unit: 'repos', note: 'unlimited'   },
                  { label: 'AI calls this cycle', used: 1847, limit: 10000, unit: 'calls', note: '10,000 / cycle' },
                  { label: 'Scan minutes',        used: 324,  limit: null,  unit: 'min',   note: 'unlimited'   },
                ].map(({ label, used, limit, unit, note }) => (
                  <div key={label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-3)' }}>{label}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-2)' }}>
                        <strong>{used.toLocaleString()}</strong> {unit} {limit ? `/ ${limit.toLocaleString()}` : `· ${note}`}
                      </span>
                    </div>
                    {limit ? (
                      <div style={{ height: 5, background: 'var(--border)', borderRadius: 99, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          width: `${(used / limit) * 100}%`,
                          background: (used / limit) > 0.8 ? 'var(--warning)' : 'var(--accent)',
                          borderRadius: 99,
                          transition: 'width 0.6s ease',
                        }} />
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" className="btn">Manage billing</button>
                <button type="button" className="btn btn-accent">+ Upgrade plan</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
