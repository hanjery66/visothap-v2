"use client";

import React from "react";

interface DigitSpinnerProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  strokeWidth?: number | string;
  /**
   * "trail": progressive fading tail behind the leading strong spoke (like iOS radar spinner)
   * "single": exactly 1 strong spoke and 7 flat/faint spokes
   */
  variant?: "trail" | "single";
  /**
   * Spin animation duration, e.g. "0.5s" (default: "0.5s")
   */
  duration?: string;
}

export function DigitSpinner({
  className = "h-2.5 w-2.5 sm:h-3.5 sm:w-3.5 text-muted-foreground/70",
  strokeWidth = 2.5,
  variant = "trail",
  duration = "0.7s",
  style,
  ...props
}: DigitSpinnerProps) {
  // Spoke angles in clockwise order starting from 12 o'clock:
  // [0°, 45°, 90°, 135°, 180°, 225°, 270°, 315°]
  // In a clockwise spin, 315° trails behind 0°, so opacities decrease counter-clockwise:
  const opacities =
    variant === "trail"
      ? [1.0, 0.12, 0.18, 0.28, 0.4, 0.55, 0.7, 0.85] // [0°, 45°, 90°, 135°, 180°, 225°, 270°, 315°]
      : [1.0, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2];

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`animate-spin shrink-0 ${className}`}
      style={{ animationDuration: duration, ...style }}
      {...props}
    >
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, index) => (
        <line
          key={angle}
          x1="12"
          y1="2.5"
          x2="12"
          y2="6.5"
          transform={`rotate(${angle} 12 12)`}
          opacity={opacities[index]}
        />
      ))}
    </svg>
  );
}
