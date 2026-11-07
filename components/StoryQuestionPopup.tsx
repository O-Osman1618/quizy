"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AudioLines, Check } from "lucide-react";
import { shuffle } from "@/lib/quiz";
import { playCorrect, playWrong } from "@/lib/sounds";
import { assetUrl, type StoryAnswer, type StoryQuestion } from "@/lib/stories";
import { playNarration, stopSpeech } from "@/lib/speech";

function isImageFile(value: string | undefined): boolean {
  if (!value) return false;
  return /\.(png|jpe?g|webp|gif)$/i.test(value);
}

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
  // Shuffle once when this pop-up mounts so each visit can show a new order.
  const [answers] = useState(() => shuffle(question.answers));
  const wrongTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onCorrectRef = useRef(onCorrect);
  // When the child answers correctly, the parent starts the next page's
  // narration before this pop-up unmounts — so cleanup must not stopSpeech.
  const answeredCorrectRef = useRef(false);

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
      if (wrongTimer.current) clearTimeout(wrongTimer.current);
      if (!answeredCorrectRef.current) stopSpeech();
    };
  }, [storyId, question]);

  // After the right answer, pause so the child can enjoy it, then continue.
  useEffect(() => {
    if (!done) return;
    const timer = setTimeout(() => onCorrectRef.current(), CLOSE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [done]);

  function handleSelect(answer: StoryAnswer) {
    if (done) return;
    if (answer.id === question.correct) {
      stopSpeech();
      answeredCorrectRef.current = true;
      if (answer.audio) {
        playNarration(assetUrl(storyId, "audio", answer.audio), answer.text);
      }
      playCorrect();
      setDone(true);
      return;
    }
    playWrong();
    setWrongId(answer.id);
    if (wrongTimer.current) clearTimeout(wrongTimer.current);
    wrongTimer.current = setTimeout(() => setWrongId(null), 600);
  }

  const answerCount = answers.length;
  const gridClass =
    answerCount <= 2
      ? "grid-cols-2"
      : answerCount === 3
        ? "grid-cols-3"
        : "grid-cols-2";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={question.question}
      className="fixed inset-0 z-30 grid animate-backdrop place-items-center overflow-y-auto bg-ink/40 p-4"
    >
      <div className="flex w-full max-w-lg animate-rise flex-col gap-4 rounded-[2rem] bg-white p-4 shadow-xl sm:p-6 short:gap-2 short:p-3">
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

        <div className={`grid ${gridClass} items-center justify-items-center gap-4 pb-2 sm:gap-6`}>
          {answers.map((answer) => {
            const isCorrect = done && answer.id === question.correct;
            const isWrong = wrongId === answer.id;
            const fileName =
              answer.imageFile ||
              (isImageFile(answer.image) ? answer.image : undefined);
            const imageSrc = fileName
              ? assetUrl(storyId, "images", fileName)
              : undefined;
            const emoji =
              answer.image && !isImageFile(answer.image)
                ? answer.image
                : undefined;
            let feedback = "hover:scale-110 active:scale-95";
            if (isCorrect) {
              feedback = "animate-pop animate-pulse-ring z-10 scale-110";
            } else if (isWrong) {
              feedback = "animate-shake opacity-60";
            } else if (done) {
              feedback = "opacity-40";
            }

            return (
              <button
                key={answer.id}
                type="button"
                disabled={done}
                onClick={() => handleSelect(answer)}
                aria-label={answer.text}
                className={`relative flex flex-col items-center justify-center gap-2 bg-transparent p-1 transition-transform duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] select-none ${feedback}`}
              >
                {imageSrc ? (
                  <>
                    <span className="relative h-[clamp(5rem,min(28vw,20dvh),9rem)] w-[clamp(5rem,min(28vw,20dvh),9rem)]">
                      <Image
                        src={imageSrc}
                        alt=""
                        fill
                        sizes="160px"
                        className="object-contain drop-shadow-md"
                      />
                    </span>
                    <span className="text-[clamp(1.125rem,min(5vw,4dvh),1.75rem)] leading-tight font-extrabold text-ink">
                      {answer.text}
                    </span>
                  </>
                ) : emoji ? (
                  <>
                    <span
                      aria-hidden
                      className="text-[clamp(3.5rem,min(20vw,15dvh),7rem)] leading-none drop-shadow-sm"
                    >
                      {emoji}
                    </span>
                    <span className="text-[clamp(1.125rem,min(5vw,4dvh),1.75rem)] leading-tight font-extrabold text-ink">
                      {answer.text}
                    </span>
                  </>
                ) : (
                  <span className="text-[clamp(2.75rem,min(16vw,12dvh),5.5rem)] leading-none font-extrabold text-ink">
                    {answer.text}
                  </span>
                )}
                {isCorrect && (
                  <span
                    aria-hidden
                    className="absolute -top-1 end-0 grid size-9 place-items-center rounded-full bg-green-600 text-white shadow"
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
