import Image from "next/image";
import { Check, X } from "lucide-react";
import type { Answer } from "@/lib/quiz";

type Props = {
  answer: Answer;
  /** id of the answer the child tapped, or null before answering / after retry shake */
  selected: string | null;
  correct: string;
  onSelect: (id: string) => void;
  /**
   * lock — one tap locks all choices (category / end quiz).
   * retry — wrong shakes then clears; only `done` disables choices (popup).
   */
  mode?: "lock" | "retry";
  /** retry mode: true after the correct answer */
  done?: boolean;
};

export default function AnswerCard({
  answer,
  selected,
  correct,
  onSelect,
  mode = "lock",
  done = false,
}: Props) {
  const isSelected = selected === answer.id;
  const isCorrect = answer.id === correct;
  const hasPicture = Boolean(answer.imageSrc);
  const hasEmoji = Boolean(answer.image);
  const textOnly = !hasPicture && !hasEmoji;

  const locked = mode === "lock" ? selected !== null : done;
  const showCorrectMark = mode === "lock" ? locked && isCorrect : done && isCorrect;
  const showWrongMark = mode === "lock" && locked && isSelected && !isCorrect;

  let feedback = "hover:scale-110 active:scale-95";
  if (mode === "retry") {
    if (done && isCorrect) {
      feedback = "animate-pop animate-pulse-ring z-10 scale-110";
    } else if (isSelected) {
      feedback = "animate-shake opacity-60";
    } else if (done) {
      feedback = "opacity-40";
    }
  } else if (locked) {
    if (isCorrect) {
      feedback = "animate-pop animate-pulse-ring z-10 scale-110";
    } else if (isSelected) {
      feedback = "animate-shake opacity-60";
    } else {
      feedback = "opacity-40";
    }
  }

  return (
    <button
      type="button"
      disabled={locked}
      onClick={() => onSelect(answer.id)}
      aria-label={answer.text}
      className={`relative flex min-h-0 w-full max-w-[11rem] flex-col items-center justify-center gap-2 bg-transparent p-1 transition-transform duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] select-none sm:max-w-[13rem] ${feedback}`}
    >
      {hasPicture ? (
        <span className="relative h-[clamp(5.5rem,min(30vw,24dvh),11rem)] w-[clamp(5.5rem,min(30vw,24dvh),11rem)] shrink-0">
          <Image
            src={answer.imageSrc!}
            alt=""
            fill
            sizes="176px"
            className="object-contain drop-shadow-md"
          />
        </span>
      ) : hasEmoji ? (
        <span
          aria-hidden
          className="text-[clamp(3rem,min(20vw,14dvh),7rem)] leading-none drop-shadow-sm"
        >
          {answer.image}
        </span>
      ) : (
        <span className="text-[clamp(2.75rem,min(16vw,12dvh),5.5rem)] leading-none font-extrabold text-ink">
          {answer.text}
        </span>
      )}

      {/* Label under picture/emoji; numbers are the answer themselves */}
      {!textOnly && (
        <span className="text-[clamp(1rem,min(4.5vw,3.5dvh),1.5rem)] leading-tight font-extrabold text-ink">
          {answer.text}
        </span>
      )}

      {(showCorrectMark || showWrongMark) && (
        <span
          aria-hidden
          className={`absolute -top-1 end-1 grid size-8 place-items-center rounded-full text-white shadow ${
            showCorrectMark ? "bg-green-600" : "bg-red-500"
          }`}
        >
          {showCorrectMark ? (
            <Check className="size-5" strokeWidth={4} />
          ) : (
            <X className="size-5" strokeWidth={4} />
          )}
        </span>
      )}
    </button>
  );
}
