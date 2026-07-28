// @vitest-environment node

import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { verifyBuildArtifact } from "./buildArtifact";

describe("GitHub Pages build artifact", () => {
  it("contains every monetization and project-path deployment contract", () => {
    expect(
      verifyBuildArtifact(resolve(process.cwd(), "dist"), "/jst-225-clock/"),
    ).toEqual([]);
  });
});
