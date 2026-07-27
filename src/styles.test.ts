import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const styles = readFileSync(resolve(process.cwd(), "src/styles.css"), "utf8");

function rule(selector: string): string {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = styles.match(new RegExp(`${escapedSelector}\\s*\\{([^}]*)\\}`));

  if (!match) throw new Error(`Missing CSS rule for ${selector}`);
  return match[1];
}

describe("clock board CSS contracts", () => {
  it("uses the app theme text colour for the board and date row while preserving blue time numerals", () => {
    expect(rule("#app")).toMatch(/color:\s*var\(--text-color\)/);
    expect(rule(".clock-board")).toMatch(/color:\s*var\(--text-color\)/);
    expect(rule(".date-row")).toMatch(/color:\s*var\(--text-color\)/);
    expect(rule(".primary-time")).toMatch(/color:\s*#075bdb/);
  });

  it("compacts wide short viewports so the full board remains visible", () => {
    expect(styles).toMatch(/@media \(min-width: 761px\) and \(max-height: 820px\)/);
    expect(styles).toMatch(/@media \(min-width: 761px\) and \(max-height: 820px\)[\s\S]*?\.clock-header\s*\{[\s\S]*?padding:/);
    expect(styles).toMatch(/@media \(min-width: 761px\) and \(max-height: 820px\)[\s\S]*?\.clock-row\s*\{[\s\S]*?padding:/);
    expect(styles).toMatch(/@media \(min-width: 761px\) and \(max-height: 820px\)[\s\S]*?\.primary-value\s*\{[\s\S]*?font-size:/);
  });
});
