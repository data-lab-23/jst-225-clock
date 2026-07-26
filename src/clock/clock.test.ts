import { describe, expect, it } from "vitest";

import { formatClock } from "./clock";

describe("formatClock", () => {
  it("formats the supplied Sunday fixture with Japanese and English weekday names", () => {
    expect(formatClock(new Date(2026, 6, 26, 4, 5, 9), "ja-JP")).toEqual({
      time: "04:05",
      date: "2026.07.26",
      weekday: "日曜日 / Sunday",
      seconds: "09",
    });
  });

  it("preserves 23:59 and pads seconds", () => {
    expect(formatClock(new Date(2026, 11, 31, 23, 59, 3))).toMatchObject({
      time: "23:59",
      seconds: "03",
    });
  });

  it("uses the date weekday instead of a hard-coded Sunday", () => {
    expect(formatClock(new Date(2026, 6, 27, 12, 0, 0))).toMatchObject({
      weekday: "月曜日 / Monday",
    });
  });
});
