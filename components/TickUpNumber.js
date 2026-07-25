import { useEffect, useRef, useState } from 'react';

// Hallmark · Hum's "streak / counter tick-up" signature move: counts up from
// 0 to `value` once on mount/change (1200ms, snappy ease-out). Skips the
// animation entirely under prefers-reduced-motion, per the genre's rule.
export default function TickUpNumber({ value, suffix = '' }) {
  const [display, setDisplay] = useState(0);
  const prevValue = useRef(0);

  useEffect(() => {
    const reduceMotion = typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      setDisplay(value);
      prevValue.current = value;
      return;
    }

    const from = prevValue.current;
    const to = value;
    if (from === to) return;

    const duration = 1200;
    const start = performance.now();
    const ease = t => 1 - Math.pow(1 - t, 3); // easeOutCubic, close enough to --ease-snap

    let raf;
    const tick = now => {
      const t = Math.min(1, (now - start) / duration);
      setDisplay(Math.round(from + (to - from) * ease(t)));
      if (t < 1) raf = requestAnimationFrame(tick);
      else prevValue.current = to;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return <>{display}{suffix}</>;
}
