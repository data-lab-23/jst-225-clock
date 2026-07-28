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
  it("uses independent readable foregrounds for the panel and accent row while preserving blue time numerals", () => {
    expect(rule(".clock-panel")).toMatch(/color:\s*var\(--panel-foreground\)/);
    expect(rule(".date-row")).toMatch(/color:\s*var\(--accent-foreground\)/);
    expect(rule(".primary-time")).toMatch(/color:\s*#075bdb/);
  });

  it("shows non-empty status feedback without intercepting pointer input", () => {
    expect(rule(".app-status")).toMatch(/position:\s*fixed/);
    expect(rule(".app-status")).toMatch(/pointer-events:\s*none/);
    expect(rule(".app-status:empty")).toMatch(/display:\s*none/);
  });

  it("compacts wide short viewports so the full board remains visible", () => {
    expect(styles).toMatch(
      /@media \(max-height: 900px\)[\s\S]*?\.clock-stage\s*\{[\s\S]*?padding-block:/,
    );
    expect(styles).toMatch(/@media \(min-width: 761px\) and \(max-height: 820px\)/);
    expect(styles).toMatch(/@media \(min-width: 761px\) and \(max-height: 820px\)[\s\S]*?\.clock-header\s*\{[\s\S]*?padding:/);
    expect(styles).toMatch(/@media \(min-width: 761px\) and \(max-height: 820px\)[\s\S]*?\.clock-row\s*\{[\s\S]*?padding:/);
    expect(styles).toMatch(/@media \(min-width: 761px\) and \(max-height: 820px\)[\s\S]*?\.primary-value\s*\{[\s\S]*?font-size:/);
  });

  it("provides truthful broadcast refresh decoration with a reduced-motion fallback", () => {
    expect(rule(":root")).toMatch(/--font-broadcast-ja:/);
    expect(rule(":root")).toMatch(/--font-broadcast-numeric:/);
    expect(rule(".live-indicator")).toMatch(/animation:/);
    expect(rule(".primary-value-ghost")).toMatch(/position:\s*absolute/);
    expect(rule(".primary-value-ghost")).toMatch(/opacity:\s*0/);
    expect(rule(".clock-board.is-market-refreshing .primary-time")).toMatch(/animation:/);
    expect(styles).toMatch(
      /@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.live-indicator[\s\S]*?animation:\s*none/,
    );
  });

  it("keeps the clock first while presenting responsive search guidance below it", () => {
    expect(rule("#app")).toMatch(/background:/);
    expect(rule(".clock-stage")).toMatch(/min-height:\s*100dvh/);
    expect(rule(".clock-stage")).toMatch(/place-items:\s*center/);
    expect(rule(".clock-guide")).toMatch(/inline-size:\s*min\(100%,\s*72rem\)/);
    expect(rule(".clock-guide")).toMatch(/content-visibility:\s*auto/);
    expect(styles).toMatch(
      /@media \(min-width: 761px\)[\s\S]*?\.clock-guide__grid\s*\{[\s\S]*?grid-template-columns:/,
    );
    expect(styles).toMatch(
      /:fullscreen\s+\.clock-guide\s*\{[\s\S]*?display:\s*none/,
    );
  });

  it("separates advertising from content and removes it from fullscreen", () => {
    expect(rule(".ad-placement")).toMatch(/border:/);
    expect(rule(".ad-placement")).toMatch(/min-block-size:/);
    expect(rule(".ad-placement")).toMatch(/contain:\s*layout paint/);
    expect(rule(".ad-placement__label")).toMatch(/letter-spacing:/);
    expect(rule(".ad-placement__label")).toMatch(/color:/);
    expect(styles).toMatch(
      /:fullscreen\s+\.ad-placement\s*\{[\s\S]*?display:\s*none/,
    );
  });
});
