import { COLORS } from "@/lib/constants/colors";

export default function LeaderboardTeaser() {
  return (
    <div
      style={{
        marginTop: 24,
        background: COLORS.card,
        borderRadius: 20,
        padding: 20,
        border: `1px solid ${COLORS.border}`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 28 }}>🏆</div>
      <div
        style={{
          fontFamily: "'Syne', var(--font-syne), sans-serif",
          fontWeight: 700,
          fontSize: 15,
        }}
      >
        Leaderboard
      </div>
      <div style={{ fontSize: 13, color: COLORS.muted }}>
        Coming soon — compete for the top spot.
      </div>
    </div>
  );
}
