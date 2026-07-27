// @vitest-environment node

import { describe, expect, test } from "vitest";

import { resolveBasePath } from "./vite.config";

describe("resolveBasePath", () => {
  test("uses a relative base path when no deployment path is configured", () => {
    expect(resolveBasePath(undefined)).toBe("./");
  });

  test("preserves a normalized repository path", () => {
    expect(resolveBasePath("/jst-225-clock/")).toBe("/jst-225-clock/");
  });

  test("adds leading and trailing slashes to a repository name", () => {
    expect(resolveBasePath("jst-225-clock")).toBe("/jst-225-clock/");
  });

  test("collapses duplicate leading and trailing slashes", () => {
    expect(resolveBasePath("//jst-225-clock//")).toBe("/jst-225-clock/");
  });
});
