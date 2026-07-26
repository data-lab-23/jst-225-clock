import { describe, expect, it } from "vitest";

import { DEFAULT_SETTINGS } from "./settings";
import { loadSettings, saveSettings, SETTINGS_STORAGE_KEY } from "./storage";

function createStorage(initialValue: string | null = null): Storage {
  let value = initialValue;

  return {
    get length() {
      return value === null ? 0 : 1;
    },
    clear() { value = null; },
    getItem(key) { return key === SETTINGS_STORAGE_KEY ? value : null; },
    key() { return value === null ? null : SETTINGS_STORAGE_KEY; },
    removeItem() { value = null; },
    setItem(key, nextValue) { if (key === SETTINGS_STORAGE_KEY) value = nextValue; },
  };
}

describe("settings storage", () => {
  it("loads valid JSON through settings validation", () => {
    const storage = createStorage(JSON.stringify({ textScale: 2, accentColor: "#C62F45" }));

    expect(loadSettings(storage)).toEqual({
      ...DEFAULT_SETTINGS,
      textScale: 1.4,
      accentColor: "#c62f45",
    });
  });

  it("returns defaults when stored JSON is malformed", () => {
    expect(loadSettings(createStorage("not json"))).toEqual(DEFAULT_SETTINGS);
  });

  it("returns defaults when local storage cannot be accessed", () => {
    const storage = createStorage();
    storage.getItem = () => { throw new DOMException("Blocked", "SecurityError"); };

    expect(loadSettings(storage)).toEqual(DEFAULT_SETTINGS);
  });

  it("does not throw when local storage cannot save settings", () => {
    const storage = createStorage();
    storage.setItem = () => { throw new DOMException("Full", "QuotaExceededError"); };

    expect(() => saveSettings(storage, DEFAULT_SETTINGS)).not.toThrow();
  });

  it("validates settings before serializing", () => {
    const storage = createStorage();
    let serialized = "";
    storage.setItem = (_key, value) => { serialized = value; };

    saveSettings(storage, { ...DEFAULT_SETTINGS, textScale: 9, panelColor: "blue" });

    expect(JSON.parse(serialized)).toEqual({
      ...DEFAULT_SETTINGS,
      textScale: 1.4,
    });
  });
});
