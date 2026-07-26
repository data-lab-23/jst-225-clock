import { describe, expect, it } from "vitest";

import { resolveTimeZone } from "./timeZone";

describe("resolveTimeZone", () => {
  const winterDate = new Date("2026-01-15T12:00:00.000Z");
  const summerDate = new Date("2026-07-15T12:00:00.000Z");

  it("presents Tokyo as Japan Standard Time 225", () => {
    expect(resolveTimeZone(winterDate, "Asia/Tokyo", "en-US")).toMatchObject({
      id: "Asia/Tokyo",
      abbreviation: "JST",
      titleJa: "日本標準時",
      titleEn: "Japan Standard Time 225",
    });
  });

  it("uses JST for Tokyo even when the locale supplies a UTC offset", () => {
    expect(resolveTimeZone(winterDate, "Asia/Tokyo", "fr-FR").abbreviation).toBe("JST");
  });

  it("presents non-Tokyo zones as local time and preserves their winter abbreviation", () => {
    expect(resolveTimeZone(winterDate, "America/New_York", "en-US")).toMatchObject({
      id: "America/New_York",
      abbreviation: "EST",
      titleJa: "現地時刻",
      titleEn: "Local Time 225",
    });
  });

  it("uses the daylight-saving abbreviation for a summer New York date", () => {
    expect(resolveTimeZone(summerDate, "America/New_York", "en-US").abbreviation).toBe("EDT");
  });

  it("uses the device IANA time zone when no zone is supplied", () => {
    const deviceZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    expect(resolveTimeZone(winterDate, undefined, "en-US").id).toBe(deviceZone);
  });

  it("falls back when the requested zone is invalid", () => {
    expect(resolveTimeZone(winterDate, "Not/A_Zone", "en-US")).toEqual({
      id: "Local",
      abbreviation: "Local",
      titleJa: "現地時刻",
      titleEn: "Local Time 225",
    });
  });
});
