import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";

import { DEFAULT_SETTINGS } from "../settings/settings";
import { hasMinimumContrast } from "./theme";
import { createSettingsDialog } from "./settingsDialog";

const FULLSCREEN_FAILURE_MESSAGE = "フルスクリーンに切り替えられませんでした";
const ENTER_FULLSCREEN_LABEL = "全画面表示";
const EXIT_FULLSCREEN_LABEL = "全画面表示を終了";

function createFixture() {
  document.body.innerHTML = `
    <button id="settings-trigger" type="button">設定</button>
    <button id="background-action" type="button">背景の操作</button>
    <dialog id="settings-dialog" hidden>
      <h2 id="settings-dialog-title">表示設定</h2>
      <label for="settings-text-scale">文字サイズ</label>
      <input id="settings-text-scale" type="range" min="0.8" max="1.4" step="0.05" />
      <label for="settings-display-scale">表示サイズ</label>
      <input id="settings-display-scale" type="range" min="0.8" max="1.4" step="0.05" />
      <label for="settings-panel-color">青いパネルの色</label>
      <input id="settings-panel-color" type="color" />
      <label for="settings-accent-color">赤いアクセントの色</label>
      <input id="settings-accent-color" type="color" />
      <label for="settings-text-color">文字色</label>
      <input id="settings-text-color" type="color" />
      <button id="settings-fullscreen" type="button">全画面表示</button>
      <button id="settings-reset" type="button">初期設定に戻す</button>
      <button id="settings-close" type="button">閉じる</button>
    </dialog>
  `;

  const trigger = document.querySelector<HTMLButtonElement>("#settings-trigger");
  const dialog = document.querySelector<HTMLDialogElement>("#settings-dialog");
  if (!trigger || !dialog) throw new Error("Fixture is incomplete");

  return { trigger, dialog };
}

function setup() {
  const { trigger, dialog } = createFixture();
  const onChange = vi.fn();
  const onStatus = vi.fn();
  const controller = createSettingsDialog({
    trigger,
    dialog,
    initialSettings: { ...DEFAULT_SETTINGS, textScale: 1.1 },
    onChange,
    onStatus,
  });

  return { trigger, dialog, onChange, onStatus, controller };
}

function control<T extends HTMLElement>(id: string): T {
  const element = document.querySelector<T>(`#${id}`);
  if (!element) throw new Error(`Missing control: ${id}`);
  return element;
}

describe("createSettingsDialog", () => {
  it("opens from the gear trigger and focuses the first control", () => {
    const { trigger, dialog } = setup();

    trigger.click();

    expect(dialog.hidden).toBe(false);
    expect(document.activeElement).toBe(control("settings-text-scale"));
  });

  it("previews validated settings when a control changes", () => {
    const { controller, onChange } = setup();
    controller.open();
    const textScale = control<HTMLInputElement>("settings-text-scale");
    const panelColor = control<HTMLInputElement>("settings-panel-color");

    textScale.value = "1.25";
    textScale.dispatchEvent(new Event("input", { bubbles: true }));
    panelColor.value = "#abcdef";
    panelColor.dispatchEvent(new Event("input", { bubbles: true }));

    expect(onChange).toHaveBeenLastCalledWith({
      ...DEFAULT_SETTINGS,
      textScale: 1.25,
      panelColor: "#abcdef",
    });
  });

  it("restores defaults and refreshes every control", () => {
    const { controller, onChange } = setup();
    controller.open();

    control<HTMLButtonElement>("settings-reset").click();

    expect(onChange).toHaveBeenLastCalledWith(DEFAULT_SETTINGS);
    expect(control<HTMLInputElement>("settings-text-scale").value).toBe("1");
    expect(control<HTMLInputElement>("settings-display-scale").value).toBe("1");
    expect(control<HTMLInputElement>("settings-panel-color").value).toBe("#0669f5");
    expect(control<HTMLInputElement>("settings-accent-color").value).toBe("#ed354e");
    expect(control<HTMLInputElement>("settings-text-color").value).toBe("#f7ffff");
  });

  it("closes on Escape and restores focus to the gear trigger", () => {
    const { controller, dialog, trigger } = setup();
    controller.open();

    dialog.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));

    expect(dialog.hidden).toBe(true);
    expect(document.activeElement).toBe(trigger);
  });

  it("keeps Tab and Shift+Tab focus within the modal", () => {
    const { controller, dialog } = setup();
    controller.open();
    const first = control<HTMLInputElement>("settings-text-scale");
    const last = control<HTMLButtonElement>("settings-close");

    last.focus();
    dialog.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true }));
    expect(document.activeElement).toBe(first);

    first.focus();
    dialog.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", shiftKey: true, bubbles: true, cancelable: true }));
    expect(document.activeElement).toBe(last);
  });

  it("returns programmatic background focus to the modal while the fallback is open", () => {
    const { controller } = setup();
    controller.open();

    control<HTMLButtonElement>("background-action").focus();

    expect(document.activeElement).toBe(control("settings-text-scale"));
  });

  it("removes all listeners when destroyed", () => {
    const { controller, trigger, dialog, onChange } = setup();
    controller.destroy();

    trigger.click();
    control<HTMLInputElement>("settings-text-scale").dispatchEvent(new Event("input", { bubbles: true }));
    dialog.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));

    expect(dialog.hidden).toBe(true);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("hides an open fallback dialog and restores trigger focus when destroyed", () => {
    const { controller, dialog, trigger } = setup();
    controller.open();

    controller.destroy();

    expect(dialog.hidden).toBe(true);
    expect(document.activeElement).toBe(trigger);
  });

  it("initializes the full-screen button for entering full-screen", () => {
    Object.defineProperty(document, "fullscreenElement", { configurable: true, value: null });

    setup();

    expect(control<HTMLButtonElement>("settings-fullscreen").textContent).toBe(ENTER_FULLSCREEN_LABEL);
    expect(control<HTMLButtonElement>("settings-fullscreen").getAttribute("aria-pressed")).toBe("false");
  });

  it("updates the button state after entering full-screen", async () => {
    const { controller } = setup();
    let fullscreenElement: Element | null = null;
    const requestFullscreen = vi.fn().mockImplementation(async () => {
      fullscreenElement = document.documentElement;
    });
    Object.defineProperty(document.documentElement, "requestFullscreen", { configurable: true, value: requestFullscreen });
    Object.defineProperty(document, "fullscreenElement", {
      configurable: true,
      get: () => fullscreenElement,
    });

    controller.open();
    control<HTMLButtonElement>("settings-fullscreen").click();
    await Promise.resolve();
    await Promise.resolve();

    expect(requestFullscreen).toHaveBeenCalledOnce();
    expect(control<HTMLButtonElement>("settings-fullscreen").textContent).toBe(EXIT_FULLSCREEN_LABEL);
    expect(control<HTMLButtonElement>("settings-fullscreen").getAttribute("aria-pressed")).toBe("true");
  });

  it("updates the button state after exiting full-screen", async () => {
    let fullscreenElement: Element | null = document.documentElement;
    const exitFullscreen = vi.fn().mockImplementation(async () => {
      fullscreenElement = null;
    });
    Object.defineProperty(document, "exitFullscreen", { configurable: true, value: exitFullscreen });
    Object.defineProperty(document, "fullscreenElement", {
      configurable: true,
      get: () => fullscreenElement,
    });
    const { controller } = setup();

    controller.open();
    control<HTMLButtonElement>("settings-fullscreen").click();
    await Promise.resolve();
    await Promise.resolve();

    expect(exitFullscreen).toHaveBeenCalledOnce();
    expect(control<HTMLButtonElement>("settings-fullscreen").textContent).toBe(ENTER_FULLSCREEN_LABEL);
    expect(control<HTMLButtonElement>("settings-fullscreen").getAttribute("aria-pressed")).toBe("false");
  });

  it("updates the button state after an external Escape exit", () => {
    let fullscreenElement: Element | null = document.documentElement;
    Object.defineProperty(document, "fullscreenElement", {
      configurable: true,
      get: () => fullscreenElement,
    });
    setup();

    expect(control<HTMLButtonElement>("settings-fullscreen").textContent).toBe(EXIT_FULLSCREEN_LABEL);
    fullscreenElement = null;
    document.dispatchEvent(new Event("fullscreenchange"));

    expect(control<HTMLButtonElement>("settings-fullscreen").textContent).toBe(ENTER_FULLSCREEN_LABEL);
    expect(control<HTMLButtonElement>("settings-fullscreen").getAttribute("aria-pressed")).toBe("false");
  });

  it("reports unsupported full-screen requests", async () => {
    Object.defineProperty(document.documentElement, "requestFullscreen", {
      configurable: true,
      value: undefined,
    });
    Object.defineProperty(document, "fullscreenElement", { configurable: true, value: undefined });
    const { controller, onStatus } = setup();

    controller.open();
    control<HTMLButtonElement>("settings-fullscreen").click();
    await Promise.resolve();

    expect(onStatus).toHaveBeenCalledWith(FULLSCREEN_FAILURE_MESSAGE);
    expect(control<HTMLButtonElement>("settings-fullscreen").textContent).toBe(ENTER_FULLSCREEN_LABEL);
    expect(control<HTMLButtonElement>("settings-fullscreen").getAttribute("aria-pressed")).toBe("false");
  });

  it("reports a full-screen request rejection without closing the dialog", async () => {
    const { controller, dialog, onStatus } = setup();
    Object.defineProperty(document.documentElement, "requestFullscreen", {
      configurable: true,
      value: vi.fn().mockRejectedValue(new Error("Denied")),
    });
    Object.defineProperty(document, "fullscreenElement", { configurable: true, value: null });

    controller.open();
    control<HTMLButtonElement>("settings-fullscreen").click();
    await Promise.resolve();
    await Promise.resolve();

    expect(onStatus).toHaveBeenCalledWith(FULLSCREEN_FAILURE_MESSAGE);
    expect(dialog.hidden).toBe(false);
  });

  it("reports a full-screen exit rejection and preserves active state", async () => {
    Object.defineProperty(document, "exitFullscreen", {
      configurable: true,
      value: vi.fn().mockRejectedValue(new Error("Denied")),
    });
    Object.defineProperty(document, "fullscreenElement", {
      configurable: true,
      value: document.documentElement,
    });
    const { controller, onStatus } = setup();

    controller.open();
    control<HTMLButtonElement>("settings-fullscreen").click();
    await Promise.resolve();
    await Promise.resolve();

    expect(onStatus).toHaveBeenCalledWith(FULLSCREEN_FAILURE_MESSAGE);
    expect(control<HTMLButtonElement>("settings-fullscreen").textContent).toBe(EXIT_FULLSCREEN_LABEL);
    expect(control<HTMLButtonElement>("settings-fullscreen").getAttribute("aria-pressed")).toBe("true");
  });
});

describe("settings dialog visual defaults", () => {
  it("uses normal-size foreground and background colours with at least 4.5:1 contrast", () => {
    expect(hasMinimumContrast("#07101f", "#f7ffff", 4.5)).toBe(true);
  });
});

describe("settings dialog HTML shell", () => {
  it("provides Japanese labels for every settings control", () => {
    const html = readFileSync(resolve(process.cwd(), "index.html"), "utf8");

    expect(html).toContain('aria-labelledby="settings-dialog-title"');
    expect(html).toContain('id="settings-text-scale"');
    expect(html).toContain('id="settings-display-scale"');
    expect(html).toContain('id="settings-panel-color"');
    expect(html).toContain('id="settings-accent-color"');
    expect(html).toContain('id="settings-text-color"');
    expect(html).toContain('id="settings-fullscreen"');
    expect(html).toContain('id="settings-reset"');
    expect(html).toContain('id="settings-close"');
    expect(html).toContain("文字サイズ");
    expect(html).toContain("全画面表示");
  });
});
