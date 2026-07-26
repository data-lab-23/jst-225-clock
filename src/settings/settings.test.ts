import { describe, expect, it } from "vitest";

import { DEFAULT_SETTINGS, validateSettings } from "./settings";

describe("validateSettings", () => {
  it("provides the specified defaults", () => {
    expect(DEFAULT_SETTINGS).toEqual({
      textScale: 1,
      displayScale: 1,
      panelColor: "#0669f5",
      accentColor: "#ed354e",
      textColor: "#f7ffff",
    });
  });

  it("clamps independently supplied scales to the supported range", () => {
    expect(validateSettings({ textScale: 0.4, displayScale: 2 })).toMatchObject({
      textScale: 0.8,
      displayScale: 1.4,
    });
  });

  it("accepts six-digit hex colours and normalizes them to lowercase", () => {
    expect(
      validateSettings({
        panelColor: "#ABCDEF",
        accentColor: "#1A2B3C",
        textColor: "#F7FFFF",
      }),
    ).toMatchObject({
      panelColor: "#abcdef",
      accentColor: "#1a2b3c",
      textColor: "#f7ffff",
    });
  });

  it("merges a valid partial object with defaults", () => {
    expect(validateSettings({ textScale: 1.2, panelColor: "#075ed8" })).toEqual({
      ...DEFAULT_SETTINGS,
      textScale: 1.2,
      panelColor: "#075ed8",
    });
  });

  it("falls back for invalid fields without discarding valid fields", () => {
    expect(
      validateSettings({
        textScale: Number.NaN,
        displayScale: 1.1,
        panelColor: "blue",
        accentColor: "#C62F45",
        textColor: "#fff",
      }),
    ).toEqual({
      textScale: DEFAULT_SETTINGS.textScale,
      displayScale: 1.1,
      panelColor: DEFAULT_SETTINGS.panelColor,
      accentColor: "#c62f45",
      textColor: DEFAULT_SETTINGS.textColor,
    });
  });
});
