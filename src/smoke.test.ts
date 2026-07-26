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

    expect(html).toContain('<main id="app">');
    expect(html).toContain('data-clock-field="time"');
    expect(html).toContain('id="settings-trigger"');
    expect(html).toContain('<dialog id="settings-dialog"');
    expect(html).not.toMatch(/(?<!<)\/main>/);
  });
});
