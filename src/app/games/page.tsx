"use client";

import { useRouter } from "next/navigation";
import PageWrapper from "@/components/layout/PageWrapper";
import BackHeader from "@/components/ui/BackHeader";
import LeaderboardTeaser from "@/components/games/LeaderboardTeaser";
import { QUESTIONS_PER_GAME, QUESTION_TIMER_SECONDS } from "@/lib/data/trivia";
import { COLORS } from "@/lib/constants/colors";

export default function GamesPage() {
  const router = useRouter();

  return (
    <PageWrapper>
      <div style={{ padding: "24px 16px 40px" }}>
        <BackHeader title="Quick Games" onBack={() => router.push("/")} />

        <div style={{ marginTop: 8, marginBottom: 24 }}>
          <div
            style={{
              fontSize: 28,
              fontFamily: "'Syne', var(--font-syne), sans-serif",
              fontWeight: 800,
            }}
          >
            Trivia
          </div>
          <div style={{ fontSize: 14, color: COLORS.muted, marginTop: 6 }}>
            {QUESTIONS_PER_GAME} questions · {QUESTION_TIMER_SECONDS}s each
          </div>
        </div>

        <div
          className="card-hover"
          onClick={() => router.push(`/games/play?t=${Date.now()}`)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && router.push(`/games/play?t=${Date.now()}`)}
          style={{
            background: COLORS.card,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 20,
            padding: "32px 24px",
            textAlign: "center",
            cursor: "pointer",
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 12 }}>🎮</div>
          <div
            style={{
              fontFamily: "'Syne', var(--font-syne), sans-serif",
              fontWeight: 700,
              fontSize: 18,
              color: COLORS.accent,
            }}
          >
            Start Game
          </div>
        </div>

        <LeaderboardTeaser />
      </div>
    </PageWrapper>
  );
}
