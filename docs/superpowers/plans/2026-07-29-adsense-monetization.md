# AdSense Monetization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prepare JST 225 Clock for Google AdSense review and publish a policy-compliant, clock-first advertising integration.

**Architecture:** Add the publisher verification script, a below-the-fold reserved ad container, and a static privacy page to the existing Vite app. Publish a small root-domain companion site so AdSense can crawl `data-lab-23.github.io`, while keeping the clock at its existing project URL.

**Tech Stack:** Vite 7, TypeScript 5.8, Vitest 3, static HTML/CSS, GitHub Pages, Google AdSense.

## Global Constraints

- Publisher ID: `pub-6402260099646942`; client ID: `ca-pub-6402260099646942`.
- Keep `https://data-lab-23.github.io/jst-225-clock/` unchanged.
- No advertising in the clock stage or fullscreen mode.
- Do not invent an AdSense ad-slot ID or an `ads.txt` record.
- Use Google’s certified CMP rather than a custom consent implementation.
- Preserve the existing settings, timezone, clock, and market-refresh behavior.

---

### Task 1: AdSense metadata and disclosure

**Files:**
- Modify: `index.html`
- Modify: `src/seo.test.ts`

**Interfaces:**
- Consumes: the static document parsed by `src/seo.test.ts`.
- Produces: one AdSense loader for client `ca-pub-6402260099646942`, one labeled `.ad-placement`, and links to `privacy.html`.

- [ ] **Step 1: Write the failing tests**

Add assertions that the AdSense script has `async`, the exact `client` query value, and `crossorigin="anonymous"`. Assert that `.ad-placement` is inside `.clock-guide`, outside `.clock-stage`, contains the visible label `広告`, and links to `privacy.html`.

- [ ] **Step 2: Run the focused tests and verify RED**

Run: `npm.cmd test -- src/seo.test.ts`

Expected: FAIL because the AdSense script, disclosure region, and privacy link do not exist.

- [ ] **Step 3: Implement the static markup**

Add this loader in `<head>`:

```html
<script
  async
  src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6402260099646942"
  crossorigin="anonymous"
></script>
```

Add a labeled `.ad-placement` between the guide’s feature grid content and FAQ content. Keep it free of `<ins class="adsbygoogle">` until a real slot ID exists. Add footer links to `privacy.html` and the public GitHub repository.

- [ ] **Step 4: Run the focused tests and verify GREEN**

Run: `npm.cmd test -- src/seo.test.ts`

Expected: PASS.

### Task 2: Privacy page and crawler discovery

**Files:**
- Create: `privacy.html`
- Modify: `public/sitemap.xml`
- Modify: `src/seo.test.ts`

**Interfaces:**
- Consumes: the canonical clock URL and publisher disclosure requirements.
- Produces: `https://data-lab-23.github.io/jst-225-clock/privacy.html` and a sitemap entry for it.

- [ ] **Step 1: Write the failing tests**

Assert that `privacy.html` exists, has a canonical URL, explains Google advertising cookies and personalized/non-personalized advertising, links to Google’s ad-settings and privacy resources, identifies the site operator as `data-lab-23`, and links back to the clock. Assert that the sitemap lists the privacy URL.

- [ ] **Step 2: Run the focused tests and verify RED**

Run: `npm.cmd test -- src/seo.test.ts`

Expected: FAIL because `privacy.html` and its sitemap entry are missing.

- [ ] **Step 3: Create the privacy page**

Create a standalone responsive Japanese privacy policy with sections for collected information, AdSense and cookies, consent choices, access analysis, external links, operator/contact, updates, and effective date. Use only public repository contact information and do not expose private contact data.

- [ ] **Step 4: Update the sitemap and verify GREEN**

Run: `npm.cmd test -- src/seo.test.ts`

Expected: PASS.

### Task 3: Advertising layout and fullscreen guard

**Files:**
- Modify: `src/styles.css`
- Modify: `src/styles.test.ts`

**Interfaces:**
- Consumes: `.ad-placement` from Task 1.
- Produces: a clearly separated responsive ad region that reserves space below the fold and is hidden in fullscreen.

- [ ] **Step 1: Write the failing tests**

Assert that `.ad-placement` is visually separated, its label has a distinct subdued style, and `:fullscreen .ad-placement` is `display: none`.

- [ ] **Step 2: Run the focused tests and verify RED**

Run: `npm.cmd test -- src/styles.test.ts`

Expected: FAIL because the advertising rules are missing.

- [ ] **Step 3: Implement the CSS**

Use a bordered dark panel, centered content, a bounded `min-block-size`, and `contain: layout paint`. Ensure the advertising label remains readable and the placement collapses cleanly on narrow screens.

- [ ] **Step 4: Run the focused tests and verify GREEN**

Run: `npm.cmd test -- src/styles.test.ts`

Expected: PASS.

### Task 4: Documentation and root-domain companion

**Files:**
- Modify: `README.md`
- Create in sibling repository: `data-lab-23.github.io/index.html`
- Create in sibling repository: `data-lab-23.github.io/privacy.html`
- Create in sibling repository: `data-lab-23.github.io/.nojekyll`

**Interfaces:**
- Consumes: the clock and privacy URLs from Tasks 1–2.
- Produces: an HTTP 200 root domain with original site description and prominent links to the clock and privacy policy.

- [ ] **Step 1: Document the review workflow**

Document the publisher ID, manual ad-unit policy, CMP configuration, prohibition on self-clicking, and the post-approval steps for a real slot ID and `ads.txt`.

- [ ] **Step 2: Build the root companion**

Create a dependency-free static page titled `data-lab-23 Web Tools`, explaining the clock’s purpose and linking to the clock, privacy policy, and GitHub profile. Include responsive CSS inline and an AdSense publisher loader for domain verification.

- [ ] **Step 3: Publish the root repository**

Create or update the public GitHub repository `data-lab-23/data-lab-23.github.io`, commit the static files, and push `main`.

- [ ] **Step 4: Verify the root deployment**

Run an HTTP request to `https://data-lab-23.github.io/`.

Expected: HTTP 200 with a link to `/jst-225-clock/`.

### Task 5: Release and AdSense review submission

**Files:**
- All modified project files.

**Interfaces:**
- Consumes: Tasks 1–4 and the AdSense onboarding account.
- Produces: a verified GitHub Pages deployment and an AdSense site-review request.

- [ ] **Step 1: Run the complete local verification**

Run:

```powershell
npm.cmd test
npm.cmd run typecheck
$env:VITE_BASE_PATH='/jst-225-clock/'; npm.cmd run build
```

Expected: all tests pass, typecheck exits 0, and the production build exits 0.

- [ ] **Step 2: Commit and push the clock app**

Commit only the planned files with a monetization-specific message and push `main` to `origin`.

- [ ] **Step 3: Verify GitHub Pages**

Wait for the Pages workflow to finish, then check the clock URL and privacy URL for HTTP 200 and verify the AdSense client appears in the deployed HTML.

- [ ] **Step 4: Configure AdSense onboarding**

In AdSense, link the site, choose the Google-certified CMP for EEA/UK/Switzerland, verify the publisher code, and request review. Do not enable overlay formats or create a guessed manual slot.

- [ ] **Step 5: Record the pending approval boundary**

Report the submitted review state. State explicitly that real ad delivery, a manual slot ID, and the exact `ads.txt` line remain pending Google approval.
