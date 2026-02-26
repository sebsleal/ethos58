/**
 * Persistent storage helpers for Ethos85.
 * All data lives in localStorage — works on web and Capacitor iOS.
 */

const KEYS = {
  RECENT_LOGS:   'ethos_recent_logs',
  ACTIVE_BLEND:  'ethos_active_blend',
  SETTINGS:      'ethos_settings',
  THEME:         'theme',
  UNITS:         'ethos_units',
};

const MAX_RECENT_LOGS = 10;

// ─── Recent Logs ─────────────────────────────────────────────────────────────

export function getRecentLogs() {
  try {
    return JSON.parse(localStorage.getItem(KEYS.RECENT_LOGS) || '[]');
  } catch {
    return [];
  }
}

export function saveRecentLog(analysis) {
  const logs = getRecentLogs();
  const entry = {
    id:        Date.now(),
    filename:  analysis.filename,
    date:      new Date().toISOString(),
    status:    analysis.status,
    engine:    analysis.carDetails?.engine  || '—',
    ethanol:   analysis.carDetails?.ethanol ?? '—',
    tune:      analysis.carDetails?.tuneStage || '—',
    afr:       analysis.metrics?.afr?.actual ?? null,
    hpfp:      analysis.metrics?.hpfp?.actual ?? null,
    rowCount:  analysis.row_count ?? null,
  };
  const updated = [entry, ...logs].slice(0, MAX_RECENT_LOGS);
  localStorage.setItem(KEYS.RECENT_LOGS, JSON.stringify(updated));
  return updated;
}

export function clearRecentLogs() {
  localStorage.removeItem(KEYS.RECENT_LOGS);
}

// ─── Active Blend ─────────────────────────────────────────────────────────────

export function getActiveBlend() {
  try {
    return JSON.parse(localStorage.getItem(KEYS.ACTIVE_BLEND) || 'null');
  } catch {
    return null;
  }
}

export function saveActiveBlend(result) {
  const entry = { ...result, date: new Date().toISOString() };
  localStorage.setItem(KEYS.ACTIVE_BLEND, JSON.stringify(entry));
  return entry;
}

export function clearActiveBlend() {
  localStorage.removeItem(KEYS.ACTIVE_BLEND);
}

// ─── Settings ────────────────────────────────────────────────────────────────

const SETTINGS_DEFAULTS = {
  theme:          'system',
  units:          'US',
  compactView:    false,
  downsampling:   'Original (All Data)',
  defaultPreset:  'None (Clear)',
  lineThickness:  'Normal (1.5px)',
  timeFormat:     'Elapsed (Seconds)',
};

export function getSettings() {
  try {
    const stored = JSON.parse(localStorage.getItem(KEYS.SETTINGS) || '{}');
    // Back-compat: pick up legacy keys written directly
    const theme = localStorage.getItem(KEYS.THEME) || stored.theme || SETTINGS_DEFAULTS.theme;
    const units = localStorage.getItem(KEYS.UNITS) || stored.units || SETTINGS_DEFAULTS.units;
    return { ...SETTINGS_DEFAULTS, ...stored, theme, units };
  } catch {
    return { ...SETTINGS_DEFAULTS };
  }
}

export function saveSetting(key, value) {
  const current = getSettings();
  const updated = { ...current, [key]: value };
  localStorage.setItem(KEYS.SETTINGS, JSON.stringify(updated));
  // Keep legacy keys in sync for backward compat
  if (key === 'theme') localStorage.setItem(KEYS.THEME, value);
  if (key === 'units') localStorage.setItem(KEYS.UNITS, value);
}
