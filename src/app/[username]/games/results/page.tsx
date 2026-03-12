"use client";

import { useSearchParams, useRouter, useParams } from "next/navigation";
import { Suspense } from "react";
import PageWrapper from "@/components/layout/PageWrapper";
import { COLORS } from "@/lib/constants/colors";

function ResultsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { username } = useParams<{ username: string }>();

  const score = parseInt(searchParams.get("score") ?? "0", 10);
  const streak = parseInt(searchParams.get("streak") ?? "0", 10);

  const grade =
    score >= 400
      ? { emoji: "🏆", label: "Champion!" }
      : score >= 250
      ? { emoji: "⭐", label: "Nice!" }
      : { emoji: "📚", label: "Keep Playing!" };

  return (
    <PageWrapper>
      <div style={{ padding: "24px 16px 40px", textAlign: "center" }}>
        <div style={{ paddingTop: 60, animation: "fadeUp 0.5s ease" }}>
          <div style={{ fontSize: 72, marginBottom: 16 }}>{grade.emoji}</div>
          <div
            style={{
              fontFamily: "'Syne', var(--font-syne), sans-serif",
              fontWeight: 800,
              fontSize: 22,
              marginBottom: 8,
            }}
          >
            {grade.label}
          </div>
          <div style={{ fontSize: 15, color: COLORS.muted, marginBottom: 40 }}>
            Trivia complete
          </div>

          <div
            style={{
              background: COLORS.card,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 28,
              padding: 32,
              marginBottom: 32,
            }}
          >
            <div
              style={{
                fontSize: 56,
                fontFamily: "'Syne', var(--font-syne), sans-serif",
                fontWeight: 800,
                color: COLORS.accent,
              }}
            >
              {score}
            </div>
            <div style={{ fontSize: 14, color: COLORS.muted, marginTop: 4 }}>
              points earned
            </div>
            {streak > 0 && (
              <div
                style={{
                  marginTop: 16,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  background: COLORS.gold + "15",
                  border: `1px solid ${COLORS.gold}30`,
                  borderRadius: 100,
                  padding: "6px 14px",
                  fontSize: 13,
                  color: COLORS.gold,
                }}
              >
                🔥 Best streak: {streak}
              </div>
            )}
          </div>

          <div
            style={{
              background: COLORS.card,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 20,
              padding: 20,
              marginBottom: 24,
              textAlign: "left",
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
              Save your score to the leaderboard?
            </div>
            <div style={{ fontSize: 12, color: COLORS.muted, marginBottom: 12 }}>
              Coming soon — Supabase leaderboard in progress
            </div>
            <div
              style={{
                background: COLORS.bg,
                border: `1px solid ${COLORS.border}`,
                borderRadius: 12,
                padding: "12px 16px",
                fontSize: 14,
                color: COLORS.muted,
              }}
            >
              Enter a username...
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <button
              onClick={() =>
                router.push(`/${username}/games/play?t=${Date.now()}`)
              }
              style={{
                background: COLORS.accent,
                color: "#fff",
                border: "none",
                borderRadius: 16,
                padding: "16px",
                fontSize: 15,
                fontWeight: 600,
                cursor: "pointer",
                width: "100%",
                fontFamily: "inherit",
              }}
            >
              Play Again
            </button>
            <button
              onClick={() => router.push(`/${username}`)}
              style={{
                background: COLORS.card,
                color: COLORS.text,
                border: `1px solid ${COLORS.border}`,
                borderRadius: 16,
                padding: "16px",
                fontSize: 15,
                cursor: "pointer",
                width: "100%",
                fontFamily: "inherit",
              }}
            >
              Home
            </button>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}

export default function ResultsPage() {
  return (
    <Suspense
      fallback={
        <PageWrapper>
          <div
            style={{
              padding: 24,
              textAlign: "center",
              paddingTop: 80,
              color: "#6B6878",
            }}
          >
            Loading results...
          </div>
        </PageWrapper>
      }
    >
      <ResultsContent />
    </Suspense>
  );
}
