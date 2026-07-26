import { describe, expect, it } from "vitest";

import { DEFAULT_SETTINGS } from "../settings/settings";
import { applyTheme, contrastRatio, hasMinimumContrast, relativeLuminance } from "./theme";

describe("applyTheme", () => {
  it("maps the supplied settings to CSS custom properties", () => {
    const root = document.createElement("main");

    applyTheme(root, {
      textScale: 1.2,
      displayScale: 1.1,
      panelColor: "#075ed8",
      accentColor: "#c62f45",
      textColor: "#ffffff",
    });

    expect(root.style.getPropertyValue("--text-scale")).toBe("1.2");
    expect(root.style.getPropertyValue("--display-scale")).toBe("1.1");
    expect(root.style.getPropertyValue("--panel-color")).toBe("#075ed8");
    expect(root.style.getPropertyValue("--accent-color")).toBe("#c62f45");
    expect(root.style.getPropertyValue("--text-color")).toBe("#ffffff");
  });

  it("keeps the approved default display colours at the large-text 3:1 threshold", () => {
    expect(contrastRatio(DEFAULT_SETTINGS.textColor, DEFAULT_SETTINGS.panelColor)).toBeGreaterThanOrEqual(3);
    expect(contrastRatio(DEFAULT_SETTINGS.textColor, DEFAULT_SETTINGS.accentColor)).toBeGreaterThanOrEqual(3);
  });

  it("falls back to the default text colour for a display combination below 3:1", () => {
    const root = document.createElement("main");

    applyTheme(root, {
      ...DEFAULT_SETTINGS,
      panelColor: "#000000",
      accentColor: "#111111",
      textColor: "#222222",
    });

    expect(root.style.getPropertyValue("--text-color")).toBe(DEFAULT_SETTINGS.textColor);
  });
});

describe("contrast helpers", () => {
  it("calculates WCAG relative luminance and contrast ratios", () => {
    expect(relativeLuminance("#000000")).toBe(0);
    expect(relativeLuminance("#ffffff")).toBe(1);
    expect(contrastRatio("#000000", "#ffffff")).toBe(21);
  });

  it("supports the 4.5:1 normal-text threshold needed by settings UI", () => {
    expect(hasMinimumContrast("#000000", "#ffffff", 4.5)).toBe(true);
    expect(hasMinimumContrast("#777777", "#ffffff", 4.5)).toBe(false);
  });
});
