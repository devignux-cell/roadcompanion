import { COLORS } from "@/lib/constants/colors";

const LEADERS: [string, number, string][] = [
  ["TampaKing", 1840, COLORS.gold],
  ["SunshineQuiz", 1620, COLORS.muted],
  ["BayCityRider", 1400, "#CD7F32"],
];

export default function LeaderboardTeaser() {
  return (
    <div
      style={{
        marginTop: 24,
        background: COLORS.card,
        borderRadius: 20,
        padding: 20,
        border: `1px solid ${COLORS.border}`,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <div
          style={{
            fontFamily: "'Syne', var(--font-syne), sans-serif",
            fontWeight: 700,
            fontSize: 15,
          }}
        >
          🏆 Today&apos;s Leaders
        </div>
        <div style={{ fontSize: 11, color: COLORS.accent }}>LIVE</div>
      </div>
      {LEADERS.map(([name, pts, color], i) => (
        <div
          key={name}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "8px 0",
            borderBottom: i < LEADERS.length - 1 ? `1px solid ${COLORS.border}` : "none",
          }}
        >
          <div style={{ width: 24, fontWeight: 700, color, fontSize: 13 }}>#{i + 1}</div>
          <div style={{ flex: 1, fontSize: 14, color: COLORS.text }}>{name}</div>
          <div style={{ fontSize: 14, fontWeight: 600, color }}>
            {pts.toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  );
}
