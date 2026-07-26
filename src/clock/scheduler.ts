export function startAlignedTicker(onTick: (date: Date) => void): () => void {
  let stopped = false;
  let timeout: ReturnType<typeof setTimeout> | undefined;

  const scheduleNext = () => {
    const delay = 1000 - (Date.now() % 1000) + 5;
    timeout = setTimeout(() => {
      if (stopped) return;

      onTick(new Date());
      scheduleNext();
    }, delay);
  };

  onTick(new Date());
  scheduleNext();

  return () => {
    stopped = true;
    if (timeout !== undefined) clearTimeout(timeout);
  };
}
