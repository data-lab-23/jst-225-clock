import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  MAX_REFRESH_DELAY_MS,
  MIN_REFRESH_DELAY_MS,
  REFRESH_DURATION_MS,
  startMarketRefresh,
} from "./marketRefresh";

function setDocumentHidden(hidden: boolean): void {
  Object.defineProperty(document, "hidden", {
    configurable: true,
    value: hidden,
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  setDocumentHidden(false);
});

afterEach(() => {
  vi.useRealTimers();
  setDocumentHidden(false);
});

describe("startMarketRefresh", () => {
  it("runs one short refresh after the minimum randomized delay", () => {
    const root = document.createElement("section");
    const stop = startMarketRefresh({
      root,
      document,
      random: () => 0,
      prefersReducedMotion: () => false,
    });

    vi.advanceTimersByTime(MIN_REFRESH_DELAY_MS - 1);
    expect(root.classList.contains("is-market-refreshing")).toBe(false);

    vi.advanceTimersByTime(1);
    expect(root.classList.contains("is-market-refreshing")).toBe(true);

    vi.advanceTimersByTime(REFRESH_DURATION_MS);
    expect(root.classList.contains("is-market-refreshing")).toBe(false);
    stop();
  });

  it("uses the maximum bounded delay and reschedules after cleanup", () => {
    const root = document.createElement("section");
    const stop = startMarketRefresh({
      root,
      document,
      random: () => 1,
      prefersReducedMotion: () => false,
    });

    vi.advanceTimersByTime(MAX_REFRESH_DELAY_MS);
    expect(root.classList.contains("is-market-refreshing")).toBe(true);

    vi.advanceTimersByTime(REFRESH_DURATION_MS + MAX_REFRESH_DELAY_MS);
    expect(root.classList.contains("is-market-refreshing")).toBe(true);
    stop();
  });

  it("pauses while hidden and schedules a fresh delay when visible", () => {
    const root = document.createElement("section");
    setDocumentHidden(true);
    const stop = startMarketRefresh({
      root,
      document,
      random: () => 0,
      prefersReducedMotion: () => false,
    });

    vi.advanceTimersByTime(MAX_REFRESH_DELAY_MS);
    expect(root.classList.contains("is-market-refreshing")).toBe(false);

    setDocumentHidden(false);
    document.dispatchEvent(new Event("visibilitychange"));
    vi.advanceTimersByTime(MIN_REFRESH_DELAY_MS);
    expect(root.classList.contains("is-market-refreshing")).toBe(true);
    stop();
  });

  it("removes an active refresh and cancels future work when stopped", () => {
    const root = document.createElement("section");
    const stop = startMarketRefresh({
      root,
      document,
      random: () => 0,
      prefersReducedMotion: () => false,
    });

    vi.advanceTimersByTime(MIN_REFRESH_DELAY_MS);
    expect(root.classList.contains("is-market-refreshing")).toBe(true);

    stop();
    stop();
    expect(root.classList.contains("is-market-refreshing")).toBe(false);

    vi.advanceTimersByTime(REFRESH_DURATION_MS + MAX_REFRESH_DELAY_MS);
    expect(root.classList.contains("is-market-refreshing")).toBe(false);
  });

  it("does not schedule decorative motion for reduced-motion users", () => {
    const root = document.createElement("section");
    const stop = startMarketRefresh({
      root,
      document,
      random: () => 0,
      prefersReducedMotion: () => true,
    });

    vi.advanceTimersByTime(MAX_REFRESH_DELAY_MS * 2);
    expect(root.classList.contains("is-market-refreshing")).toBe(false);
    stop();
  });

  it("keeps scheduling when the browser has no matchMedia implementation", () => {
    const root = document.createElement("section");
    const originalMatchMedia = window.matchMedia;
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: undefined,
    });

    try {
      const stop = startMarketRefresh({
        root,
        document,
        random: () => 0,
      });

      vi.advanceTimersByTime(MIN_REFRESH_DELAY_MS);
      expect(root.classList.contains("is-market-refreshing")).toBe(true);
      stop();
    } finally {
      Object.defineProperty(window, "matchMedia", {
        configurable: true,
        value: originalMatchMedia,
      });
    }
  });
});
