export interface Question {
  q: string;
  a: [string, string, string, string];
  correct: 0 | 1 | 2 | 3;
}

export type Category = "Tampa" | "Music" | "Food" | "Sports";

export interface GameSession {
  category: Category;
  currentIndex: number;
  score: number;
  streak: number;
  maxStreak: number;
  answered: number | null;
  showBurst: boolean;
  isComplete: boolean;
}
