import type { CSSProperties } from "react";

export const fadeUp = (delay = 0): CSSProperties => ({
  animation: `fadeUp 0.5s ease ${delay}ms both`,
});

export const floatAnim = (): CSSProperties => ({
  animation: "float 3s ease-in-out infinite",
});

export const burstAnim = (): CSSProperties => ({
  animation: "burst 0.9s ease forwards",
});

export const pulseAnim = (): CSSProperties => ({
  animation: "pulse 2s infinite",
});
