export interface ClockSettings {
  textScale: number;
  displayScale: number;
  panelColor: string;
  accentColor: string;
  textColor: string;
}

export const DEFAULT_SETTINGS: ClockSettings = {
  textScale: 1,
  displayScale: 1,
  panelColor: "#0669f5",
  accentColor: "#ed354e",
  textColor: "#f7ffff",
};

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

function clampScale(value: unknown, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;

  return Math.min(1.4, Math.max(0.8, value));
}

function normalizeColor(value: unknown, fallback: string): string {
  if (typeof value !== "string" || !HEX_COLOR.test(value)) return fallback;

  return value.toLowerCase();
}

export function validateSettings(value: unknown): ClockSettings {
  const candidate = value !== null && typeof value === "object" ? value as Partial<ClockSettings> : {};

  return {
    textScale: clampScale(candidate.textScale, DEFAULT_SETTINGS.textScale),
    displayScale: clampScale(candidate.displayScale, DEFAULT_SETTINGS.displayScale),
    panelColor: normalizeColor(candidate.panelColor, DEFAULT_SETTINGS.panelColor),
    accentColor: normalizeColor(candidate.accentColor, DEFAULT_SETTINGS.accentColor),
    textColor: normalizeColor(candidate.textColor, DEFAULT_SETTINGS.textColor),
  };
}
