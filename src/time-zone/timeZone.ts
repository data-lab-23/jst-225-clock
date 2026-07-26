export interface TimeZoneInfo {
  id: string;
  abbreviation: string;
  titleJa: string;
  titleEn: string;
}

const localTimeFallback: TimeZoneInfo = {
  id: "Local",
  abbreviation: "Local",
  titleJa: "現地時刻",
  titleEn: "Local Time 225",
};

export function resolveTimeZone(
  date: Date,
  zoneId?: string,
  locale?: string,
): TimeZoneInfo {
  try {
    const id = zoneId ?? Intl.DateTimeFormat().resolvedOptions().timeZone;

    if (!id) {
      return localTimeFallback;
    }

    const abbreviation = Intl.DateTimeFormat(locale, {
      timeZone: id,
      timeZoneName: "short",
    })
      .formatToParts(date)
      .find((part) => part.type === "timeZoneName")?.value;

    if (!abbreviation) {
      return localTimeFallback;
    }

    if (id === "Asia/Tokyo") {
      return {
        id,
        abbreviation: "JST",
        titleJa: "日本標準時",
        titleEn: "Japan Standard Time 225",
      };
    }

    return {
      id,
      abbreviation,
      titleJa: "現地時刻",
      titleEn: "Local Time 225",
    };
  } catch {
    return localTimeFallback;
  }
}
