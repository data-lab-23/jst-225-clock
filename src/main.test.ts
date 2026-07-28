import { beforeEach, describe, expect, it, vi } from "vitest";

import { createApp } from "./main";
import type { ClockSettings } from "./settings/settings";
import { SETTINGS_STORAGE_KEY } from "./settings/storage";
import type { TimeZoneInfo } from "./time-zone/timeZone";

const TOKYO_ZONE: TimeZoneInfo = {
  id: "Asia/Tokyo",
  abbreviation: "JST",
  titleJa: "日本標準時",
  titleEn: "Japan Standard Time 225",
};

const OSAKA_ZONE: TimeZoneInfo = {
  id: "Asia/Osaka",
  abbreviation: "JOT",
  titleJa: "大阪標準時",
  titleEn: "Osaka Standard Time 225",
};

const SAVED_SETTINGS: ClockSettings = {
  textScale: 1.2,
  displayScale: 1.15,
  panelColor: "#123456",
  accentColor: "#abcdef",
  textColor: "#ffffff",
};

function clockFixture(): HTMLElement {
  const root = document.createElement("main");
  root.id = "app";
  root.setAttribute("aria-busy", "true");
  root.innerHTML = `
    <header>
      <span data-clock-field="title-ja"></span>
      <span data-clock-field="title-en"></span>
      <button id="settings-trigger" type="button">設定</button>
    </header>
    <section class="clock-board">
      <span data-clock-field="time"></span>
      <span class="primary-value-ghost" aria-hidden="true"></span>
      <span data-clock-field="date"></span>
      <span data-clock-field="weekday"></span>
      <span data-clock-field="seconds"></span>
      <span data-clock-field="zone"></span>
    </section>
    <p role="status"></p>
    <dialog id="settings-dialog" hidden>
      <label for="settings-text-scale">文字サイズ</label>
      <input id="settings-text-scale" type="range" min="0.8" max="1.4" step="0.05" />
      <label for="settings-display-scale">表示サイズ</label>
      <input id="settings-display-scale" type="range" min="0.8" max="1.4" step="0.05" />
      <label for="settings-panel-color">パネル色</label>
      <input id="settings-panel-color" type="color" />
      <label for="settings-accent-color">アクセント色</label>
      <input id="settings-accent-color" type="color" />
      <label for="settings-text-color">文字色</label>
      <input id="settings-text-color" type="color" />
      <button id="settings-fullscreen" type="button">全画面</button>
      <button id="settings-reset" type="button">リセット</button>
      <button id="settings-close" type="button">閉じる</button>
    </dialog>
  `;
  document.body.replaceChildren(root);
  return root;
}

function field(root: HTMLElement, name: string): HTMLElement {
  const element = root.querySelector<HTMLElement>(`[data-clock-field="${name}"]`);
  if (!element) throw new Error(`Missing test fixture field: ${name}`);
  return element;
}

function control<T extends HTMLElement>(root: HTMLElement, id: string): T {
  const element = root.querySelector<T>(`#${id}`);
  if (!element) throw new Error(`Missing test fixture control: ${id}`);
  return element;
}

function memoryStorage(settings: ClockSettings = SAVED_SETTINGS) {
  let value: string | null = JSON.stringify(settings);

  const storage: Storage = {
    get length() {
      return value === null ? 0 : 1;
    },
    clear() {
      value = null;
    },
    getItem(key) {
      return key === SETTINGS_STORAGE_KEY ? value : null;
    },
    key(index) {
      return index === 0 && value !== null ? SETTINGS_STORAGE_KEY : null;
    },
    removeItem(key) {
      if (key === SETTINGS_STORAGE_KEY) value = null;
    },
    setItem(key, nextValue) {
      if (key === SETTINGS_STORAGE_KEY) value = nextValue;
    },
  };

  return {
    storage,
    savedSettings: () => value === null ? null : JSON.parse(value) as ClockSettings,
  };
}

function setup(options: {
  initialDate?: Date;
  resolveZone?: (date: Date) => TimeZoneInfo;
} = {}) {
  const root = clockFixture();
  const persisted = memoryStorage();
  let currentDate = options.initialDate ?? new Date(2026, 6, 26, 14, 35, 42);
  let tick: ((date: Date) => void) | undefined;
  let tickerCleanupCount = 0;
  const resolveZone = options.resolveZone ?? (() => TOKYO_ZONE);
  const cleanup = createApp({
    root,
    storage: persisted.storage,
    now: () => currentDate,
    startTicker: (onTick) => {
      tick = onTick;
      return () => {
        tickerCleanupCount += 1;
      };
    },
    resolveZone,
    document,
  });

  return {
    root,
    cleanup,
    persisted,
    tick: (date: Date) => {
      if (!tick) throw new Error("Ticker callback was not captured");
      tick(date);
    },
    setNow: (date: Date) => {
      currentDate = date;
    },
    tickerCleanupCount: () => tickerCleanupCount,
  };
}

beforeEach(() => {
  document.body.replaceChildren();
});

describe("createApp", () => {
  it("loads saved settings before the initial render and wires live settings changes", () => {
    const root = clockFixture();
    const persisted = memoryStorage();
    const time = field(root, "time");
    const textContent = Object.getOwnPropertyDescriptor(Node.prototype, "textContent");
    let themeAtFirstRender: string | null = null;

    if (!textContent?.get || !textContent.set) throw new Error("Node.textContent is unavailable");
    Object.defineProperty(time, "textContent", {
      configurable: true,
      get() {
        return textContent.get?.call(this) as string | null;
      },
      set(value: string | null) {
        themeAtFirstRender ??= root.style.getPropertyValue("--panel-color");
        textContent.set?.call(this, value);
      },
    });

    const cleanup = createApp({
      root,
      storage: persisted.storage,
      now: () => new Date(2026, 6, 26, 14, 35, 42),
      startTicker: () => () => undefined,
      resolveZone: () => TOKYO_ZONE,
      document,
    });

    expect(themeAtFirstRender).toBe("#123456");
    expect(root.style.getPropertyValue("--text-scale")).toBe("1.2");
    expect(field(root, "title-ja").textContent).toBe("日本標準時");
    expect(field(root, "title-en").textContent).toBe("Japan Standard Time 225");
    expect(field(root, "time").textContent).toBe("14:35");
    expect(field(root, "date").textContent).toBe("2026.07.26");
    expect(field(root, "weekday").textContent).toBe("日曜日 / Sunday");
    expect(field(root, "seconds").textContent).toBe("42");
    expect(field(root, "zone").textContent).toContain("Asia/Tokyo");
    expect(root.hasAttribute("aria-busy")).toBe(false);

    const trigger = control<HTMLButtonElement>(root, "settings-trigger");
    const dialog = control<HTMLDialogElement>(root, "settings-dialog");
    trigger.click();
    expect(dialog.hidden).toBe(false);
    expect(control<HTMLInputElement>(root, "settings-text-scale").value).toBe("1.2");

    const accent = control<HTMLInputElement>(root, "settings-accent-color");
    accent.value = "#654321";
    accent.dispatchEvent(new Event("input", { bubbles: true }));

    expect(root.style.getPropertyValue("--accent-color")).toBe("#654321");
    expect(persisted.savedSettings()).toEqual({
      ...SAVED_SETTINGS,
      accentColor: "#654321",
    });

    cleanup();
  });

  it("refreshes the date, weekday, and zone when a ticker date crosses midnight", () => {
    let zoneResolutions = 0;
    const app = setup({
      resolveZone: () => {
        zoneResolutions += 1;
        return zoneResolutions === 1 ? TOKYO_ZONE : OSAKA_ZONE;
      },
    });

    app.tick(new Date(2026, 6, 26, 23, 59, 59));
    expect(zoneResolutions).toBe(1);

    app.tick(new Date(2026, 6, 27, 0, 0, 1));

    expect(field(app.root, "date").textContent).toBe("2026.07.27");
    expect(field(app.root, "weekday").textContent).toBe("月曜日 / Monday");
    expect(field(app.root, "zone").textContent).toContain("Asia/Osaka");
    expect(zoneResolutions).toBe(2);

    app.cleanup();
  });

  it("re-detects the zone when the UTC offset changes during the same local date", () => {
    let zoneResolutions = 0;
    const beforeOffsetChange = new Date(2026, 6, 26, 1, 30, 0);
    const afterOffsetChange = new Date(2026, 6, 26, 2, 30, 0);
    Object.defineProperty(beforeOffsetChange, "getTimezoneOffset", {
      value: () => 240,
    });
    Object.defineProperty(afterOffsetChange, "getTimezoneOffset", {
      value: () => 300,
    });
    const app = setup({
      initialDate: beforeOffsetChange,
      resolveZone: () => {
        zoneResolutions += 1;
        return zoneResolutions === 1
          ? { ...TOKYO_ZONE, abbreviation: "DST" }
          : { ...TOKYO_ZONE, abbreviation: "STD" };
      },
    });

    expect(field(app.root, "zone").textContent).toContain("DST");
    app.tick(afterOffsetChange);

    expect(field(app.root, "zone").textContent).toContain("STD");
    expect(zoneResolutions).toBe(2);

    app.cleanup();
  });

  it("re-detects the zone and renders fresh time when the document becomes visible on the same date", () => {
    let visible = false;
    let zoneResolutions = 0;
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => visible ? "visible" : "hidden",
    });
    const app = setup({
      resolveZone: () => {
        zoneResolutions += 1;
        return zoneResolutions === 1 ? TOKYO_ZONE : OSAKA_ZONE;
      },
    });

    app.setNow(new Date(2026, 6, 26, 18, 10, 11));
    visible = true;
    document.dispatchEvent(new Event("visibilitychange"));

    expect(field(app.root, "time").textContent).toBe("18:10");
    expect(field(app.root, "date").textContent).toBe("2026.07.26");
    expect(field(app.root, "weekday").textContent).toBe("日曜日 / Sunday");
    expect(field(app.root, "seconds").textContent).toBe("11");
    expect(field(app.root, "zone").textContent).toContain("Asia/Osaka");
    expect(field(app.root, "title-ja").textContent).toBe("大阪標準時");
    expect(zoneResolutions).toBe(2);

    app.cleanup();
  });

  it("ignores a pending full-screen rejection after cleanup", async () => {
    let rejectFullscreen: ((reason?: unknown) => void) | undefined;
    const fullscreenRequest = new Promise<void>((_resolve, reject) => {
      rejectFullscreen = reject;
    });
    Object.defineProperty(document.documentElement, "requestFullscreen", {
      configurable: true,
      value: () => fullscreenRequest,
    });
    Object.defineProperty(document, "fullscreenElement", {
      configurable: true,
      value: null,
    });
    const app = setup();
    const status = app.root.querySelector<HTMLElement>('[role="status"]');
    if (!status || !rejectFullscreen) throw new Error("Full-screen test setup failed");

    control<HTMLButtonElement>(app.root, "settings-trigger").click();
    control<HTMLButtonElement>(app.root, "settings-fullscreen").click();
    app.cleanup();
    rejectFullscreen(new Error("Denied after cleanup"));
    await Promise.resolve();
    await Promise.resolve();

    expect(status.textContent).toBe("");
  });

  it("cleans up the ticker, dialog, and visibility listener and ignores late callbacks", () => {
    let visible = true;
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => visible ? "visible" : "hidden",
    });
    const app = setup();
    const trigger = control<HTMLButtonElement>(app.root, "settings-trigger");
    const dialog = control<HTMLDialogElement>(app.root, "settings-dialog");
    const timeBeforeCleanup = field(app.root, "time").textContent;

    app.cleanup();
    app.cleanup();
    expect(app.tickerCleanupCount()).toBe(1);

    trigger.click();
    expect(dialog.hidden).toBe(true);

    app.tick(new Date(2026, 6, 27, 4, 5, 6));
    app.setNow(new Date(2026, 6, 28, 7, 8, 9));
    visible = true;
    document.dispatchEvent(new Event("visibilitychange"));

    expect(field(app.root, "time").textContent).toBe(timeBeforeCleanup);
  });

  it("starts the market refresh on the board and cleans it up exactly once", () => {
    const root = clockFixture();
    const stopRefresh = vi.fn();
    const startRefresh = vi.fn(() => stopRefresh);
    const cleanup = createApp({
      root,
      storage: memoryStorage().storage,
      now: () => new Date(2026, 6, 26, 14, 35, 42),
      startTicker: () => () => undefined,
      startRefresh,
      resolveZone: () => TOKYO_ZONE,
      document,
    });
    const board = root.querySelector<HTMLElement>(".clock-board");

    expect(startRefresh).toHaveBeenCalledTimes(1);
    expect(startRefresh).toHaveBeenCalledWith(expect.objectContaining({
      root: board,
      document,
    }));

    cleanup();
    cleanup();
    expect(stopRefresh).toHaveBeenCalledTimes(1);
  });
});
