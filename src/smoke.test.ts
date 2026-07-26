import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("project harness", () => {
  it("runs TypeScript tests", () => {
    expect(2 + 2).toBe(4);
  });
});

describe("HTML entry point", () => {
  it("closes the application mount without rendering malformed tag text", () => {
    const html = readFileSync(resolve(process.cwd(), "index.html"), "utf8");

    expect(html).toMatch(
      /<main id="app" aria-busy="true">[^<]*<\/main>/,
    );
    expect(html).not.toMatch(/(?<!<)\/main>/);
  });
});
