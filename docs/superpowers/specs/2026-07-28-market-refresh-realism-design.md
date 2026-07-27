# Market Refresh Realism Design

## Summary

Enhance JST 225 Clock so it feels like a live Japanese television market
graphic. The chosen direction is **A: Broadcast Realism**. The clock remains
accurate at all times; periodic visual refresh events add a short market-board
flash, a same-value afterimage, a scanning highlight, and restrained broadcast
texture without ever substituting fictional digits.

The update also tightens the typography. Japanese text uses a heavy square
gothic stack, while time and data values use condensed broadcast-style sans
serif faces with tabular figures. All fonts are local/system fonts so the Pages
site remains fast, private, and functional without a third-party font service.

## Approved Experience

- Preserve the current blue panel, black header, white main-value field, red
  date row, bilingual labels, and responsive information hierarchy.
- Add a small `LIVE` indicator to the header.
- Add subtle CRT scanlines, panel edge bloom, inset highlights, and restrained
  text edging.
- Keep seconds ticking normally with a very small per-second response.
- At randomized intervals, run a short broadcast refresh event:
  1. a highlight sweeps across the main value field;
  2. the main value emits a faint afterimage containing the exact same time;
  3. the field and panel briefly bloom;
  4. the effect settles cleanly within roughly 700 milliseconds.
- Random refresh timing must not alter time, date, weekday, seconds, or zone
  text.
- Do not add glitching, false digits, large layout movement, sound, or
  continuous high-intensity animation.

## Typography

Use two explicit font roles:

- **Japanese and interface text:** `"Yu Gothic UI"`, `"Yu Gothic"`,
  `"Hiragino Kaku Gothic ProN"`, `"Noto Sans JP"`, sans-serif, with weights
  from 800 to 900 and proportional Japanese spacing where supported.
- **Time and data values:** `"Arial Narrow"`, `"DIN Alternate"`,
  `"Roboto Condensed"`, `"Helvetica Neue Condensed"`, `"Arial"`, sans-serif,
  with tabular figures, a condensed stretch request, and subtle horizontal
  scaling where needed.

This is a visual match to the supplied broadcast reference, not a claim that a
specific proprietary broadcaster font is embedded.

## Components

### Refresh effect controller

A small controller owns randomized scheduling and effect lifecycle:

- receives the board root, document visibility source, random number source,
  and timer functions through injectable dependencies;
- schedules the next event within a bounded interval;
- adds one transient refresh class and removes it after the effect duration;
- cancels timers when destroyed;
- pauses while the page is hidden and schedules a fresh interval when visible;
- does nothing when reduced motion is requested.

The controller has no access to clock formatting and cannot change displayed
values.

### Clock view

The view continues updating text fields. Before each main-time update it stores
the same rendered value in a `data-ghost-value` attribute. CSS uses that
attribute for the afterimage, guaranteeing that the effect can only mirror the
real displayed time.

### Presentation

CSS owns scanlines, highlights, bloom, value afterimage, live-dot pulse, and
per-second micro-response. Animations use compositor-friendly opacity and
transform properties where practical. Motion rules have static equivalents
under `prefers-reduced-motion`.

## Data Flow

1. The clock renders a fresh system `Date` on the aligned second tick.
2. The view writes the real `HH:mm` value to both text content and its
   afterimage data attribute.
3. The independent effect controller chooses a delay within its allowed range.
4. At the deadline it adds the refresh class without touching clock data.
5. CSS plays the short effect and the controller removes the class.
6. The next randomized delay is scheduled.
7. Visibility changes, teardown, or reduced-motion preference cancel or prevent
   nonessential animation.

## Timing

- Random refresh interval: 7–16 seconds.
- Broadcast refresh duration: about 700 milliseconds.
- Live indicator: slow, low-amplitude pulse.
- Seconds row: a brief low-amplitude luminance response on each value change.

The randomized interval avoids a mechanical loop while remaining frequent
enough to be noticed during television or desktop display.

## Accessibility and Failure Handling

- The displayed time never depends on animation.
- `prefers-reduced-motion: reduce` removes scan sweeps, afterimages, pulses, and
  per-second movement.
- Transient effects are `aria-hidden` CSS decoration and produce no live-region
  announcements.
- If scheduling fails or the controller is unavailable, the clock continues
  normally.
- Existing color contrast protection, keyboard settings, full-screen behavior,
  and responsive layout remain unchanged.

## Testing

- Controller schedules within the configured interval bounds.
- Refresh class is added and removed for one event.
- Repeated events reschedule without overlapping.
- Destroy cancels pending start and cleanup timers.
- Hidden documents pause effects; visible documents resume them.
- Reduced motion prevents scheduling.
- Clock view mirrors the real time into the afterimage attribute.
- Existing 68 tests continue to pass.
- Type-check and Pages-path production build succeed.
- Browser QA covers 1920×1080, 1366×768, and 390×844, settings, overflow,
  reduced motion, and a visible refresh event.

## Deployment

Commit the implementation to `main`, push to
`data-lab-23/jst-225-clock`, monitor the existing GitHub Pages workflow, and
verify the production URL after deployment:

`https://data-lab-23.github.io/jst-225-clock/`

## Success Criteria

- The screen reads as a live television market graphic rather than a generic
  dashboard.
- Typography is visibly heavier, narrower, and closer to the reference.
- Random refresh events are noticeable but do not distract from reading.
- Every visible digit remains truthful throughout every effect.
- Reduced-motion users receive a stable, fully usable clock.
- Tests, type-check, production build, GitHub Actions, and production browser
  verification all pass.
