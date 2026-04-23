import { useState } from 'react'
import { updateProfile, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth'
import { auth } from '../firebase'

export function UserSettingsWireframePage() {
  const user = auth.currentUser
  const initials = (user?.displayName ?? user?.email ?? 'U')
    .split(/[\s@]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0].toUpperCase())
    .join('')

  const [displayName, setDisplayName] = useState(user?.displayName ?? '')
  const [editingProfile, setEditingProfile] = useState(false)
  const [profileMsg, setProfileMsg] = useState<string | null>(null)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)
  const [passwordMsg, setPasswordMsg] = useState<string | null>(null)

  const isEmailUser = user?.providerData.some((p) => p.providerId === 'password') ?? false

  async function handleSaveProfile() {
    if (!user) return
    try {
      await updateProfile(user, { displayName })
      setProfileMsg('Profile updated.')
      setEditingProfile(false)
    } catch (err) {
      setProfileMsg(err instanceof Error ? err.message : 'Failed to update profile.')
    }
  }

  async function handleChangePassword() {
    if (!user || !user.email) return
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
      {/* Page head */}
      <div className="page-head">
        <div>
          <div className="kicker">account</div>
          <h1>User Settings</h1>
          <p className="sub">Manage your profile, security, and account preferences.</p>
        </div>
      </div>

      {/* Profile card */}
      <div className="card" style={{ marginBottom: 20, overflow: 'hidden' }}>
        <div className="card-head">
          <h3>Profile</h3>
          {!editingProfile ? (
            <button
              type="button"
              className="btn btn-sm"
              onClick={() => setEditingProfile(true)}
            >
              Edit Profile
            </button>
          ) : null}
        </div>
        <div
          style={{
            padding: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            flexWrap: 'wrap',
          }}
        >
          <div className="sidebar-user-avatar" style={{ width: 52, height: 52, fontSize: 18 }}>
            {user?.photoURL ? (
              <img src={user.photoURL} alt={user?.displayName ?? ''} />
            ) : (
              initials
            )}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            {editingProfile ? (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Display name"
                  className="input"
                  style={{ flex: 1, minWidth: 180 }}
                />
                <button type="button" className="btn btn-accent btn-sm" onClick={handleSaveProfile}>
                  Save
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setEditingProfile(false)}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <>
                <strong style={{ display: 'block', fontSize: 15, color: 'var(--ink)' }}>
                  {user?.displayName ?? user?.email ?? 'User'}
                </strong>
                <small style={{ color: 'var(--ink-3)', fontSize: 13 }}>{user?.email ?? ''}</small>
              </>
            )}
            {profileMsg ? (
              <p
                style={{
                  color: profileMsg.includes('updated') ? 'var(--success)' : 'var(--critical)',
                  fontSize: 12,
                  marginTop: 6,
                }}
              >
                {profileMsg}
              </p>
            ) : null}
          </div>

          <span className="pill pill-accent">
            {user?.providerData[0]?.providerId === 'github.com' ? 'GitHub Auth' : 'Email Auth'}
          </span>
        </div>
      </div>

      {/* Grid: security + account info */}
      <div className="grid-2" style={{ marginBottom: 20 }}>
        {/* Account Security */}
        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="card-head">
            <h3>Account Security</h3>
          </div>
          <div className="kv-list">
            {isEmailUser ? (
              <div className="kv-row" style={{ display: 'block', padding: '16px 18px' }}>
                <strong style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>
                  Change Password
                </strong>
                {changingPassword ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                    <input
                      type="password"
                      placeholder="Current password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="input"
                    />
                    <input
                      type="password"
                      placeholder="New password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="input"
                    />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        type="button"
                        className="btn btn-accent btn-sm"
                        onClick={handleChangePassword}
                      >
                        Update
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => {
                          setChangingPassword(false)
                          setPasswordMsg(null)
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                    {passwordMsg ? (
                      <p
                        style={{
                          color: passwordMsg.includes('updated')
                            ? 'var(--success)'
                            : 'var(--critical)',
                          fontSize: 12,
                        }}
                      >
                        {passwordMsg}
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <p style={{ fontSize: 12, color: 'var(--ink-3)' }}>
                      Update your account password
                    </p>
                    <button
                      type="button"
                      className="btn btn-sm btn-ghost"
                      onClick={() => setChangingPassword(true)}
                    >
                      Change
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="kv-row">
                <div>
                  <strong style={{ display: 'block', fontSize: 13 }}>
                    GitHub Authentication
                  </strong>
                  <small style={{ color: 'var(--ink-3)', fontSize: 12 }}>
                    Your account is secured via GitHub OAuth
                  </small>
                </div>
                <span className="pill pill-success">Active</span>
                <span />
              </div>
            )}
          </div>
        </div>

        {/* Account Info */}
        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="card-head">
            <h3>Account Info</h3>
          </div>
          <div className="kv-list">
            {[
              { label: 'User ID', value: user?.uid ?? 'N/A', mono: true },
              {
                label: 'Sign-in Provider',
                value: user?.providerData[0]?.providerId ?? 'unknown',
                mono: true,
              },
              {
                label: 'Account Created',
                value: user?.metadata.creationTime ?? 'N/A',
                mono: false,
              },
              {
                label: 'Last Sign-in',
                value: user?.metadata.lastSignInTime ?? 'N/A',
                mono: false,
              },
            ].map(({ label, value, mono }) => (
              <div key={label} className="kv-row">
                <span className="k">{label}</span>
                <span className={`v${mono ? ' mono' : ''}`}>{value}</span>
                <span />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="auth-footer">
        <button type="button">Documentation</button>
        <button type="button">Help Center</button>
        <button type="button">Contact Support</button>
      </div>
    </div>
  )
}
