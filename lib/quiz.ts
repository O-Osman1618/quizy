import categoriesData from "@/data/categories.json";

export type Answer = {
  id: string;
  text: string;
  image: string;
};

export type Question = {
  id: number;
  question: string;
  answers: Answer[];
  correct: string;
};

export type Category = {
  id: string;
  name: string;
  emoji: string;
  questions: Question[];
};

export type Phase =
  | "start"
  | "modes"
  | "categories"
  | "playing"
  | "celebration"
  | "result"
  | "stories"
  | "story"
  | "storyQuiz"
  | "storyEnd";

export const PASS_RATIO = 0.75;

export const categories = categoriesData as Category[];

export function shuffle<T>(items: readonly T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** A category's questions in random order, with each question's answers shuffled too. */
export function prepareRound(category: Category): Question[] {
  return shuffle(category.questions).map((q) => ({
    ...q,
    answers: shuffle(q.answers),
  }));
}

export function passMark(total: number): number {
  return Math.ceil(total * PASS_RATIO);
}

/** Arabic counted noun: 3-10 take the plural "أسئلة", 11+ take the singular "سؤالاً". */
export function questionsWord(count: number): string {
  return count > 10 ? "سؤالاً" : "أسئلة";
}
