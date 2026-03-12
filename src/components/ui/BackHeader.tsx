"use client";

import { COLORS } from "@/lib/constants/colors";

interface BackHeaderProps {
  title: string;
  onBack: () => void;
}

export default function BackHeader({ title, onBack }: BackHeaderProps) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
      <div
        onClick={onBack}
        className="card-hover"
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          background: COLORS.card,
          border: `1px solid ${COLORS.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 16,
          cursor: "pointer",
          flexShrink: 0,
        }}
      >
        ←
      </div>
      <div style={{ fontSize: 13, color: COLORS.muted, fontWeight: 500 }}>{title}</div>
    </div>
  );
}
