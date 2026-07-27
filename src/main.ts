import "./styles.css";

import { formatClock } from "./clock/clock";
import { startAlignedTicker } from "./clock/scheduler";
import { validateSettings } from "./settings/settings";
import { loadSettings, saveSettings } from "./settings/storage";
import { resolveTimeZone, type TimeZoneInfo } from "./time-zone/timeZone";
import { createClockView } from "./ui/clockView";
import { createSettingsDialog } from "./ui/settingsDialog";
import { applyTheme } from "./ui/theme";

export interface AppDependencies {
  root: HTMLElement;
  storage: Storage;
  now?: () => Date;
  startTicker?: (onTick: (date: Date) => void) => () => void;
  resolveZone?: (date: Date) => TimeZoneInfo;
  document?: Document;
}

function requiredElement<T extends HTMLElement>(root: HTMLElement, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Missing required application hook: ${selector}`);
  return element;
}

function zoneCacheKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}@${date.getTimezoneOffset()}`;
}

export function createApp(dependencies: AppDependencies): () => void {
  const {
    root,
    storage,
    now = () => new Date(),
    startTicker = startAlignedTicker,
    resolveZone = resolveTimeZone,
    document: appDocument = document,
  } = dependencies;
  const settings = loadSettings(storage);

  applyTheme(root, settings);

  const view = createClockView(root);
  let active = true;
  const settingsDialog = createSettingsDialog({
    trigger: requiredElement(root, "#settings-trigger"),
    dialog: requiredElement(root, "#settings-dialog"),
    initialSettings: settings,
    onChange(nextSettings) {
      if (!active) return;
      const validated = validateSettings(nextSettings);
      applyTheme(root, validated);
      saveSettings(storage, validated);
    },
    onStatus(message) {
      if (active) view.setStatus(message);
    },
  });
  let renderedZoneKey: string | undefined;
  let zone: TimeZoneInfo | undefined;

  const render = (date: Date) => {
    if (!active) return;

    const cacheKey = zoneCacheKey(date);
    if (!zone || cacheKey !== renderedZoneKey) {
      zone = resolveZone(date);
      renderedZoneKey = cacheKey;
    }

    view.render(formatClock(date), zone);
    root.removeAttribute("aria-busy");
  };
  const handleVisibilityChange = () => {
    if (appDocument.visibilityState === "visible") {
      zone = undefined;
      render(now());
    }
  };

  render(now());
  appDocument.addEventListener("visibilitychange", handleVisibilityChange);
  const stopTicker = startTicker(render);

  return () => {
    if (!active) return;
    active = false;
    stopTicker();
    settingsDialog.destroy();
    appDocument.removeEventListener("visibilitychange", handleVisibilityChange);
  };
}

function unavailableStorage(): Storage {
  return {
    length: 0,
    clear() {},
    getItem() {
      return null;
    },
    key() {
      return null;
    },
    removeItem() {},
    setItem() {},
  };
}

function browserStorage(): Storage {
  try {
    return window.localStorage;
  } catch {
    return unavailableStorage();
  }
}

function startBrowserApp(): void {
  const root = document.querySelector<HTMLElement>("#app");
  if (!root) throw new Error("時計アプリの表示領域が見つかりません");

  createApp({
    root,
    storage: browserStorage(),
    document,
  });
}

const isVitest = (globalThis as {
  process?: { env?: { VITEST?: string } };
}).process?.env?.VITEST === "true";

if (!isVitest) startBrowserApp();
