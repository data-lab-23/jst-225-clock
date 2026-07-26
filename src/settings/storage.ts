import { DEFAULT_SETTINGS, validateSettings, type ClockSettings } from "./settings";

export const SETTINGS_STORAGE_KEY = "jst-225-clock.settings.v1";

export function loadSettings(storage: Storage): ClockSettings {
  try {
    const serialized = storage.getItem(SETTINGS_STORAGE_KEY);
    return serialized === null ? { ...DEFAULT_SETTINGS } : validateSettings(JSON.parse(serialized));
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(storage: Storage, settings: ClockSettings): void {
  try {
    storage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(validateSettings(settings)));
  } catch {
    // Storage can be unavailable, full, or blocked; settings remain usable in memory.
  }
}
