"use client";

import { COLORS } from "@/lib/constants/colors";

interface QuestionTimerProps {
  remainingSeconds: number;
  totalSeconds: number;
  isPaused: boolean;
}

export default function QuestionTimer({
  remainingSeconds,
  totalSeconds,
  isPaused,
}: QuestionTimerProps) {
  const percent = Math.max(0, Math.min(100, (remainingSeconds / totalSeconds) * 100));

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 280,
        margin: "0 auto",
      }}
    >
      <div
        style={{
          height: 3,
          background: COLORS.border,
          borderRadius: 100,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${percent}%`,
            background: remainingSeconds <= 3 ? COLORS.accent : COLORS.teal,
            borderRadius: 100,
            transition: isPaused ? "none" : "width 1s linear",
          }}
        />
      </div>
      <div
        style={{
          fontSize: 11,
          color: COLORS.muted,
          marginTop: 4,
          textAlign: "center",
        }}
      >
        {remainingSeconds}s
      </div>
    </div>
  );
}
