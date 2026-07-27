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

function boundedSample(random: () => number): number {
  const sample = random();
  if (!Number.isFinite(sample)) return 0;

  return Math.min(1, Math.max(0, sample));
}

export function startMarketRefresh(dependencies: MarketRefreshDependencies): () => void {
  const {
    root,
    document: appDocument,
    random = Math.random,
    prefersReducedMotion = () => typeof window.matchMedia === "function"
      && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    setTimer = setTimeout,
    clearTimer = clearTimeout,
  } = dependencies;
  let active = true;
  let delayTimer: ReturnType<typeof setTimeout> | undefined;
  let cleanupTimer: ReturnType<typeof setTimeout> | undefined;

  const clearTimers = () => {
    if (delayTimer !== undefined) clearTimer(delayTimer);
    if (cleanupTimer !== undefined) clearTimer(cleanupTimer);
    delayTimer = undefined;
    cleanupTimer = undefined;
  };

  const schedule = () => {
    if (!active || appDocument.hidden || prefersReducedMotion()) return;

    const delay = MIN_REFRESH_DELAY_MS
      + Math.round((MAX_REFRESH_DELAY_MS - MIN_REFRESH_DELAY_MS) * boundedSample(random));
    delayTimer = setTimer(() => {
      delayTimer = undefined;
      if (!active || appDocument.hidden || prefersReducedMotion()) return;

      root.classList.add("is-market-refreshing");
      cleanupTimer = setTimer(() => {
        cleanupTimer = undefined;
        root.classList.remove("is-market-refreshing");
        schedule();
      }, REFRESH_DURATION_MS);
    }, delay);
  };

  const handleVisibilityChange = () => {
    clearTimers();
    root.classList.remove("is-market-refreshing");
    schedule();
  };

  appDocument.addEventListener("visibilitychange", handleVisibilityChange);
  schedule();

  return () => {
    if (!active) return;
    active = false;
    clearTimers();
    root.classList.remove("is-market-refreshing");
    appDocument.removeEventListener("visibilitychange", handleVisibilityChange);
  };
}
