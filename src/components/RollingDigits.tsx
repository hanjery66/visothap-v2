"use client";

import useSplashNumber from "@/hooks/use-splash-number";

interface RollingDigitsProps {
  length?: number;
  className?: string;
}

export function RollingDigits({ length = 5, className = "" }: RollingDigitsProps) {
  const digits = useSplashNumber({ length, intervalMs: 80 });
  return (
    <span className={`inline-block tabular-nums select-none ${className}`}>
      {digits}
    </span>
  );
}
