"use client";

import { useEffect, useRef, useState } from "react";
import { AudioLines, Check } from "lucide-react";
import { playCorrect, playWrong } from "@/lib/sounds";
import { assetUrl, type StoryQuestion } from "@/lib/stories";
import { playNarration, stopSpeech } from "@/lib/speech";

const COLORS = [
  "bg-sky-200 shadow-[0_8px_0_0_#7dd3fc]",
  "bg-yellow-200 shadow-[0_8px_0_0_#fde047]",
  "bg-emerald-200 shadow-[0_8px_0_0_#6ee7b7]",
];

const CLOSE_DELAY_MS = 1800;

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
  const wrongTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onCorrectRef = useRef(onCorrect);

  useEffect(() => {
    onCorrectRef.current = onCorrect;
  });

  const narrate = () =>
    playNarration(
      assetUrl(storyId, "audio", question.audio),
      question.question,
    );

  // Read the question aloud as soon as the pop-up appears.
  useEffect(() => {
    playNarration(
      assetUrl(storyId, "audio", question.audio),
      question.question,
    );
    return () => {
      stopSpeech();
      if (wrongTimer.current) clearTimeout(wrongTimer.current);
    };
  }, [storyId, question]);

  // After the right answer, pause so the child can enjoy it, then continue.
  useEffect(() => {
    if (!done) return;
    const timer = setTimeout(() => onCorrectRef.current(), CLOSE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [done]);

  function handleSelect(id: string) {
    if (done) return;
    if (id === question.correct) {
      stopSpeech();
      playCorrect();
      setDone(true);
      return;
    }
    playWrong();
    setWrongId(id);
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
      <div className="flex w-full max-w-md animate-rise flex-col gap-4 rounded-[2rem] bg-white p-4 shadow-xl sm:p-6 short:gap-2 short:p-3">
        <div className="flex items-center justify-center gap-3">
          <h2 className="text-center text-[clamp(1.5rem,min(7vw,5.5dvh),2.5rem)] leading-snug font-extrabold">
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

        <div className="grid grid-cols-2 gap-3 pb-2 sm:gap-5">
          {question.answers.map((answer, i) => {
            const isCorrect = done && answer.id === question.correct;
            const isWrong = wrongId === answer.id;
            const state = isCorrect
              ? "bg-green-400 shadow-[0_8px_0_0_#16a34a] animate-pop animate-pulse-ring z-10"
              : isWrong
                ? "bg-red-200 shadow-[0_8px_0_0_#fca5a5] animate-shake"
                : `${COLORS[i % COLORS.length]} hover:scale-[1.04] active:translate-y-1 active:scale-95 ${
                    done ? "opacity-50" : ""
                  }`;

            return (
              <button
                key={answer.id}
                type="button"
                disabled={done}
                onClick={() => handleSelect(answer.id)}
                aria-label={answer.text}
                className={`relative flex h-[clamp(8rem,min(46vw,34dvh),15rem)] flex-col items-center justify-center gap-1 rounded-[2rem] p-2 transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] select-none ${state}`}
              >
                <span
                  aria-hidden
                  className="text-[clamp(3.5rem,min(20vw,15dvh),7rem)] leading-none"
                >
                  {answer.image}
                </span>
                <span className="text-[clamp(1.25rem,min(5.5vw,4.5dvh),2rem)] leading-tight font-extrabold">
                  {answer.text}
                </span>
                {isCorrect && (
                  <span
                    aria-hidden
                    className="absolute end-2 top-2 grid size-9 place-items-center rounded-full bg-green-600 text-white"
                  >
                    <Check className="size-6" strokeWidth={4} />
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <p className="sr-only" aria-live="polite">
          {done ? "إجابة صحيحة" : wrongId ? "حاول مرة أخرى" : ""}
        </p>
      </div>
    </div>
  );
}
