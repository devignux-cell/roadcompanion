import type { Question, Category } from "@/types/game";

export const QUESTIONS_PER_GAME = 15;

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export const TRIVIA: Record<Category, Question[]> = {
  Tampa: [
    { q: "Which NFL team plays in Tampa?", a: ["Buccaneers", "Dolphins", "Jaguars", "Panthers"], correct: 0 },
    { q: "Tampa Bay is connected to which body of water?", a: ["Atlantic Ocean", "Gulf of Mexico", "Caribbean Sea", "Lake Erie"], correct: 1 },
    { q: "Ybor City was famous for what industry?", a: ["Fishing", "Citrus", "Cigar rolling", "Shipping"], correct: 2 },
    { q: "What is Tampa's nickname?", a: ["The Sunshine City", "The Bay City", "Cigar City", "Magic City"], correct: 2 },
    { q: "Which year did Tampa host the Super Bowl most recently?", a: ["2017", "2019", "2021", "2023"], correct: 2 },
  ],
  Music: [
    { q: "What genre of music originated in Tampa's Ybor City scene?", a: ["Jazz", "Latin Trap", "Death Metal", "Blues"], correct: 2 },
    { q: "Which Florida city hosted Ultra Music Festival?", a: ["Tampa", "Orlando", "Miami", "Jacksonville"], correct: 2 },
    { q: "What's the name of the biggest music venue in Tampa?", a: ["Amalie Arena", "Raymond James", "Waterworks", "Jannus Live"], correct: 0 },
    { q: "Which legendary band is from Tampa?", a: ["Lynyrd Skynyrd", "Matchbox 20", "The Killers", "Sublime"], correct: 1 },
    { q: "Florida Man by which artist topped charts?", a: ["Post Malone", "Jon Pardi", "Kane Brown", "Luke Bryan"], correct: 1 },
  ],
  Food: [
    { q: "The Cuban sandwich originated in which Florida city?", a: ["Miami", "Tampa", "Orlando", "Key West"], correct: 1 },
    { q: "What seafood is Tampa most famous for?", a: ["Lobster", "Stone Crab", "Grouper", "Shrimp"], correct: 2 },
    { q: "Ciccio's is a famous Tampa restaurant known for what?", a: ["Pizza", "Burgers", "Tacos", "Sushi"], correct: 0 },
    { q: "What Florida citrus grows near Tampa?", a: ["Blood oranges", "Mandarins", "Navel oranges", "All of the above"], correct: 3 },
    { q: "Columbia Restaurant in Ybor City is Florida's oldest restaurant (opened when?)", a: ["1905", "1920", "1888", "1932"], correct: 0 },
  ],
  Sports: [
    { q: "Tampa Bay Lightning play which sport?", a: ["Football", "Baseball", "Hockey", "Basketball"], correct: 2 },
    { q: "The Tampa Bay Rays play at which stadium?", a: ["Tropicana Field", "Amalie Arena", "Raymond James", "Steinbrenner Field"], correct: 0 },
    { q: "In which year did the Bucs win their first Super Bowl?", a: ["1999", "2002", "2005", "2008"], correct: 1 },
    { q: "Tom Brady won how many Super Bowls with the Bucs?", a: ["0", "1", "2", "3"], correct: 1 },
    { q: "The Bulls are the sports teams of which Tampa university?", a: ["UT", "USF", "HCC", "Eckerd"], correct: 1 },
  ],
};

export const CATEGORIES: Category[] = ["Tampa", "Music", "Food", "Sports"];

export const CATEGORY_META: Record<Category, { emoji: string; color: string; count: number }> = {
  Tampa: { emoji: "🌴", color: "#FF5C28", count: 5 },
  Music: { emoji: "🎵", color: "#2DFFC7", count: 5 },
  Food: { emoji: "🍕", color: "#F5C842", count: 5 },
  Sports: { emoji: "⚡", color: "#A259FF", count: 5 },
};

export const QUESTION_TIMER_SECONDS = 10
;

function shuffleAnswers(q: Question): Question {
  const pairs = q.a.map((ans, i) => ({ ans, isCorrect: i === q.correct }));
  const shuffled = shuffle(pairs);
  return {
    q: q.q,
    a: shuffled.map((p) => p.ans) as [string, string, string, string],
    correct: shuffled.findIndex((p) => p.isCorrect) as 0 | 1 | 2 | 3,
  };
}

export function getRandomQuestions(limit = QUESTIONS_PER_GAME): Question[] {
  const all = Object.values(TRIVIA).flat();
  return shuffle(all).slice(0, limit).map(shuffleAnswers);
}
