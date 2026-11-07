"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AudioLines } from "lucide-react";
import {
  afterCorrectAnswer,
  POPUP_CLOSE_FALLBACK_MS,
} from "@/lib/afterCorrectAnswer";
import { answerGridClass } from "@/lib/answerGrid";
import { shuffle } from "@/lib/quiz";
import { playCorrect, playWrong } from "@/lib/sounds";
import {
  assetUrl,
  resolveStoryAnswer,
  type StoryQuestion,
} from "@/lib/stories";
import { playNarration, stopSpeech } from "@/lib/speech";
import AnswerCard from "./AnswerCard";

type Props = {
  storyId: string;
  question: StoryQuestion;
  /** called once the child has found the right answer */
  onCorrect: () => void;
};

/**
 * A question that pops up over the story. For little children there is no
 * "wrong" ending: a wrong tap gives a gentle shake and they can try again.
 */
export default function StoryQuestionPopup({
  storyId,
  question,
  onCorrect,
}: Props) {
  const [wrongId, setWrongId] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [answers] = useState(() =>
    shuffle(question.answers.map((a) => resolveStoryAnswer(storyId, a))),
  );
  const wrongTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onCorrectRef = useRef(onCorrect);
  // When the child answers correctly, the parent starts the next page's
  // narration before this pop-up unmounts — so cleanup must not stopSpeech.
  const answeredCorrectRef = useRef(false);
  const correctAnswer = useMemo(
    () => answers.find((a) => a.id === question.correct),
    [answers, question.correct],
  );

  useEffect(() => {
    onCorrectRef.current = onCorrect;
  });

  const narrate = () =>
    playNarration(
      assetUrl(storyId, "audio", question.audio),
      question.question,
    );

  useEffect(() => {
    playNarration(
      assetUrl(storyId, "audio", question.audio),
      question.question,
    );
    return () => {
      if (wrongTimer.current) clearTimeout(wrongTimer.current);
      if (!answeredCorrectRef.current) stopSpeech();
    };
  }, [storyId, question]);

  useEffect(() => {
    if (!done || !correctAnswer) return;
    return afterCorrectAnswer({
      audioSrc: correctAnswer.audio
        ? assetUrl(storyId, "audio", correctAnswer.audio)
        : null,
      fallbackText: correctAnswer.text,
      fallbackMs: POPUP_CLOSE_FALLBACK_MS,
      onContinue: () => onCorrectRef.current(),
    });
  }, [done, correctAnswer, storyId]);

  function handleSelect(answerId: string) {
    if (done) return;
    const answer = answers.find((a) => a.id === answerId);
    if (!answer) return;

    if (answer.id === question.correct) {
      stopSpeech();
      answeredCorrectRef.current = true;
      playCorrect();
      setDone(true);
      return;
    }
    playWrong();
    setWrongId(answer.id);
    if (wrongTimer.current) clearTimeout(wrongTimer.current);
    wrongTimer.current = setTimeout(() => setWrongId(null), 600);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={question.question}
      className="fixed inset-0 z-30 grid animate-backdrop place-items-center overflow-y-auto bg-ink/40 p-4"
    >
      <div className="flex w-full max-w-xl animate-rise flex-col gap-5 rounded-[2rem] bg-white p-5 shadow-xl sm:gap-6 sm:p-7 short:gap-3 short:p-4">
        <div className="flex items-start justify-center gap-3 px-1">
          <h2 className="min-w-0 flex-1 text-center text-[clamp(1.5rem,min(7vw,5.5dvh),2.5rem)] leading-snug font-extrabold">
            {question.question}
          </h2>
          <button
            type="button"
            onClick={narrate}
            aria-label="اسمع السؤال"
            className="grid size-12 shrink-0 place-items-center rounded-full bg-pop-purple text-white shadow-[0_4px_0_0_#7c5fe0] transition-transform duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] select-none hover:scale-110 active:translate-y-0.5 active:scale-90 short:size-10"
          >
            <AudioLines className="size-6" aria-hidden strokeWidth={2.5} />
          </button>
        </div>

        <div
          className={`grid ${answerGridClass(answers.length)} items-center justify-items-center gap-4 sm:gap-6`}
        >
          {answers.map((answer) => (
            <AnswerCard
              key={answer.id}
              answer={answer}
              selected={wrongId}
              correct={question.correct}
              onSelect={handleSelect}
              mode="retry"
              done={done}
            />
          ))}
        </div>

        <p className="sr-only" aria-live="polite">
          {done ? "إجابة صحيحة" : wrongId ? "حاول مرة أخرى" : ""}
        </p>
      </div>
    </div>
  );
}
