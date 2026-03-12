export const COLORS = {
  bg: "#0A0A0F",
  card: "#13131A",
  cardHover: "#1A1A25",
  accent: "#FF5C28",
  accentGlow: "rgba(255,92,40,0.3)",
  gold: "#F5C842",
  teal: "#2DFFC7",
  purple: "#A259FF",
  text: "#F0EDE8",
  muted: "#6B6878",
  border: "rgba(255,255,255,0.07)",
} as const;

export type ColorKey = keyof typeof COLORS;
