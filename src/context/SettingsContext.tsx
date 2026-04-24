import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export type ThemeSetting = 'light' | 'dark'
export type AccentSetting = 'moss' | 'ink' | 'coral' | 'amber' | 'plum'
export type DensitySetting = 'compact' | 'cozy' | 'comfortable'
export type VizSetting = 'gauge' | 'sparkline' | 'colony'
export type FontSetting = 'instrument' | 'fraunces' | 'source'

export interface Settings {
  theme: ThemeSetting
  accent: AccentSetting
  density: DensitySetting
  viz: VizSetting
  font: FontSetting
}

interface SettingsContextValue {
  settings: Settings
  setTheme: (v: ThemeSetting) => void
  setAccent: (v: AccentSetting) => void
  setDensity: (v: DensitySetting) => void
  setViz: (v: VizSetting) => void
  setFont: (v: FontSetting) => void
}

const ACCENT_PRESETS: Record<AccentSetting, [number, number, number]> = {
  moss:  [130, 0.075, 0.45],
  ink:   [250, 0.06,  0.3 ],
  coral: [25,  0.13,  0.62],
  amber: [75,  0.13,  0.62],
  plum:  [340, 0.09,  0.45],
}

const DENSITY_VALUES: Record<DensitySetting, number> = {
  compact:     2,
  cozy:        6,
  comfortable: 10,
}

const FONT_VALUES: Record<FontSetting, string> = {
  instrument: '"Instrument Serif", Georgia, serif',
  fraunces:   '"Fraunces", Georgia, serif',
  source:     '"Source Serif 4", Georgia, serif',
}

const STORAGE_KEY = 'docrot_settings'

const DEFAULT_SETTINGS: Settings = {
  theme:   'dark',
  accent:  'moss',
  density: 'cozy',
  viz:     'sparkline',
  font:    'source',
}

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_SETTINGS
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<Settings>) }
  } catch {
    return DEFAULT_SETTINGS
  }
}

function applySettings(settings: Settings) {
  const root = document.documentElement
  root.setAttribute('data-theme', settings.theme)

  const [h, c, l] = ACCENT_PRESETS[settings.accent]
  root.style.setProperty('--accent-h', String(h))
  root.style.setProperty('--accent-c', String(c))
  root.style.setProperty('--accent-l', String(l))

  root.style.setProperty('--density', String(DENSITY_VALUES[settings.density]))
  root.style.setProperty('--font-serif', FONT_VALUES[settings.font])
}

const SettingsContext = createContext<SettingsContextValue | null>(null)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(loadSettings)

  useEffect(() => {
    applySettings(settings)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    } catch { /* ignore */ }
  }, [settings])

  const setTheme   = (v: ThemeSetting)   => setSettings((s) => ({ ...s, theme:   v }))
  const setAccent  = (v: AccentSetting)  => setSettings((s) => ({ ...s, accent:  v }))
  const setDensity = (v: DensitySetting) => setSettings((s) => ({ ...s, density: v }))
  const setViz     = (v: VizSetting)     => setSettings((s) => ({ ...s, viz:     v }))
  const setFont    = (v: FontSetting)    => setSettings((s) => ({ ...s, font:    v }))

  return (
    <SettingsContext.Provider value={{ settings, setTheme, setAccent, setDensity, setViz, setFont }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider')
  return ctx
}
