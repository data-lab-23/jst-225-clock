# Market Refresh Realism Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add truthful randomized market-refresh effects and more authentic broadcast typography to JST 225 Clock, then deploy the verified result to GitHub Pages.

**Architecture:** A standalone effect controller schedules decorative refresh classes without access to clock data. The clock view mirrors the real rendered time into a CSS-only afterimage attribute, while CSS owns all scanline, glow, sweep, and typography treatments. Existing app lifecycle cleanup owns both the ticker and effect controller.

**Tech Stack:** TypeScript 5.8, framework-free DOM, CSS animations, Vitest 3, jsdom, Vite 7, GitHub Actions and GitHub Pages.

## Global Constraints

- Displayed time, date, weekday, seconds, and zone must never be replaced by fictional values.
- Random refresh interval is 7–16 seconds and refresh duration is approximately 700 milliseconds.
- Do not add sound, continuous large motion, external APIs, or third-party font requests.
- Use local/system heavy square-gothic Japanese and condensed tabular-numeral font stacks.
- `prefers-reduced-motion: reduce` must suppress all nonessential motion.
- Preserve current responsive behavior, settings, full-screen support, contrast protection, and accessibility.

---

## File Structure

- `src/effects/marketRefresh.ts`: randomized scheduling, visibility handling, reduced-motion guard, lifecycle cleanup.
- `src/effects/marketRefresh.test.ts`: deterministic timer and lifecycle tests for the controller.
- `src/ui/clockView.ts`: truthful afterimage value and alternating seconds-tick marker.
- `src/ui/clockView.test.ts`: view contract tests for truthful decorative state.
- `src/main.ts`: start and stop the effect controller with the app.
- `src/main.test.ts`: app lifecycle integration tests for effect cleanup.
- `index.html`: `LIVE` indicator and stable decorative hooks.
- `src/styles.css`: broadcast typography, CRT texture, refresh sweep, afterimage, panel bloom, and reduced-motion overrides.
- `src/styles.test.ts`: CSS contract checks for required visual and accessibility rules.
- `README.md`: document the new visual behavior and reduced-motion fallback.

### Task 1: Randomized Refresh Effect Controller

**Files:**
- Create: `src/effects/marketRefresh.ts`
- Create: `src/effects/marketRefresh.test.ts`

**Interfaces:**
- Produces: `startMarketRefresh(dependencies: MarketRefreshDependencies): () => void`
- Produces: `MIN_REFRESH_DELAY_MS`, `MAX_REFRESH_DELAY_MS`, and `REFRESH_DURATION_MS`
- Consumes: an `HTMLElement` board root, document visibility events, a reduced-motion function, random source, and injectable timer functions.

- [ ] **Step 1: Write failing controller tests**

Create tests using Vitest fake timers that prove:

```ts
const stop = startMarketRefresh({
  root,
  document,
  random: () => 0,
  prefersReducedMotion: () => false,
});

expect(root.classList.contains("is-market-refreshing")).toBe(false);
vi.advanceTimersByTime(MIN_REFRESH_DELAY_MS);
expect(root.classList.contains("is-market-refreshing")).toBe(true);
vi.advanceTimersByTime(REFRESH_DURATION_MS);
expect(root.classList.contains("is-market-refreshing")).toBe(false);
stop();
```

Add independent cases for the maximum delay, repeated scheduling without
overlap, destroy cleanup, hidden/visible lifecycle, and reduced motion.

- [ ] **Step 2: Run the focused tests and verify RED**

Run:

```bash
npm test -- src/effects/marketRefresh.test.ts
```

Expected: FAIL because `startMarketRefresh` and its constants do not exist.

- [ ] **Step 3: Implement the minimal controller**

Implement:

```ts
export const MIN_REFRESH_DELAY_MS = 7_000;
export const MAX_REFRESH_DELAY_MS = 16_000;
export const REFRESH_DURATION_MS = 700;

export interface MarketRefreshDependencies {
  root: HTMLElement;
  document: Pick<Document, "hidden" | "addEventListener" | "removeEventListener">;
  random?: () => number;
  prefersReducedMotion?: () => boolean;
  setTimer?: typeof setTimeout;
  clearTimer?: typeof clearTimeout;
}

export function startMarketRefresh(dependencies: MarketRefreshDependencies): () => void {
  // Schedule one bounded random delay, add the class for 700 ms, remove it,
  // then schedule the next event. Pause on hidden and fully clean up on stop.
}
```

Clamp the random sample to `[0, 1]`, keep separate pending-delay and
pending-cleanup handles, never schedule while hidden or reduced motion is true,
and make the returned cleanup idempotent.

- [ ] **Step 4: Run focused and full tests**

Run:

```bash
npm test -- src/effects/marketRefresh.test.ts
npm test
```

Expected: all controller cases and the existing 68 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/effects/marketRefresh.ts src/effects/marketRefresh.test.ts
git commit -m "feat: schedule truthful market refresh effects"
```

### Task 2: Connect Truthful Decorative State to the Clock

**Files:**
- Modify: `src/ui/clockView.ts`
- Modify: `src/ui/clockView.test.ts`
- Modify: `src/main.ts`
- Modify: `src/main.test.ts`
- Modify: `index.html`

**Interfaces:**
- Consumes: `startMarketRefresh()` from Task 1.
- Produces: `data-ghost-value` on the main time element, containing the same
  string as its text content.
- Produces: `data-tick-parity="even" | "odd"` on the seconds value.
- Produces: `.live-indicator` markup that is decorative and `aria-hidden`.

- [ ] **Step 1: Write failing view and app lifecycle tests**

Extend the view test:

```ts
view.render(snapshot, zone);
expect(time.textContent).toBe("14:35");
expect(time.dataset.ghostValue).toBe("14:35");
expect(seconds.dataset.tickParity).toBe("even");
```

Render a second snapshot with `"43"` and expect `odd`. Extend the app test by
injecting a `startRefresh` spy returning `stopRefresh`, then assert it receives
the board root and that application cleanup invokes `stopRefresh` exactly once.

- [ ] **Step 2: Run focused tests and verify RED**

Run:

```bash
npm test -- src/ui/clockView.test.ts src/main.test.ts
```

Expected: FAIL because the decorative attributes and refresh dependency do not
exist.

- [ ] **Step 3: Implement view, lifecycle, and markup changes**

In `clockView.render()`:

```ts
fields.time.textContent = snapshot.time;
fields.time.dataset.ghostValue = snapshot.time;
fields.seconds.textContent = snapshot.seconds;
fields.seconds.dataset.tickParity =
  Number.parseInt(snapshot.seconds, 10) % 2 === 0 ? "even" : "odd";
```

Add to `AppDependencies`:

```ts
startRefresh?: typeof startMarketRefresh;
```

Resolve `.clock-board`, call the controller after first render, pass the current
document, and invoke its cleanup in the existing returned teardown function.
Add this header element:

```html
<span class="live-indicator" aria-hidden="true"><i></i> LIVE</span>
```

Place it in the title group without changing the accessible clock title.

- [ ] **Step 4: Run focused and full tests**

Run:

```bash
npm test -- src/ui/clockView.test.ts src/main.test.ts
npm test
npm run typecheck
```

Expected: all tests pass and TypeScript reports no errors.

- [ ] **Step 5: Commit**

```bash
git add index.html src/ui/clockView.ts src/ui/clockView.test.ts src/main.ts src/main.test.ts
git commit -m "feat: connect broadcast refresh to clock lifecycle"
```

### Task 3: Broadcast Typography, Texture, and Deployment

**Files:**
- Modify: `src/styles.css`
- Modify: `src/styles.test.ts`
- Modify: `README.md`

**Interfaces:**
- Consumes: `.is-market-refreshing`, `.live-indicator`,
  `[data-ghost-value]`, and `[data-tick-parity]`.
- Produces: system-only typography variables `--font-broadcast-ja` and
  `--font-broadcast-numeric`.
- Produces: static scanline texture plus opt-out motion behavior.

- [ ] **Step 1: Write failing CSS contract tests**

Read `src/styles.css` as text and assert it contains:

```ts
expect(css).toContain("--font-broadcast-ja:");
expect(css).toContain("--font-broadcast-numeric:");
expect(css).toContain(".is-market-refreshing");
expect(css).toContain("content: attr(data-ghost-value)");
expect(css).toContain(".live-indicator");
expect(css).toContain("@media (prefers-reduced-motion: reduce)");
expect(css).toMatch(/\\.is-market-refreshing[\\s\\S]*animation:/);
```

Keep existing responsive and dialog-contract assertions.

- [ ] **Step 2: Run the focused CSS test and verify RED**

Run:

```bash
npm test -- src/styles.test.ts
```

Expected: FAIL because the new typography variables and animation selectors are
absent.

- [ ] **Step 3: Implement the broadcast presentation**

Add the font variables and apply them:

```css
:root {
  --font-broadcast-ja: "Yu Gothic UI", "Yu Gothic",
    "Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif;
  --font-broadcast-numeric: "Arial Narrow", "DIN Alternate",
    "Roboto Condensed", "Helvetica Neue Condensed", Arial, sans-serif;
}
```

Use the Japanese stack at weight `850–900`, proportional Japanese spacing, and
subtle text edging. Use the numeric stack for time and row values with
`font-stretch: condensed`, tabular figures, tightened letter spacing, and a
small horizontal scale only inside value wrappers.

Add:

- fixed low-opacity scanlines on `.clock-panel::after`;
- inset panel borders and edge bloom;
- `LIVE` dot pulse;
- main value `::after` using `content: attr(data-ghost-value)`;
- a 700 ms sweep, afterimage fade, and board bloom driven only by
  `.is-market-refreshing`;
- two equivalent seconds micro-animation names for even/odd parity so each
  change retriggers;
- reduced-motion overrides that remove every new animation and afterimage.

Update README with the truthful visual-only behavior and system-font rationale.

- [ ] **Step 4: Run complete local verification**

Run:

```bash
npm test
npm run typecheck
$env:VITE_BASE_PATH='/jst-225-clock/'; npm run build
git diff --check
```

Expected: all tests pass, type-check passes, Vite builds `dist`, and diff check
reports no errors.

- [ ] **Step 5: Browser QA**

Serve the production build and verify:

- 1920×1080 and 1366×768: no horizontal or vertical overflow; the board remains
  centered and the refresh event is visible.
- 390×844: no horizontal overflow and labels remain readable.
- Settings modal still opens, changes values, and closes.
- A refresh event changes only classes/decorative pixels; time text remains
  truthful.
- Reduced motion suppresses the effect.
- Browser console has no errors.

- [ ] **Step 6: Commit and publish**

```bash
git add src/styles.css src/styles.test.ts README.md
git commit -m "feat: polish clock as live market broadcast"
git push origin main
```

Monitor the GitHub Pages workflow until success, then verify:

`https://data-lab-23.github.io/jst-225-clock/`

