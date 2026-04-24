import { useSettings, type AccentSetting, type DensitySetting, type FontSetting, type ThemeSetting, type VizSetting } from '../context/SettingsContext'

interface TweaksPanelProps {
  open: boolean
  onClose: () => void
}

const ACCENT_COLORS: Record<AccentSetting, string> = {
  moss:  'oklch(0.45 0.075 130)',
  ink:   'oklch(0.3 0.06 250)',
  coral: 'oklch(0.62 0.13 25)',
  amber: 'oklch(0.62 0.13 75)',
  plum:  'oklch(0.45 0.09 340)',
}

export function TweaksPanel({ open, onClose }: TweaksPanelProps) {
  const { settings, setTheme, setAccent, setDensity, setViz, setFont } = useSettings()

  if (!open) return null

  return (
    <>
      <div className="tweaks-overlay" onClick={onClose} />
      <div className="tweaks-panel" role="dialog" aria-label="Visual settings">
        <div className="tweaks-header">
          <span className="tweaks-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: 14, height: 14 }}>
              <path d="M21 6H9M5 6H3"/><path d="M21 12h-8M9 12H3"/><path d="M21 18H15M11 18H3"/>
              <circle cx="7" cy="6" r="2"/><circle cx="11" cy="12" r="2"/><circle cx="13" cy="18" r="2"/>
            </svg>
            Tweaks
          </span>
          <button type="button" className="tweaks-close" onClick={onClose} aria-label="Close tweaks">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14 }}>
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Theme */}
        <div className="tweaks-section">
          <div className="tweaks-section-label">Theme</div>
          <div className="tweaks-btn-row">
            {(['light', 'dark'] as ThemeSetting[]).map((v) => (
              <button
                key={v}
                type="button"
                className={`tweaks-btn${settings.theme === v ? ' active' : ''}`}
                onClick={() => setTheme(v)}
              >
                {v === 'light' ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: 13, height: 13 }}>
                    <circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: 13, height: 13 }}>
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                  </svg>
                )}
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Accent */}
        <div className="tweaks-section">
          <div className="tweaks-section-label">Accent</div>
          <div className="tweaks-swatch-row">
            {(Object.keys(ACCENT_COLORS) as AccentSetting[]).map((v) => (
              <button
                key={v}
                type="button"
                className={`tweaks-swatch${settings.accent === v ? ' active' : ''}`}
                style={{ background: ACCENT_COLORS[v] }}
                onClick={() => setAccent(v)}
                aria-label={v}
                title={v}
              />
            ))}
          </div>
        </div>

        {/* Density */}
        <div className="tweaks-section">
          <div className="tweaks-section-label">Density</div>
          <div className="tweaks-btn-row">
            {(['compact', 'cozy', 'comfortable'] as DensitySetting[]).map((v) => (
              <button
                key={v}
                type="button"
                className={`tweaks-btn${settings.density === v ? ' active' : ''}`}
                onClick={() => setDensity(v)}
              >
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Rot Score Viz */}
        <div className="tweaks-section">
          <div className="tweaks-section-label">Rot Score Viz</div>
          <div className="tweaks-btn-row">
            {([
              { v: 'gauge' as VizSetting, label: 'Gauge' },
              { v: 'sparkline' as VizSetting, label: 'Sparkline' },
              { v: 'colony' as VizSetting, label: 'Colony' },
            ]).map(({ v, label }) => (
              <button
                key={v}
                type="button"
                className={`tweaks-btn${settings.viz === v ? ' active' : ''}`}
                onClick={() => setViz(v)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Serif font */}
        <div className="tweaks-section">
          <div className="tweaks-section-label">Serif for headings</div>
          <div className="tweaks-btn-row">
            {([
              { v: 'instrument' as FontSetting, label: 'Instrument' },
              { v: 'fraunces' as FontSetting, label: 'Fraunces' },
              { v: 'source' as FontSetting, label: 'Source' },
            ]).map(({ v, label }) => (
              <button
                key={v}
                type="button"
                className={`tweaks-btn${settings.font === v ? ' active' : ''}`}
                onClick={() => setFont(v)}
                style={{ fontFamily: v === 'instrument' ? '"Instrument Serif", serif' : v === 'fraunces' ? '"Fraunces", serif' : '"Source Serif 4", serif' }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
