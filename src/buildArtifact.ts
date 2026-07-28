import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ADSENSE_CLIENT = "ca-pub-6402260099646942";
const PRIVACY_URL =
  "https://data-lab-23.github.io/jst-225-clock/privacy.html";

function read(root: string, file: string): string | undefined {
  const path = join(root, file);
  return existsSync(path) ? readFileSync(path, "utf8") : undefined;
}

function tagAttribute(html: string, tagPattern: RegExp, attribute: string): string | undefined {
  const tag = html.match(tagPattern)?.[0];
  return tag?.match(new RegExp(`${attribute}=["']([^"']+)["']`, "i"))?.[1];
}

export function verifyBuildArtifact(root: string, basePath: string): string[] {
  const issues: string[] = [];
  const index = read(root, "index.html");
  const privacy = read(root, "privacy.html");
  const sitemap = read(root, "sitemap.xml");
  const robots = read(root, "robots.txt");

  if (!index) {
    issues.push("Missing dist/index.html");
    return issues;
  }

  if (!privacy) {
    issues.push("Missing dist/privacy.html");
  }

  const moduleUrl = tagAttribute(
    index,
    /<script\b(?=[^>]*\btype=["']module["'])[^>]*>/i,
    "src",
  );
  const stylesheetUrl = tagAttribute(
    index,
    /<link\b(?=[^>]*\brel=["']stylesheet["'])[^>]*>/i,
    "href",
  );

  if (!moduleUrl?.startsWith(`${basePath}assets/`)) {
    issues.push(`Module asset URL does not use ${basePath}`);
  }

  if (!stylesheetUrl?.startsWith(`${basePath}assets/`)) {
    issues.push(`Stylesheet asset URL does not use ${basePath}`);
  }

  if (!index.includes(`client=${ADSENSE_CLIENT}`)) {
    issues.push("Built index is missing the AdSense client");
  }

  if (!index.includes('href="privacy.html"')) {
    issues.push("Built index is missing the privacy link");
  }

  if (privacy) {
    if (!privacy.includes(PRIVACY_URL)) {
      issues.push("Built privacy page has the wrong canonical URL");
    }
    if (!privacy.includes("Google AdSense") || !privacy.includes("Cookie")) {
      issues.push("Built privacy page is missing advertising disclosure");
    }
  }

  if (!sitemap?.includes(PRIVACY_URL)) {
    issues.push("Built sitemap is missing the privacy URL");
  }

  if (!robots?.includes("Allow: /jst-225-clock/")) {
    issues.push("Built robots.txt is missing the project allow rule");
  }

  return issues;
}
