"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { Question } from "@/types/game";

const TIMER_DURATION_SEC = 12;
const FEEDBACK_DELAY_MS = 1200;

interface GameState {
  currentIndex: number;
  score: number;
  streak: number;
  maxStreak: number;
  answered: number | null;
  showBurst: boolean;
  isComplete: boolean;
}

interface UseGameReturn extends GameState {
  currentQuestion: Question | null;
  progress: number;
  timeRemaining: number;
  handleAnswer: (idx: number) => void;
}

function advanceToNext(
  prev: GameState,
  questions: Question[],
  onComplete: (score: number, maxStreak: number) => void
): Partial<GameState> {
  const nextIndex = prev.currentIndex + 1;
  const isLastQuestion = nextIndex >= questions.length;

  if (isLastQuestion) {
    onComplete(prev.score, prev.maxStreak);
    return { showBurst: false, isComplete: true };
  }

  return {
    currentIndex: nextIndex,
    answered: null,
    showBurst: false,
  };
}

export function useGame(questions: Question[], onComplete: (score: number, maxStreak: number) => void): UseGameReturn {
  const [state, setState] = useState<GameState>({
    currentIndex: 0,
    score: 0,
    streak: 0,
    maxStreak: 0,
    answered: null,
    showBurst: false,
    isComplete: false,
  });

  const [timeRemaining, setTimeRemaining] = useState(TIMER_DURATION_SEC);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (state.isComplete || state.answered !== null || !questions[state.currentIndex]) return;

    setTimeRemaining(TIMER_DURATION_SEC);
    intervalRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearTimer();
          // Reveal the correct answer for 2s before advancing
          setState((s) => ({
            ...s,
            streak: 0,
            answered: questions[s.currentIndex]?.correct ?? 0,
          }));
          setTimeout(() => {
            setState((s) => {
              const updates = advanceToNext(s, questions, onCompleteRef.current);
              return { ...s, ...updates };
            });
          }, 2000);
          return TIMER_DURATION_SEC;
        }
        return prev - 1;
      });
    }, 1000);

    return clearTimer;
  }, [state.currentIndex, state.answered, state.isComplete, questions, clearTimer]);

  const handleAnswer = useCallback(
    (idx: number) => {
      if (state.answered !== null || state.isComplete) return;

      clearTimer();

      const q = questions[state.currentIndex];
      const correct = idx === q.correct;

      setState((prev) => {
        const newStreak = correct ? prev.streak + 1 : 0;
        const newScore = correct ? prev.score + 100 + prev.streak * 10 : prev.score;
        const newMaxStreak = Math.max(prev.maxStreak, newStreak);

        return {
          ...prev,
          answered: idx,
          score: newScore,
          streak: newStreak,
          maxStreak: newMaxStreak,
          showBurst: newStreak >= 3,
        };
      });

      setTimeout(() => {
        setState((prev) => {
          const updates = advanceToNext(prev, questions, onCompleteRef.current);
          return { ...prev, ...updates };
        });
      }, FEEDBACK_DELAY_MS);
    },
    [state.answered, state.isComplete, state.currentIndex, questions, clearTimer]
  );

  const currentQuestion = questions[state.currentIndex] ?? null;
  const progress = questions.length > 0 ? (state.currentIndex / questions.length) * 100 : 0;

  return {
    ...state,
    currentQuestion,
    progress,
    timeRemaining,
    handleAnswer,
  };
}
