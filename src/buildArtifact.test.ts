// @vitest-environment node

import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { verifyBuildArtifact } from "./buildArtifact";

const temporaryDirectories: string[] = [];

function fixture(files: Record<string, string>): string {
  const root = mkdtempSync(join(tmpdir(), "jst-225-dist-"));
  temporaryDirectories.push(root);

  for (const [name, content] of Object.entries(files)) {
    writeFileSync(join(root, name), content, "utf8");
  }

  return root;
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe("verifyBuildArtifact", () => {
  it("accepts a deployable Pages artifact with the clock, privacy policy, and crawler files", () => {
    const root = fixture({
      "index.html": `
        <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6402260099646942"></script>
        <script type="module" src="/jst-225-clock/assets/index.js"></script>
        <link rel="stylesheet" href="/jst-225-clock/assets/index.css">
        <a href="privacy.html">プライバシーポリシー</a>
      `,
      "privacy.html": `
        <link rel="canonical" href="https://data-lab-23.github.io/jst-225-clock/privacy.html">
        <p>Google AdSenseとCookie</p>
      `,
      "sitemap.xml": `
        <loc>https://data-lab-23.github.io/jst-225-clock/</loc>
        <loc>https://data-lab-23.github.io/jst-225-clock/privacy.html</loc>
      `,
      "robots.txt": "Allow: /jst-225-clock/",
    });

    expect(verifyBuildArtifact(root, "/jst-225-clock/")).toEqual([]);
  });

  it("reports missing copied pages and repository-base asset regressions", () => {
    const root = fixture({
      "index.html": `
        <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6402260099646942"></script>
        <script type="module" src="/assets/index.js"></script>
        <link rel="stylesheet" href="/assets/index.css">
        <a href="privacy.html">プライバシーポリシー</a>
      `,
      "sitemap.xml": `
        <loc>https://data-lab-23.github.io/jst-225-clock/</loc>
        <loc>https://data-lab-23.github.io/jst-225-clock/privacy.html</loc>
      `,
      "robots.txt": "Allow: /jst-225-clock/",
    });

    expect(verifyBuildArtifact(root, "/jst-225-clock/")).toEqual([
      "Missing dist/privacy.html",
      "Module asset URL does not use /jst-225-clock/",
      "Stylesheet asset URL does not use /jst-225-clock/",
    ]);
  });
});
