"use client";

import useSplashNumber from "@/hooks/use-splash-number";

interface RollingDigitsProps {
  length?: number;
  className?: string;
}

export function RollingDigits({ length = 5, className = "" }: RollingDigitsProps) {
  const digits = useSplashNumber({ length, intervalMs: 80 });
  return (
    <span className={`inline-block font-mono tracking-wider select-none animate-pulse ${className}`}>
      {digits}
    </span>
  );
}
