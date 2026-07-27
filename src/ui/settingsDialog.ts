import { DEFAULT_SETTINGS, validateSettings, type ClockSettings } from "../settings/settings";

export interface SettingsDialogOptions {
  trigger: HTMLButtonElement;
  dialog: HTMLDialogElement;
  initialSettings: ClockSettings;
  onChange: (settings: ClockSettings) => void;
  onStatus: (message: string) => void;
}

export interface SettingsDialogController {
  open(): void;
  close(): void;
  destroy(): void;
}

const FULLSCREEN_FAILURE_MESSAGE = "フルスクリーンに切り替えられませんでした";
const ENTER_FULLSCREEN_LABEL = "全画面表示";
const EXIT_FULLSCREEN_LABEL = "全画面表示を終了";

interface DialogControls {
  textScale: HTMLInputElement;
  displayScale: HTMLInputElement;
  panelColor: HTMLInputElement;
  accentColor: HTMLInputElement;
  textColor: HTMLInputElement;
  fullscreen: HTMLButtonElement;
  reset: HTMLButtonElement;
  close: HTMLButtonElement;
}

function requiredElement<T extends HTMLElement>(dialog: HTMLDialogElement, selector: string): T {
  const element = dialog.querySelector<T>(selector);
  if (!element) throw new Error(`Missing required settings dialog control: ${selector}`);
  return element;
}

function getControls(dialog: HTMLDialogElement): DialogControls {
  return {
    textScale: requiredElement(dialog, "#settings-text-scale"),
    displayScale: requiredElement(dialog, "#settings-display-scale"),
    panelColor: requiredElement(dialog, "#settings-panel-color"),
    accentColor: requiredElement(dialog, "#settings-accent-color"),
    textColor: requiredElement(dialog, "#settings-text-color"),
    fullscreen: requiredElement(dialog, "#settings-fullscreen"),
    reset: requiredElement(dialog, "#settings-reset"),
    close: requiredElement(dialog, "#settings-close"),
  };
}

function focusableElements(dialog: HTMLDialogElement): HTMLElement[] {
  return Array.from(dialog.querySelectorAll<HTMLElement>(
    'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
  ));
}

export function createSettingsDialog(options: SettingsDialogOptions): SettingsDialogController {
  const { trigger, dialog, onChange, onStatus } = options;
  const controls = getControls(dialog);
  let settings = validateSettings(options.initialSettings);
  let isOpen = false;
  let destroyed = false;

  const syncControls = () => {
    controls.textScale.value = String(settings.textScale);
    controls.displayScale.value = String(settings.displayScale);
    controls.panelColor.value = settings.panelColor;
    controls.accentColor.value = settings.accentColor;
    controls.textColor.value = settings.textColor;
  };

  const preview = () => {
    settings = validateSettings({
      textScale: Number(controls.textScale.value),
      displayScale: Number(controls.displayScale.value),
      panelColor: controls.panelColor.value,
      accentColor: controls.accentColor.value,
      textColor: controls.textColor.value,
    });
    syncControls();
    onChange(settings);
  };

  const finishClose = () => {
    if (!isOpen) return;
    isOpen = false;
    document.removeEventListener("focusin", handleFocusin);
    dialog.hidden = true;
    trigger.focus();
  };

  const open = () => {
    if (destroyed || isOpen) return;
    isOpen = true;
    syncControls();
    dialog.hidden = false;

    if (typeof dialog.showModal === "function") {
      try {
        dialog.showModal();
      } catch {
        // A native dialog can reject showModal when its document is inactive.
        // The hidden fallback keeps settings available without interrupting the clock.
      }
    }

    document.addEventListener("focusin", handleFocusin);
    controls.textScale.focus();
  };

  const close = () => {
    if (destroyed || !isOpen) return;

    if (typeof dialog.close === "function" && dialog.open) {
      dialog.close();
      if (!dialog.open) finishClose();
      return;
    }

    finishClose();
  };

  const handleTriggerClick = () => open();
  const handleInput = () => preview();
  const handleReset = () => {
    settings = { ...DEFAULT_SETTINGS };
    syncControls();
    onChange(settings);
  };
  const handleCloseClick = () => close();
  const handleNativeClose = () => finishClose();
  const handleCancel = (event: Event) => {
    event.preventDefault();
    close();
  };
  const handleKeydown = (event: KeyboardEvent) => {
    if (!isOpen) return;

    if (event.key === "Escape") {
      event.preventDefault();
      close();
      return;
    }

    if (event.key !== "Tab") return;
    const focusable = focusableElements(dialog);
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };
  const handleFocusin = (event: FocusEvent) => {
    if (!isOpen || dialog.contains(event.target as Node | null)) return;
    controls.textScale.focus();
  };
  const syncFullscreenControl = () => {
    const fullscreenActive = Boolean(document.fullscreenElement);
    controls.fullscreen.textContent = fullscreenActive
      ? EXIT_FULLSCREEN_LABEL
      : ENTER_FULLSCREEN_LABEL;
    controls.fullscreen.setAttribute("aria-pressed", String(fullscreenActive));
  };
  const handleFullscreenChange = () => syncFullscreenControl();
  const handleFullscreen = async () => {
    const fullscreenDocument = document as Document & {
      exitFullscreen?: () => Promise<void>;
    };
    const root = document.documentElement as HTMLElement & {
      requestFullscreen?: () => Promise<void>;
    };

    try {
      const action = document.fullscreenElement
        ? fullscreenDocument.exitFullscreen?.()
        : root.requestFullscreen?.();

      if (!action) throw new Error("Full-screen API unavailable");
      await action;
      syncFullscreenControl();
    } catch {
      onStatus(FULLSCREEN_FAILURE_MESSAGE);
    }
  };

  trigger.addEventListener("click", handleTriggerClick);
  for (const input of [controls.textScale, controls.displayScale, controls.panelColor, controls.accentColor, controls.textColor]) {
    input.addEventListener("input", handleInput);
  }
  controls.reset.addEventListener("click", handleReset);
  controls.close.addEventListener("click", handleCloseClick);
  controls.fullscreen.addEventListener("click", handleFullscreen);
  dialog.addEventListener("keydown", handleKeydown);
  dialog.addEventListener("cancel", handleCancel);
  dialog.addEventListener("close", handleNativeClose);
  document.addEventListener("fullscreenchange", handleFullscreenChange);

  syncControls();
  syncFullscreenControl();

  return {
    open,
    close,
    destroy() {
      if (destroyed) return;
      close();
      destroyed = true;
      trigger.removeEventListener("click", handleTriggerClick);
      for (const input of [controls.textScale, controls.displayScale, controls.panelColor, controls.accentColor, controls.textColor]) {
        input.removeEventListener("input", handleInput);
      }
      controls.reset.removeEventListener("click", handleReset);
      controls.close.removeEventListener("click", handleCloseClick);
      controls.fullscreen.removeEventListener("click", handleFullscreen);
      dialog.removeEventListener("keydown", handleKeydown);
      dialog.removeEventListener("cancel", handleCancel);
      dialog.removeEventListener("close", handleNativeClose);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("focusin", handleFocusin);
    },
  };
}
