import { useEffect, useRef, useState } from 'react';

const PREFIX = 'boardease:v1:';

function readStored(key) {
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    return raw === null ? undefined : JSON.parse(raw);
  } catch {
    return undefined;
  }
}

/* useState that is saved to localStorage under `boardease:v1:<key>` and restored on reload.
   Other open tabs pick up changes too, so a boarder tab and an owner tab stay in sync.
   `revive` can rebuild values JSON cannot hold (e.g. functions in the sample data). */
export default function usePersistentState(key, initialValue, revive) {
  const [value, setValue] = useState(() => {
    const stored = readStored(key);
    if (stored === undefined) return initialValue;
    return revive ? revive(stored) : stored;
  });

  const reviveRef = useRef(revive);
  reviveRef.current = revive;

  useEffect(() => {
    const onStorage = (event) => {
      if (event.key !== PREFIX + key || event.newValue === null) return;
      try {
        const stored = JSON.parse(event.newValue);
        setValue(reviveRef.current ? reviveRef.current(stored) : stored);
      } catch {
        // Ignore values another tab wrote in an unexpected format.
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [key]);

  useEffect(() => {
    try {
      window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch (error) {
      // Storage can be full (large photos), disabled, or blocked in private browsing; the app keeps working in memory.
      console.warn(`Could not save "${key}" to localStorage.`, error);
    }
  }, [key, value]);

  return [value, setValue];
}
