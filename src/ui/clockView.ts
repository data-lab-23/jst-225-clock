import type { ClockSnapshot } from "../clock/clock";
import type { TimeZoneInfo } from "../time-zone/timeZone";

export interface ClockView {
  render(snapshot: ClockSnapshot, zone: TimeZoneInfo): void;
  setStatus(message: string): void;
}

type ClockField = "title-ja" | "title-en" | "time" | "date" | "weekday" | "seconds" | "zone";

function requiredField(root: HTMLElement, name: ClockField): HTMLElement {
  const selector = `[data-clock-field="${name}"]`;
  const element = root.querySelector<HTMLElement>(selector);

  if (!element) throw new Error(`Missing required clock view hook: ${selector}`);

  return element;
}

function requiredStatus(root: HTMLElement): HTMLElement {
  const element = root.querySelector<HTMLElement>('[role="status"]');

  if (!element) throw new Error('Missing required clock view hook: [role="status"]');

  return element;
}

export function createClockView(root: HTMLElement): ClockView {
  const fields = {
    titleJa: requiredField(root, "title-ja"),
    titleEn: requiredField(root, "title-en"),
    time: requiredField(root, "time"),
    date: requiredField(root, "date"),
    weekday: requiredField(root, "weekday"),
    seconds: requiredField(root, "seconds"),
    zone: requiredField(root, "zone"),
  };
  const timeGhost = root.querySelector<HTMLElement>(".primary-value-ghost");
  if (!timeGhost) throw new Error("Missing required clock view hook: .primary-value-ghost");
  const status = requiredStatus(root);

  return {
    render(snapshot, zone) {
      fields.titleJa.textContent = zone.titleJa;
      fields.titleEn.textContent = zone.titleEn;
      fields.time.textContent = snapshot.time;
      timeGhost.textContent = snapshot.time;
      fields.date.textContent = snapshot.date;
      fields.weekday.textContent = snapshot.weekday;
      fields.seconds.textContent = snapshot.seconds;
      fields.seconds.dataset.tickParity =
        Number.parseInt(snapshot.seconds, 10) % 2 === 0 ? "even" : "odd";
      fields.zone.textContent = `${zone.id}（${zone.abbreviation}）`;
    },
    setStatus(message) {
      status.textContent = message;
    },
  };
}
