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
    <section className="wf-page wf-settings-page">
      <section className="wf-settings-profile">
        <div className="wf-settings-profile-left">
          <div className="wf-settings-avatar-wrap">
            {user?.photoURL ? (
              <img src={user.photoURL} alt={user?.displayName ?? ''} className="wf-settings-profile-avatar" width="64" height="64" />
            ) : (
              <span className="wf-settings-profile-avatar" aria-hidden="true">
                {initials}
              </span>
            )}
          </div>

          <div>
            {editingProfile ? (
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Display name"
                  style={{ padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid #2a3a5c', background: '#0e1726', color: '#f3f7ff', fontSize: '0.9rem' }}
                />
                <button type="button" className="wf-settings-edit-btn" onClick={handleSaveProfile}>Save</button>
                <button type="button" className="wf-settings-edit-btn" onClick={() => setEditingProfile(false)}>Cancel</button>
              </div>
            ) : (
              <>
                <h3>{user?.displayName ?? user?.email ?? 'User'}</h3>
                <p>{user?.email ?? ''}</p>
              </>
            )}
            {profileMsg ? <p style={{ color: '#19b587', fontSize: '0.8rem', marginTop: '0.3rem' }}>{profileMsg}</p> : null}
            <span className="wf-settings-role-pill">
              {user?.providerData[0]?.providerId === 'github.com' ? 'GITHUB AUTH' : 'EMAIL AUTH'}
            </span>
          </div>
        </div>

        <button type="button" className="wf-settings-edit-btn" onClick={() => setEditingProfile(true)}>
          Edit Profile
        </button>
      </section>

      <div className="wf-settings-grid">
        <section className="wf-settings-panel">
          <h4>Account Security</h4>
          <div className="wf-settings-security-list">
            {isEmailUser ? (
              <div className="wf-settings-security-row">
                <div>
                  <strong>Change Password</strong>
                  {changingPassword ? (
                    <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <input
                        type="password"
                        placeholder="Current password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        style={{ padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid #2a3a5c', background: '#0e1726', color: '#f3f7ff', fontSize: '0.85rem' }}
                      />
                      <input
                        type="password"
                        placeholder="New password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        style={{ padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid #2a3a5c', background: '#0e1726', color: '#f3f7ff', fontSize: '0.85rem' }}
                      />
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button type="button" className="wf-settings-edit-btn" onClick={handleChangePassword}>Update</button>
                        <button type="button" className="wf-settings-edit-btn" onClick={() => { setChangingPassword(false); setPasswordMsg(null) }}>Cancel</button>
                      </div>
                      {passwordMsg ? <p style={{ color: passwordMsg.includes('updated') ? '#19b587' : '#e04c6f', fontSize: '0.8rem' }}>{passwordMsg}</p> : null}
                    </div>
                  ) : (
                    <p>Update your account password</p>
                  )}
                </div>
                {!changingPassword ? (
                  <button type="button" onClick={() => setChangingPassword(true)} style={{ background: 'none', border: 'none', color: '#8ea2c1', cursor: 'pointer', fontSize: '1.2rem' }}>›</button>
                ) : null}
              </div>
            ) : (
              <div className="wf-settings-security-row">
                <div>
                  <strong>GitHub Authentication</strong>
                  <p>Your account is secured via GitHub OAuth</p>
                </div>
                <span className="wf-settings-active-badge">ACTIVE</span>
              </div>
            )}
          </div>
        </section>

        <section className="wf-settings-panel">
          <h4>Account Info</h4>
          <div className="wf-settings-toggle-list">
            <div className="wf-settings-toggle-row">
              <strong>User ID</strong>
              <span style={{ color: '#8ea2c1', fontSize: '0.8rem' }}>{user?.uid ?? 'N/A'}</span>
            </div>
            <div className="wf-settings-toggle-row">
              <strong>Sign-in Provider</strong>
              <span style={{ color: '#8ea2c1', fontSize: '0.8rem' }}>{user?.providerData[0]?.providerId ?? 'unknown'}</span>
            </div>
            <div className="wf-settings-toggle-row">
              <strong>Account Created</strong>
              <span style={{ color: '#8ea2c1', fontSize: '0.8rem' }}>{user?.metadata.creationTime ?? 'N/A'}</span>
            </div>
            <div className="wf-settings-toggle-row">
              <strong>Last Sign-in</strong>
              <span style={{ color: '#8ea2c1', fontSize: '0.8rem' }}>{user?.metadata.lastSignInTime ?? 'N/A'}</span>
            </div>
          </div>
        </section>
      </div>

      <footer className="wf-settings-footer">
        <button type="button">Documentation</button>
        <button type="button">Help Center</button>
        <button type="button">Contact Support</button>
      </footer>
    </section>
  )
}
