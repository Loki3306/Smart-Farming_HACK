import { useEffect, useRef } from "react";

export function useInterval(
  callback: () => void,
  delay: number | null,
  enabled: boolean = true,
) {
  const savedCallback = useRef<() => void>();

  // Remember the latest callback.
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the interval.
  useEffect(() => {
    if (!enabled || delay === null) {
      return;
    }

    const id = setInterval(() => {
      savedCallback.current?.();
    }, delay);

    return () => clearInterval(id);
  }, [delay, enabled]);
}
