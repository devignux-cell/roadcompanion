"use client";

import { Suspense, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PageWrapper from "@/components/layout/PageWrapper";
import BackHeader from "@/components/ui/BackHeader";
import AnswerButton from "@/components/games/AnswerButton";
import QuestionTimer from "@/components/games/QuestionTimer";
import StreakBurst from "@/components/games/StreakBurst";
import { useGame } from "@/hooks/useGame";
import { getRandomQuestions, QUESTION_TIMER_SECONDS } from "@/lib/data/trivia";
import { COLORS } from "@/lib/constants/colors";

// Inner component — remounts fresh whenever `key` changes
function GameSession() {
  const router = useRouter();
  const [questions] = useState(() => getRandomQuestions());

  const onComplete = useCallback(
    (score: number, maxStreak: number) => {
      router.push(`/games/results?score=${score}&streak=${maxStreak}`);
    },
    [router]
  );

  const { currentQuestion, currentIndex, score, streak, answered, showBurst, timeRemaining, handleAnswer, progress } =
    useGame(questions, onComplete);

  if (!currentQuestion) {
    return (
      <PageWrapper>
        <div style={{ padding: "24px 16px", textAlign: "center", paddingTop: 80 }}>
          <div style={{ fontSize: 14, color: COLORS.muted }}>Loading...</div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div style={{ padding: "24px 16px 40px", minHeight: "100vh" }}>
        <BackHeader title="Trivia" onBack={() => router.push("/games")} />

        {/* Progress info */}
        <div
          style={{
            marginTop: 16,
            marginBottom: 8,
            display: "flex",
            justifyContent: "space-between",
            fontSize: 12,
            color: COLORS.muted,
          }}
        >
          <span>Q{currentIndex + 1} of {questions.length}</span>
          <span style={{ color: COLORS.gold }}>⚡ {streak} streak</span>
        </div>

        {/* Progress bar */}
        <div
          style={{
            height: 4,
            background: COLORS.card,
            borderRadius: 100,
            marginBottom: 16,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${progress}%`,
              background: `linear-gradient(90deg, ${COLORS.accent}, ${COLORS.gold})`,
              borderRadius: 100,
              transition: "width 0.4s ease",
            }}
          />
        </div>

        {/* Timer */}
        <div style={{ marginBottom: 20 }}>
          <QuestionTimer
            remainingSeconds={timeRemaining}
            totalSeconds={QUESTION_TIMER_SECONDS}
            isPaused={answered !== null}
          />
        </div>

        {/* Score */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 13, color: COLORS.muted }}>Score</div>
          <div
            style={{
              fontSize: 42,
              fontFamily: "'Syne', var(--font-syne), sans-serif",
              fontWeight: 800,
              color: COLORS.text,
            }}
          >
            {score}
          </div>
        </div>

        {/* Question */}
        <div
          style={{
            background: COLORS.card,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 24,
            padding: "28px 24px",
            marginBottom: 20,
            textAlign: "center",
            animation: "fadeUp 0.4s ease",
          }}
        >
          <div style={{ fontSize: 19, fontWeight: 600, lineHeight: 1.5 }}>
            {currentQuestion.q}
          </div>
        </div>

        {/* Answers */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {currentQuestion.a.map((ans, i) => (
            <AnswerButton
              key={`${currentIndex}-${i}`}
              answer={ans}
              index={i}
              answered={answered}
              isCorrect={i === currentQuestion.correct}
              isSelected={i === answered}
              onClick={() => handleAnswer(i)}
            />
          ))}
        </div>

        {showBurst && <StreakBurst />}
      </div>
    </PageWrapper>
  );
}

// Reads the session key from the URL and uses it to force GameSession to remount
function GameLoader() {
  const searchParams = useSearchParams();
  const session = searchParams.get("t") ?? "0";
  return <GameSession key={session} />;
}

export default function PlayPage() {
  return (
    <Suspense
      fallback={
        <PageWrapper>
          <div style={{ padding: "24px 16px", textAlign: "center", paddingTop: 80 }}>
            <div style={{ fontSize: 14, color: COLORS.muted }}>Loading...</div>
          </div>
        </PageWrapper>
      }
    >
      <GameLoader />
    </Suspense>
  );
}
