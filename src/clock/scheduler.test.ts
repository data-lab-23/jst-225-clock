import { afterEach, describe, expect, it, vi } from "vitest";

import { startAlignedTicker } from "./scheduler";

describe("startAlignedTicker", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("ticks immediately with a fresh Date", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 6, 26, 4, 5, 9, 250));
    const onTick = vi.fn();

    const stop = startAlignedTicker(onTick);

    expect(onTick).toHaveBeenCalledOnce();
    expect(onTick.mock.calls[0][0]).toEqual(new Date(2026, 6, 26, 4, 5, 9, 250));
    stop();
  });

  it("waits until just after the next second boundary", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 6, 26, 4, 5, 9, 250));
    const onTick = vi.fn();
    const stop = startAlignedTicker(onTick);

    vi.advanceTimersByTime(754);
    expect(onTick).toHaveBeenCalledOnce();
    vi.advanceTimersByTime(1);
    expect(onTick).toHaveBeenCalledTimes(2);
    expect(onTick.mock.calls[1][0]).toEqual(new Date(2026, 6, 26, 4, 5, 10, 5));
    stop();
  });

  it("recomputes later delays from the current time", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 6, 26, 4, 5, 9, 250));
    const onTick = vi.fn();
    const stop = startAlignedTicker(onTick);

    vi.advanceTimersByTime(1_755);

    expect(onTick).toHaveBeenCalledTimes(3);
    expect(onTick.mock.calls[2][0]).toEqual(new Date(2026, 6, 26, 4, 5, 11, 5));
    stop();
  });

  it("stops future callbacks after cleanup", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 6, 26, 4, 5, 9, 250));
    const onTick = vi.fn();
    const stop = startAlignedTicker(onTick);

    stop();
    vi.advanceTimersByTime(10_000);

    expect(onTick).toHaveBeenCalledOnce();
  });
});
