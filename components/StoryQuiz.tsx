"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  afterCorrectAnswer,
  NEXT_QUESTION_DELAY_MS,
} from "@/lib/afterCorrectAnswer";
import { playCorrect, playWrong } from "@/lib/sounds";
import { assetUrl, quizAsQuestions, type Story } from "@/lib/stories";
import { playNarration, stopSpeech } from "@/lib/speech";
import QuizScreen from "./QuizScreen";

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
  const scoreRef = useRef(0);
  const onDoneRef = useRef(onDone);

  const total = questions.length;
  const raw = story.quiz[index];

  useEffect(() => {
    onDoneRef.current = onDone;
  });

  const read = useCallback(
    (i: number) =>
      playNarration(
        assetUrl(story.id, "audio", story.quiz[i].audio),
        story.quiz[i].question,
      ),
    [story],
  );

  const goNext = useCallback(() => {
    if (index + 1 >= total) {
      onDoneRef.current(scoreRef.current);
      return;
    }
    setIndex((i) => i + 1);
    setSelected(null);
    read(index + 1);
  }, [index, total, read]);

  // Read the first question when the quiz opens; stop audio when it closes.
  useEffect(() => {
    if (story.quiz.length === 0) return;
    playNarration(
      assetUrl(story.id, "audio", story.quiz[0].audio),
      story.quiz[0].question,
    );
    return stopSpeech;
  }, [story]);

  // Advance after a pick: wait for correct-answer audio when present.
  useEffect(() => {
    if (selected === null) return;

    const correct = selected === questions[index].correct;
    if (correct) {
      const chosen = raw.answers.find((a) => a.id === selected);
      return afterCorrectAnswer({
        audioSrc: chosen?.audio
          ? assetUrl(story.id, "audio", chosen.audio)
          : null,
        fallbackText: chosen?.text ?? "",
        fallbackMs: NEXT_QUESTION_DELAY_MS,
        onContinue: goNext,
      });
    }

    const timer = setTimeout(goNext, NEXT_QUESTION_DELAY_MS);
    return () => clearTimeout(timer);
  }, [selected, index, questions, raw, story.id, goNext]);

  function handleSelect(answerId: string) {
    if (selected !== null) return;
    stopSpeech();
    setSelected(answerId);
    if (answerId === questions[index].correct) {
      scoreRef.current += 1;
      setScore(scoreRef.current);
      playCorrect();
    } else {
      playWrong();
    }
  }

  if (total === 0) return null;

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
