import { describe, expect, it } from "vitest";

import type { ClockSnapshot } from "../clock/clock";
import type { TimeZoneInfo } from "../time-zone/timeZone";
import { createClockView } from "./clockView";

const snapshot: ClockSnapshot = {
  time: "14:35",
  date: "2026.07.26",
  weekday: "日曜日 / Sunday",
  seconds: "42",
};

const zone: TimeZoneInfo = {
  id: "Asia/Tokyo",
  abbreviation: "JST",
  titleJa: "日本標準時",
  titleEn: "Japan Standard Time 225",
};

function createFixture(): HTMLElement {
  const root = document.createElement("main");
  root.innerHTML = `
    <header>
      <span data-clock-field="title-ja"></span>
      <span data-clock-field="title-en"></span>
      <button id="settings-trigger" type="button" aria-label="表示設定を開く">設定</button>
    </header>
    <section>
      <span data-clock-field="time"></span>
      <span data-clock-field="date"></span>
      <span data-clock-field="weekday"></span>
      <span data-clock-field="seconds"></span>
      <span data-clock-field="zone"></span>
    </section>
    <p role="status"></p>
    <dialog id="settings-dialog"></dialog>
  `;
  return root;
}

function field(root: HTMLElement, name: string): HTMLElement {
  const element = root.querySelector<HTMLElement>(`[data-clock-field="${name}"]`);
  if (!element) throw new Error(`Missing test fixture field: ${name}`);
  return element;
}

describe("createClockView", () => {
  it("renders each title and clock value in its designated field", () => {
    const root = createFixture();
    const view = createClockView(root);

    view.render(snapshot, zone);
    view.setStatus("時刻を更新しました");

    expect(field(root, "title-ja").textContent).toBe("日本標準時");
    expect(field(root, "title-en").textContent).toBe("Japan Standard Time 225");
    expect(field(root, "time").textContent).toBe("14:35");
    expect(field(root, "date").textContent).toBe("2026.07.26");
    expect(field(root, "weekday").textContent).toBe("日曜日 / Sunday");
    expect(field(root, "seconds").textContent).toBe("42");
    expect(field(root, "zone").textContent).toBe("Asia/Tokyo（JST）");
    expect(root.querySelector('[role="status"]')?.textContent).toBe("時刻を更新しました");
  });

  it("updates the existing display fields without creating duplicate rows", () => {
    const root = createFixture();
    const view = createClockView(root);
    const timeField = field(root, "time");

    view.render(snapshot, zone);
    view.render({ ...snapshot, time: "14:36", seconds: "43" }, { ...zone, abbreviation: "JST" });

    expect(field(root, "time")).toBe(timeField);
    expect(field(root, "time").textContent).toBe("14:36");
    expect(field(root, "seconds").textContent).toBe("43");
    expect(root.querySelectorAll("[data-clock-field]")).toHaveLength(7);
  });

  it("explains which required hook is missing", () => {
    const root = createFixture();
    field(root, "seconds").remove();

    expect(() => createClockView(root)).toThrow('Missing required clock view hook: [data-clock-field="seconds"]');
  });
});
