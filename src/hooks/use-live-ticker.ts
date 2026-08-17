import { useState, useEffect } from "react";
import dayjs from "dayjs";

/**
 * Hook that returns the current time and triggers a re-render every `intervalMs`
 * (default: 1000ms) to ensure live draw animations (empty -> spinner -> splash -> done)
 * progress automatically in real time.
 */
export function useLiveTicker(intervalMs = 1000): dayjs.Dayjs {
  const [now, setNow] = useState(() => dayjs());

  useEffect(() => {
    setNow(dayjs());
    const timerId = setInterval(() => {
      setNow(dayjs());
    }, intervalMs);

    return () => clearInterval(timerId);
  }, [intervalMs]);

  return now;
}

export default useLiveTicker;
