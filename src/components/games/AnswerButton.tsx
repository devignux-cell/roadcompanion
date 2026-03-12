"use client";

import { COLORS } from "@/lib/constants/colors";

interface AnswerButtonProps {
  answer: string;
  index: number;
  answered: number | null;
  isCorrect: boolean;
  isSelected: boolean;
  onClick: () => void;
}

const LETTERS = ["A", "B", "C", "D"] as const;

export default function AnswerButton({
  answer,
  index,
  answered,
  isCorrect,
  isSelected,
  onClick,
}: AnswerButtonProps) {
  let bg: string = COLORS.card;
  let border: string = COLORS.border;
  let textColor: string = COLORS.text;
  let badgeBg: string = COLORS.bg;
  let badgeColor: string = COLORS.muted;

  if (answered !== null) {
    if (isCorrect) {
      bg = "rgba(45,255,199,0.15)";
      border = COLORS.teal;
      textColor = COLORS.teal;
      badgeBg = COLORS.teal + "30";
      badgeColor = COLORS.teal;
    } else if (isSelected) {
      bg = "rgba(255,68,68,0.15)";
      border = "#FF4444";
      textColor = "#FF4444";
    }
  }

  return (
    <div
      className="card-hover"
      onClick={onClick}
      style={{
        background: bg,
        border: `1px solid ${border}`,
        borderRadius: 16,
        padding: "16px 20px",
        fontSize: 15,
        color: textColor,
        transition: "all 0.25s ease",
        display: "flex",
        alignItems: "center",
        gap: 12,
        animation: `fadeUp 0.3s ease ${index * 60}ms both`,
        cursor: answered !== null ? "default" : "pointer",
      }}
    >
      <span
        style={{
          width: 28,
          height: 28,
          borderRadius: "50%",
          background: badgeBg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 12,
          fontWeight: 700,
          flexShrink: 0,
          color: badgeColor,
        }}
      >
        {LETTERS[index]}
      </span>
      <span style={{ flex: 1 }}>{answer}</span>
      {answered !== null && isCorrect && <span style={{ marginLeft: "auto" }}>✓</span>}
      {answered !== null && isSelected && !isCorrect && <span style={{ marginLeft: "auto" }}>✗</span>}
    </div>
  );
}
