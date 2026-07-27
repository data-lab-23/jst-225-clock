import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";

import { DEFAULT_SETTINGS } from "../settings/settings";
import { hasMinimumContrast } from "./theme";
import { createSettingsDialog } from "./settingsDialog";

const FULLSCREEN_FAILURE_MESSAGE = "フルスクリーンに切り替えられませんでした";

function createFixture() {
  document.body.innerHTML = `
    <button id="settings-trigger" type="button">設定</button>
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

  it("removes all listeners when destroyed", () => {
    const { controller, trigger, dialog, onChange } = setup();
    controller.destroy();

    trigger.click();
    control<HTMLInputElement>("settings-text-scale").dispatchEvent(new Event("input", { bubbles: true }));
    dialog.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));

    expect(dialog.hidden).toBe(true);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("enters full-screen when the document is not full-screen", async () => {
    const { controller } = setup();
    const requestFullscreen = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(document.documentElement, "requestFullscreen", { configurable: true, value: requestFullscreen });
    Object.defineProperty(document, "fullscreenElement", { configurable: true, value: null });

    controller.open();
    control<HTMLButtonElement>("settings-fullscreen").click();
    await Promise.resolve();

    expect(requestFullscreen).toHaveBeenCalledOnce();
  });

  it("exits full-screen when the document is already full-screen", async () => {
    const { controller } = setup();
    const exitFullscreen = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(document, "exitFullscreen", { configurable: true, value: exitFullscreen });
    Object.defineProperty(document, "fullscreenElement", { configurable: true, value: document.documentElement });

    controller.open();
    control<HTMLButtonElement>("settings-fullscreen").click();
    await Promise.resolve();

    expect(exitFullscreen).toHaveBeenCalledOnce();
  });

  it("reports a full-screen rejection without closing the dialog", async () => {
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
