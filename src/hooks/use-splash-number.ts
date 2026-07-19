import { useEffect, useState, useRef } from "react";

interface UseRollingDigitsOptions {
  length?: number;
  intervalMs?: number;
  active?: boolean; // allows pausing/stopping the roll (e.g. once a real value arrives)
}

function useSplashNumber({
  length = 5,
  intervalMs = 80,
  active = true,
}: UseRollingDigitsOptions = {}) {
  const [digits, setDigits] = useState(() =>
    Array.from({ length }, () => Math.floor(Math.random() * 10)).join("")
  );
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!active) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      setDigits(
        Array.from({ length }, () => Math.floor(Math.random() * 10)).join("")
      );
    }, intervalMs);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [length, intervalMs, active]);

  return digits;
}

export default useSplashNumber;