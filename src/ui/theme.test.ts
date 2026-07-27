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
    expect(root.style.getPropertyValue("--panel-foreground")).toBe("#ffffff");
    expect(root.style.getPropertyValue("--accent-foreground")).toBe("#ffffff");
  });

  it("keeps the approved default display colours at the large-text 3:1 threshold", () => {
    expect(contrastRatio(DEFAULT_SETTINGS.textColor, DEFAULT_SETTINGS.panelColor)).toBeGreaterThanOrEqual(3);
    expect(contrastRatio(DEFAULT_SETTINGS.textColor, DEFAULT_SETTINGS.accentColor)).toBeGreaterThanOrEqual(3);
  });

  it("chooses white when it has the strongest minimum contrast across dark display backgrounds", () => {
    const root = document.createElement("main");

    applyTheme(root, {
      ...DEFAULT_SETTINGS,
      panelColor: "#000000",
      accentColor: "#111111",
      textColor: "#222222",
    });

    expect(root.style.getPropertyValue("--text-color")).toBe("#222222");
    expect(root.style.getPropertyValue("--panel-foreground")).toBe("#ffffff");
    expect(root.style.getPropertyValue("--accent-foreground")).toBe("#ffffff");
  });

  it("chooses black for light display backgrounds when the selected text fails 3:1", () => {
    const root = document.createElement("main");

    applyTheme(root, {
      ...DEFAULT_SETTINGS,
      panelColor: "#ffffff",
      accentColor: "#eeeeee",
      textColor: "#f7ffff",
    });

    expect(root.style.getPropertyValue("--text-color")).toBe("#f7ffff");
    expect(root.style.getPropertyValue("--panel-foreground")).toBe("#000000");
    expect(root.style.getPropertyValue("--accent-foreground")).toBe("#000000");
    expect(contrastRatio("#000000", "#ffffff")).toBeGreaterThanOrEqual(3);
    expect(contrastRatio("#000000", "#eeeeee")).toBeGreaterThanOrEqual(3);
  });

  it("derives readable foregrounds independently for opposite panel and accent surfaces", () => {
    const root = document.createElement("main");

    applyTheme(root, {
      ...DEFAULT_SETTINGS,
      panelColor: "#000000",
      accentColor: "#ffffff",
      textColor: "#ffffff",
    });

    const panelForeground = root.style.getPropertyValue("--panel-foreground");
    const accentForeground = root.style.getPropertyValue("--accent-foreground");

    expect(root.style.getPropertyValue("--text-color")).toBe("#ffffff");
    expect(panelForeground).toBe("#ffffff");
    expect(accentForeground).toBe("#000000");
    expect(contrastRatio(panelForeground, "#000000")).toBeGreaterThanOrEqual(3);
    expect(contrastRatio(accentForeground, "#ffffff")).toBeGreaterThanOrEqual(3);
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
