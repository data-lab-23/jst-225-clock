# JST 225 Clock Search Discovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make JST 225 Clock indexable and understandable for Japanese searches while preserving the clock-first experience.

**Architecture:** Keep one static Vite entry page so crawlers receive the important copy and metadata without JavaScript. Split the layout into a full-viewport clock stage followed by a semantic information section, and serve crawl-control files unchanged from `public/`.

**Tech Stack:** HTML5, CSS, TypeScript, Vite 7, Vitest 3, GitHub Pages

## Global Constraints

- Prioritize Japanese queries: `日本標準時 時計`, `現在時刻 日本`, `JST 時計`, and `全画面 時計`.
- Preserve the existing clock, settings, timezone detection, fullscreen control, and visual refresh effect.
- Describe the design as `株価ボード風` or `テレビの市況画面を思わせるデザイン`; do not imply an official affiliation.
- Do not claim search ranking, traffic, ratings, reviews, download counts, or financial data.
- Canonical URL is exactly `https://data-lab-23.github.io/jst-225-clock/`.
- Do not add analytics, advertising, external fonts, or runtime dependencies.

---

### Task 1: Search Metadata and Crawler Files

**Files:**
- Create: `src/seo.test.ts`
- Create: `public/robots.txt`
- Create: `public/sitemap.xml`
- Modify: `index.html`

**Interfaces:**
- Consumes: Vite copies `public/*` to the build root.
- Produces: Static metadata, JSON-LD, `robots.txt`, and `sitemap.xml` available in the GitHub Pages artifact.

- [ ] **Step 1: Write failing metadata and crawler tests**

Create `src/seo.test.ts` with assertions that:

```ts
const html = readFileSync(resolve(process.cwd(), "index.html"), "utf8");
const parsed = new DOMParser().parseFromString(html, "text/html");

expect(parsed.title).toBe("日本標準時の現在時刻｜秒まで見やすいJSTオンライン時計");
expect(parsed.querySelector('meta[name="description"]')?.getAttribute("content")).toContain("日本標準時");
expect(parsed.querySelector('link[rel="canonical"]')?.getAttribute("href"))
  .toBe("https://data-lab-23.github.io/jst-225-clock/");
expect(parsed.querySelector('meta[property="og:url"]')?.getAttribute("content"))
  .toBe("https://data-lab-23.github.io/jst-225-clock/");

const jsonLd = JSON.parse(
  parsed.querySelector('script[type="application/ld+json"]')?.textContent ?? "null",
);
expect(jsonLd["@type"]).toBe("WebApplication");
expect(jsonLd.offers.price).toBe("0");

const robots = readFileSync(resolve(process.cwd(), "public/robots.txt"), "utf8");
expect(robots).toContain("Allow: /jst-225-clock/");
expect(robots).toContain("Sitemap: https://data-lab-23.github.io/jst-225-clock/sitemap.xml");

const sitemap = readFileSync(resolve(process.cwd(), "public/sitemap.xml"), "utf8");
expect(sitemap).toContain("<loc>https://data-lab-23.github.io/jst-225-clock/</loc>");
expect(sitemap).toContain("<lastmod>2026-07-29</lastmod>");
```

- [ ] **Step 2: Run the test and verify the missing SEO assets fail**

Run: `npm test -- src/seo.test.ts`

Expected: FAIL because the existing title differs and `public/robots.txt` does not exist.

- [ ] **Step 3: Add metadata and truthful WebApplication JSON-LD**

Update `index.html` head with UTF-8 Japanese title and description, `robots=index,follow`, canonical, Open Graph, Twitter Card, and JSON-LD. Use:

```json
{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "JST 225 Clock",
  "alternateName": "日本標準時の現在時刻",
  "url": "https://data-lab-23.github.io/jst-225-clock/",
  "description": "日本標準時の現在時刻を24時間表記・秒単位で確認できる無料のオンライン時計です。",
  "applicationCategory": "UtilitiesApplication",
  "operatingSystem": "Any",
  "browserRequirements": "JavaScript enabled",
  "inLanguage": ["ja", "en"],
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "JPY"
  }
}
```

- [ ] **Step 4: Add crawl-control files**

Create `public/robots.txt`:

```text
User-agent: *
Allow: /jst-225-clock/

Sitemap: https://data-lab-23.github.io/jst-225-clock/sitemap.xml
```

Create `public/sitemap.xml` with one canonical URL, `<lastmod>2026-07-29</lastmod>`, and `<changefreq>monthly</changefreq>`.

- [ ] **Step 5: Run focused tests**

Run: `npm test -- src/seo.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add index.html public/robots.txt public/sitemap.xml src/seo.test.ts
git commit -m "feat: add search discovery metadata"
```

---

### Task 2: Searchable Information Section

**Files:**
- Modify: `index.html`
- Modify: `src/smoke.test.ts`

**Interfaces:**
- Consumes: Existing `main#app`, clock board, settings dialog, and clock-field hooks.
- Produces: Static, semantic Japanese content under `.clock-guide` without changing the seven dynamic clock fields.

- [ ] **Step 1: Write failing semantic-content tests**

Extend `src/smoke.test.ts` to assert:

```ts
expect(parsed.querySelector(".clock-stage .clock-board")).not.toBeNull();
expect(parsed.querySelector(".clock-guide h2")?.textContent).toContain("日本標準時");
expect(parsed.querySelectorAll(".clock-guide article")).toHaveLength(4);
expect(parsed.querySelector(".clock-guide [lang='en']")?.textContent).toContain("Japan Standard Time");
expect(parsed.querySelector(".clock-guide__disclaimer")?.textContent).toContain("株価情報");
expect(parsed.querySelectorAll("[data-clock-field]")).toHaveLength(7);
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `npm test -- src/smoke.test.ts`

Expected: FAIL because `.clock-stage` and `.clock-guide` do not exist.

- [ ] **Step 3: Add the clock stage and semantic guide**

Wrap the clock presentation in `.clock-stage`. Add `.clock-guide` after it with:

- introductory heading and paragraph,
- feature article,
- JST/UTC+9 explanation article,
- device/fullscreen usage article,
- FAQ article using visible `<details>` elements,
- a concise English paragraph,
- disclaimer: independent clock app, no stock prices or financial information.

Keep the settings dialog and status inside `#app`, and keep every existing ID and `data-clock-field` hook unchanged.

- [ ] **Step 4: Run focused application tests**

Run: `npm test -- src/smoke.test.ts src/main.test.ts src/ui/settingsDialog.test.ts`

Expected: PASS, including exactly seven clock fields and existing fullscreen behavior.

- [ ] **Step 5: Commit**

```bash
git add index.html src/smoke.test.ts
git commit -m "feat: add searchable clock guide"
```

---

### Task 3: Clock-First Responsive Presentation

**Files:**
- Modify: `src/styles.css`
- Modify: `src/styles.test.ts`

**Interfaces:**
- Consumes: `.clock-stage`, `.clock-guide`, `.clock-guide__grid`, `.clock-guide__faq`, and `.clock-guide__disclaimer`.
- Produces: A full-viewport first stage and responsive content section; fullscreen hides guide content through `:fullscreen`.

- [ ] **Step 1: Write failing CSS contract tests**

Extend `src/styles.test.ts` to assert:

```ts
expect(rule("#app")).toMatch(/background:/);
expect(rule(".clock-stage")).toMatch(/min-height:\s*100dvh/);
expect(rule(".clock-stage")).toMatch(/place-items:\s*center/);
expect(rule(".clock-guide")).toMatch(/inline-size:\s*min\(100%,\s*72rem\)/);
expect(styles).toMatch(/@media \(min-width: 761px\)[\s\S]*?\.clock-guide__grid/);
expect(styles).toMatch(/:fullscreen[\s\S]*?\.clock-guide[\s\S]*?display:\s*none/);
```

Update the existing short-height contract to target `.clock-stage` instead of `#app`.

- [ ] **Step 2: Run the CSS test and verify it fails**

Run: `npm test -- src/styles.test.ts`

Expected: FAIL because `.clock-stage` and `.clock-guide` have no rules.

- [ ] **Step 3: Implement the page and guide styles**

Change `#app` to a block page container with the existing dark background. Move the full-viewport grid, centering, and safe-area padding to `.clock-stage`. Style `.clock-guide` with the existing navy, blue, white, and red palette; readable line length; accessible links and details controls; one-column mobile layout; and multi-column layout at `min-width: 761px`.

Add:

```css
:fullscreen .clock-guide { display: none; }
:fullscreen .clock-stage { min-height: 100dvh; }
```

Update short-height media queries so only `.clock-stage` receives compact vertical padding.

- [ ] **Step 4: Run focused and full tests**

Run: `npm test -- src/styles.test.ts`

Expected: PASS.

Run: `npm test`

Expected: all test files pass.

- [ ] **Step 5: Commit**

```bash
git add src/styles.css src/styles.test.ts
git commit -m "feat: style clock-first search content"
```

---

### Task 4: Documentation, Production Build, and Publication

**Files:**
- Modify: `README.md`
- Verify: `dist/index.html`
- Verify: `dist/robots.txt`
- Verify: `dist/sitemap.xml`

**Interfaces:**
- Consumes: Tasks 1–3 and the existing GitHub Pages workflow.
- Produces: Pushed `main` commit and verified public URLs.

- [ ] **Step 1: Document search-discovery behavior**

Update the README to describe the below-the-fold guide, metadata, structured data, sitemap URL, and the manual Search Console registration step without promising ranking.

- [ ] **Step 2: Run final local verification**

Run:

```powershell
npm.cmd test
npm.cmd run typecheck
$env:VITE_BASE_PATH='/jst-225-clock/'; npm.cmd run build
git -c safe.directory='*' diff --check
```

Expected: all tests pass, typecheck exits 0, Vite build succeeds, and `diff --check` prints no errors.

- [ ] **Step 3: Verify built SEO artifacts**

Run tests or read the build output to verify:

- `dist/index.html` contains the canonical URL and visible guide text,
- `dist/robots.txt` contains the sitemap URL,
- `dist/sitemap.xml` contains the canonical URL,
- asset URLs begin with `/jst-225-clock/`.

- [ ] **Step 4: Commit documentation**

```bash
git add README.md
git commit -m "docs: explain search discovery setup"
```

- [ ] **Step 5: Push and wait for GitHub Pages**

Run: `git push origin main`

Watch the deployment workflow until success. Confirm that the deployed commit equals local `HEAD`.

- [ ] **Step 6: Browser verification**

At `https://data-lab-23.github.io/jst-225-clock/`, verify:

- 1920×1080 and 1366×768 show the clock first,
- 390×844 shows the guide after scrolling,
- settings and fullscreen still work,
- `/robots.txt` and `/sitemap.xml` return 200,
- title, canonical, JSON-LD, and visible guide text are present,
- no browser console errors occur.

- [ ] **Step 7: Report the Search Console follow-up**

Provide the exact sitemap URL:

`https://data-lab-23.github.io/jst-225-clock/sitemap.xml`

State that Search Console verification and indexing requests require access to the owner's Google account and do not guarantee rankings.
