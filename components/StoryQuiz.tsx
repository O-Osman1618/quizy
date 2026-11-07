"use client";

import { useEffect, useMemo, useState } from "react";
import { playCorrect, playWrong } from "@/lib/sounds";
import { assetUrl, quizAsQuestions, type Story } from "@/lib/stories";
import { playNarration, stopSpeech } from "@/lib/speech";
import QuizScreen from "./QuizScreen";

const NEXT_QUESTION_DELAY_MS = 2800;

type Props = {
  story: Story;
  /** called with the number of right answers when the quiz is over */
  onDone: (score: number) => void;
};

/** The short quiz at the end of a story, reusing the main quiz screen. */
export default function StoryQuiz({ story, onDone }: Props) {
  const questions = useMemo(() => quizAsQuestions(story), [story]);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);

  const total = questions.length;

  const read = (i: number) =>
    playNarration(
      assetUrl(story.id, "audio", story.quiz[i].audio),
      story.quiz[i].question,
    );

  // Read the first question when the quiz opens; stop audio when it closes.
  useEffect(() => {
    playNarration(
      assetUrl(story.id, "audio", story.quiz[0].audio),
      story.quiz[0].question,
    );
    return stopSpeech;
  }, [story]);

  // After an answer is picked, wait briefly, then move on automatically.
  useEffect(() => {
    if (selected === null) return;
    const timer = setTimeout(() => {
      if (index + 1 >= total) {
        onDone(score);
      } else {
        setIndex(index + 1);
        setSelected(null);
        read(index + 1);
      }
    }, NEXT_QUESTION_DELAY_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, index, total, score, onDone]);

  function handleSelect(answerId: string) {
    if (selected !== null) return;
    stopSpeech();
    setSelected(answerId);
    if (answerId === questions[index].correct) {
      setScore((s) => s + 1);
      playCorrect();
    } else {
      playWrong();
    }
  }

  return (
    <QuizScreen
      question={questions[index]}
      index={index}
      total={total}
      score={score}
      selected={selected}
      onSelect={handleSelect}
      onReplay={() => read(index)}
    />
  );
}
