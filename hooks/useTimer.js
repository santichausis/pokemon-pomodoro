import { useState, useEffect, useRef, useCallback } from 'react';

// Countdown timer driven by an absolute deadline, so it stays accurate even
// when the tab is backgrounded (setInterval gets throttled there).
// Calls onComplete(durationSec) once when it reaches zero.
export function useTimer({ initialMinutes = 25, onComplete } = {}) {
  const [totalSec, setTotalSec]   = useState(initialMinutes * 60);
  const [remaining, setRemaining] = useState(initialMinutes * 60);
  const [running, setRunning]     = useState(false);
  const [statusKey, setStatusKey] = useState('ready');
  const [activeDur, setActiveDur] = useState(initialMinutes);

  const intervalRef  = useRef(null);
  const deadlineRef  = useRef(null);
  const remainingRef = useRef(remaining);
  const onCompleteRef = useRef(onComplete);
  remainingRef.current = remaining;
  onCompleteRef.current = onComplete;

  const stop = useCallback(() => {
    clearInterval(intervalRef.current);
    intervalRef.current = null;
  }, []);

  const start = useCallback(() => {
    setRunning(true);
    setStatusKey('focusing');
    deadlineRef.current = Date.now() + remainingRef.current * 1000;
    intervalRef.current = setInterval(() => {
      const rem = Math.max(0, Math.round((deadlineRef.current - Date.now()) / 1000));
      setRemaining(prev => (prev === rem ? prev : rem));
      if (rem <= 0) stop();
    }, 250);
  }, [stop]);

  const pause = useCallback(() => {
    stop();
    setRunning(false);
    setStatusKey('paused');
  }, [stop]);

  const reset = useCallback(() => {
    stop();
    setRunning(false);
    setRemaining(totalSec);
    setStatusKey('ready');
  }, [stop, totalSec]);

  const applyDuration = useCallback((min, label) => {
    stop();
    setRunning(false);
    setActiveDur(label ?? min);
    setTotalSec(min * 60);
    setRemaining(min * 60);
    setStatusKey('ready');
  }, [stop]);

  // Fire completion exactly once when the countdown hits zero
  useEffect(() => {
    if (remaining === 0 && running) {
      setRunning(false);
      setStatusKey('done');
      onCompleteRef.current?.(totalSec);
    }
  }, [remaining, running, totalSec]);

  // Clean up on unmount
  useEffect(() => () => stop(), [stop]);

  // Warn before closing/navigating away while a focus session is running,
  // so progress isn't lost by an accidental tab close.
  useEffect(() => {
    if (!running) return;
    const handler = e => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [running]);

  const timerState =
    statusKey === 'done' ? 'done'
    : running && remaining <= 60 ? 'warning'
    : running ? 'focusing'
    : 'idle';

  return {
    totalSec, remaining, running, statusKey, activeDur, timerState,
    start, pause, reset, applyDuration,
  };
}
