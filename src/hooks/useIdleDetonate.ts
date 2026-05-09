import { useEffect } from 'react';

const IDLE_LIMIT_S = 60;
const IDLE_EVENTS = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'] as const;

/**
 * useIdleDetonate
 * 
 * Triggers detonation after IDLE_LIMIT_S seconds of user inactivity.
 * Disabled during loading, detonation, or contact screen.
 */
export function useIdleDetonate(
  detonate: () => void,
  disabled: boolean,
) {
  useEffect(() => {
    if (disabled) return;

    let idleTime = 0;

    const resetTimer = () => { idleTime = 0; };

    IDLE_EVENTS.forEach(evt => window.addEventListener(evt, resetTimer));

    const checkId = setInterval(() => {
      idleTime++;
      if (idleTime >= IDLE_LIMIT_S) {
        detonate();
        clearInterval(checkId);
      }
    }, 1_000);

    return () => {
      IDLE_EVENTS.forEach(evt => window.removeEventListener(evt, resetTimer));
      clearInterval(checkId);
    };
  }, [detonate, disabled]);
}
