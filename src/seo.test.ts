import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const canonicalUrl = "https://data-lab-23.github.io/jst-225-clock/";
const html = readFileSync(resolve(process.cwd(), "index.html"), "utf8");
const parsed = new DOMParser().parseFromString(html, "text/html");

describe("search discovery metadata", () => {
  it("describes the Japanese clock with one canonical public URL", () => {
    expect(parsed.title).toBe("日本標準時の現在時刻｜秒まで見やすいJSTオンライン時計");
    expect(parsed.querySelector('meta[name="description"]')?.getAttribute("content")).toContain(
      "日本標準時",
    );
    expect(parsed.querySelector('meta[name="robots"]')?.getAttribute("content")).toBe(
      "index,follow",
    );
    expect(parsed.querySelector('link[rel="canonical"]')?.getAttribute("href")).toBe(
      canonicalUrl,
    );
    expect(
      parsed.querySelector('meta[name="google-site-verification"]')?.getAttribute("content"),
    ).toBe("zTMq_D0axaLmHIyprF-6pXTuXlenLS_yZ11rU5hGes0");
  });

  it("uses consistent social preview metadata", () => {
    expect(parsed.querySelector('meta[property="og:type"]')?.getAttribute("content")).toBe(
      "website",
    );
    expect(parsed.querySelector('meta[property="og:url"]')?.getAttribute("content")).toBe(
      canonicalUrl,
    );
    expect(parsed.querySelector('meta[property="og:locale"]')?.getAttribute("content")).toBe(
      "ja_JP",
    );
    expect(parsed.querySelector('meta[name="twitter:card"]')?.getAttribute("content")).toBe(
      "summary",
    );
  });

  it("publishes truthful WebApplication structured data", () => {
    const jsonLd = JSON.parse(
      parsed.querySelector('script[type="application/ld+json"]')?.textContent ?? "null",
    ) as Record<string, unknown> | null;

    expect(jsonLd).not.toBeNull();
    expect(jsonLd?.["@type"]).toBe("WebApplication");
    expect(jsonLd?.url).toBe(canonicalUrl);
    expect(jsonLd?.applicationCategory).toBe("UtilitiesApplication");
    expect(jsonLd?.offers).toMatchObject({
      "@type": "Offer",
      price: "0",
      priceCurrency: "JPY",
    });
    expect(jsonLd).not.toHaveProperty("aggregateRating");
  });
});

describe("crawler entry points", () => {
  it("allows the deployed project path and advertises its sitemap", () => {
    const robotsPath = resolve(process.cwd(), "public/robots.txt");
    expect(existsSync(robotsPath)).toBe(true);

    const robots = readFileSync(robotsPath, "utf8");
    expect(robots).toContain("Allow: /jst-225-clock/");
    expect(robots).toContain(`${canonicalUrl}sitemap.xml`);
  });

  it("lists the canonical clock URL with a deployment date", () => {
    const sitemapPath = resolve(process.cwd(), "public/sitemap.xml");
    expect(existsSync(sitemapPath)).toBe(true);

    const sitemap = readFileSync(sitemapPath, "utf8");
    expect(sitemap).toContain(`<loc>${canonicalUrl}</loc>`);
    expect(sitemap).toContain("<lastmod>2026-07-29</lastmod>");
  });
});
