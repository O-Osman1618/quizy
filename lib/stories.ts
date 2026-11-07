import storiesData from "@/data/stories.json";
import { mediaUrl } from "@/lib/media";
import type { Question } from "@/lib/quiz";

/** Placeholder artwork shown until a real illustration exists. */
export type Scene = {
  from: string;
  to: string;
  decor: string[];
  characters: string[];
};

export type StoryAnswer = {
  id: string;
  text: string;
  /** optional emoji; omit for text-only choices */
  image?: string;
  /** optional narration when this answer is chosen correctly */
  audio?: string;
};

export type StoryQuestion = {
  question: string;
  /** file name inside stories/<id>/audio/ (Blob or public/) */
  audio: string;
  answers: StoryAnswer[];
  correct: string;
};

export type StoryPage = {
  id: number;
  text: string;
  /** narration, file name inside public/stories/<id>/audio/ */
  audio: string;
  /** illustration, file name inside public/stories/<id>/images/ */
  image: string;
  /** optional short sound effect, file name inside public/stories/<id>/audio/ */
  sfx?: string;
  scene: Scene;
  /** asked in a pop-up before moving on from this page */
  question?: StoryQuestion;
};

export type Story = {
  id: string;
  title: string;
  /** file name inside public/stories/<id>/images/ */
  cover: string;
  coverScene: Scene;
  pages: StoryPage[];
  quiz: StoryQuestion[];
};

export const stories = storiesData as unknown as Story[];

export function assetUrl(
  storyId: string,
  kind: "images" | "audio",
  file: string,
): string {
  return mediaUrl(`/stories/${storyId}/${kind}/${file}`);
}

/** The end-of-story quiz in the same shape the main quiz screen uses. */
export function quizAsQuestions(story: Story): Question[] {
  return story.quiz.map((q, i) => ({
    id: i + 1,
    question: q.question,
    answers: q.answers.map((a) => ({
      id: a.id,
      text: a.text,
      image: a.image ?? "",
    })),
    correct: q.correct,
  }));
}
