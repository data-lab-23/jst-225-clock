import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("project harness", () => {
  it("runs TypeScript tests", () => {
    expect(2 + 2).toBe(4);
  });
});

describe("HTML entry point", () => {
  it("provides the semantic clock mount without malformed tag text", () => {
    const html = readFileSync(resolve(process.cwd(), "index.html"), "utf8");

    expect(html).toContain('<main id="app" aria-busy="true">');
    expect(html).toContain('data-clock-field="time"');
    expect(html).toContain('id="settings-trigger"');
    expect(html).toContain('<dialog id="settings-dialog"');
    expect(html).not.toMatch(/(?<!<)\/main>/);
  });

  it("keeps dynamic clock fields out of live-region semantics", () => {
    const html = readFileSync(resolve(process.cwd(), "index.html"), "utf8");
    const parsed = new DOMParser().parseFromString(html, "text/html");
    const fields = Array.from(parsed.querySelectorAll<HTMLElement>("[data-clock-field]"));

    expect(fields).toHaveLength(7);
    for (const field of fields) {
      expect(field.tagName).not.toBe("OUTPUT");
      expect(field.hasAttribute("role")).toBe(false);
      expect(field.hasAttribute("aria-live")).toBe(false);
    }

    const status = parsed.querySelector<HTMLElement>('[role="status"]');
    expect(status?.classList.contains("app-status")).toBe(true);
    expect(status?.classList.contains("sr-only")).toBe(false);
    expect(status?.getAttribute("aria-live")).toBe("polite");
  });
});
