export interface ClockSnapshot {
  time: string;
  date: string;
  weekday: string;
  seconds: string;
}

const japaneseWeekdays = ["日曜日", "月曜日", "火曜日", "水曜日", "木曜日", "金曜日", "土曜日"];
const englishWeekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const pad = (value: number) => String(value).padStart(2, "0");

export function formatClock(date: Date, _locale = "ja-JP"): ClockSnapshot {
  const weekdayIndex = date.getDay();

  return {
    time: `${pad(date.getHours())}:${pad(date.getMinutes())}`,
    date: `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())}`,
    weekday: `${japaneseWeekdays[weekdayIndex]} / ${englishWeekdays[weekdayIndex]}`,
    seconds: pad(date.getSeconds()),
  };
}
