import storiesData from "@/data/stories.json";
import { mediaUrl } from "@/lib/media";
import { shuffle, type Answer, type Question } from "@/lib/quiz";

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
  /** optional emoji; used when imageFile is missing */
  image?: string;
  /** optional picture file name inside stories/<id>/images/ */
  imageFile?: string;
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
  /** narration file name inside stories/<id>/audio/ (Blob or public/) */
  audio: string;
  /** illustration file name inside stories/<id>/images/ (Blob or public/); omit for text-only pages */
  image?: string;
  /** optional short sound effect file name inside stories/<id>/audio/ */
  sfx?: string;
  scene: Scene;
  /** asked in a pop-up before moving on from this page */
  question?: StoryQuestion;
};

export type Story = {
  id: string;
  title: string;
  /** cover file name inside stories/<id>/images/ (Blob or public/) */
  cover: string;
  coverScene: Scene;
  pages: StoryPage[];
  quiz: StoryQuestion[];
};

export type ResolvedStoryAnswer = Answer & {
  /** narration file name when this answer is chosen correctly */
  audio?: string;
};

export const stories = storiesData as unknown as Story[];

function looksLikeImageFile(value: string | undefined): boolean {
  if (!value) return false;
  return /\.(png|jpe?g|webp|gif)$/i.test(value);
}

export function assetUrl(
  storyId: string,
  kind: "images" | "audio",
  file: string,
): string {
  return mediaUrl(`/stories/${storyId}/${kind}/${file}`);
}

/** Map a story answer to quiz UI fields (picture URL vs emoji). */
export function resolveStoryAnswer(
  storyId: string,
  answer: StoryAnswer,
): ResolvedStoryAnswer {
  const fileName =
    answer.imageFile ||
    (looksLikeImageFile(answer.image) ? answer.image : undefined);
  const emoji =
    answer.image && !looksLikeImageFile(answer.image)
      ? answer.image
      : undefined;

  return {
    id: answer.id,
    text: answer.text,
    imageSrc: fileName ? assetUrl(storyId, "images", fileName) : undefined,
    image: emoji,
    audio: answer.audio,
  };
}

/** End-of-story quiz with answers shuffled per question. */
export function quizAsQuestions(story: Story): Question[] {
  return story.quiz.map((q, i) => ({
    id: i + 1,
    question: q.question,
    answers: shuffle(
      q.answers.map((a) => resolveStoryAnswer(story.id, a)),
    ),
    correct: q.correct,
  }));
}
