import { DEFAULT_SETTINGS, validateSettings, type ClockSettings } from "../settings/settings";

const LARGE_TEXT_MINIMUM_CONTRAST = 3;

function channelToLinear(channel: number): number {
  const normalized = channel / 255;
  return normalized <= 0.04045
    ? normalized / 12.92
    : ((normalized + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(color: string): number {
  const red = Number.parseInt(color.slice(1, 3), 16);
  const green = Number.parseInt(color.slice(3, 5), 16);
  const blue = Number.parseInt(color.slice(5, 7), 16);

  return 0.2126 * channelToLinear(red) + 0.7152 * channelToLinear(green) + 0.0722 * channelToLinear(blue);
}

export function contrastRatio(first: string, second: string): number {
  const firstLuminance = relativeLuminance(first);
  const secondLuminance = relativeLuminance(second);
  const lighter = Math.max(firstLuminance, secondLuminance);
  const darker = Math.min(firstLuminance, secondLuminance);

  return (lighter + 0.05) / (darker + 0.05);
}

export function hasMinimumContrast(first: string, second: string, minimum: number): boolean {
  return contrastRatio(first, second) >= minimum;
}

function displayTextColor(settings: ClockSettings): string {
  const isReadableOnPanel = hasMinimumContrast(settings.textColor, settings.panelColor, LARGE_TEXT_MINIMUM_CONTRAST);
  const isReadableOnAccent = hasMinimumContrast(settings.textColor, settings.accentColor, LARGE_TEXT_MINIMUM_CONTRAST);

  return isReadableOnPanel && isReadableOnAccent ? settings.textColor : DEFAULT_SETTINGS.textColor;
}

export function applyTheme(root: HTMLElement, settings: ClockSettings): void {
  const validated = validateSettings(settings);
  const textColor = displayTextColor(validated);

  root.style.setProperty("--text-scale", String(validated.textScale));
  root.style.setProperty("--display-scale", String(validated.displayScale));
  root.style.setProperty("--panel-color", validated.panelColor);
  root.style.setProperty("--accent-color", validated.accentColor);
  root.style.setProperty("--text-color", textColor);
}
