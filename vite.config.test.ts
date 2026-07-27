// @vitest-environment node

import { describe, expect, test } from "vitest";
import { configDefaults } from "vitest/config";

import viteConfig, { resolveBasePath } from "./vite.config";

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

  test("normalizes a slash-only deployment path to the site root", () => {
    expect(resolveBasePath("/")).toBe("/");
  });

  test("retains Vitest's default non-config exclusions", () => {
    const exclusions = (viteConfig as {
      test?: { exclude?: string[] };
    }).test?.exclude;
    const defaultNonConfigExclusions = configDefaults.exclude.filter(
      (pattern) => !pattern.includes(".config.*"),
    );

    expect(exclusions).toEqual(expect.arrayContaining(defaultNonConfigExclusions));
  });
});
