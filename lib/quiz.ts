import questionsData from "@/data/questions.json";

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

export type Phase = "start" | "playing" | "celebration" | "result";

export const PASS_RATIO = 0.75;

const allQuestions = questionsData as Question[];

export function shuffle<T>(items: readonly T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** All questions in random order, with the answers of each also shuffled. */
export function prepareRound(): Question[] {
  return shuffle(allQuestions).map((q) => ({
    ...q,
    answers: shuffle(q.answers),
  }));
}

export function passMark(total: number): number {
  return Math.ceil(total * PASS_RATIO);
}
