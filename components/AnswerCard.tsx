import Image from "next/image";
import { Check, X } from "lucide-react";
import type { Answer } from "@/lib/quiz";

type Props = {
  answer: Answer;
  index: number;
  /** id of the answer the child tapped, or null before answering */
  selected: string | null;
  correct: string;
  onSelect: (id: string) => void;
};

export default function AnswerCard({
  answer,
  selected,
  correct,
  onSelect,
}: Props) {
  const locked = selected !== null;
  const isSelected = selected === answer.id;
  const isCorrect = answer.id === correct;
  const hasPicture = Boolean(answer.imageSrc);
  const hasEmoji = Boolean(answer.image);
  const textOnly = !hasPicture && !hasEmoji;

  let feedback = "hover:scale-110 active:scale-95";
  if (locked) {
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
      className={`relative flex min-h-0 flex-col items-center justify-center gap-2 bg-transparent p-1 transition-transform duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] select-none ${feedback}`}
    >
      {hasPicture ? (
        <span className="relative h-[clamp(5rem,min(28vw,22dvh),10rem)] w-[clamp(5rem,min(28vw,22dvh),10rem)] shrink-0">
          <Image
            src={answer.imageSrc!}
            alt=""
            fill
            sizes="160px"
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

      {locked && (isCorrect || isSelected) && (
        <span
          aria-hidden
          className={`absolute -top-1 end-1 grid size-8 place-items-center rounded-full text-white shadow ${
            isCorrect ? "bg-green-600" : "bg-red-500"
          }`}
        >
          {isCorrect ? (
            <Check className="size-5" strokeWidth={4} />
          ) : (
            <X className="size-5" strokeWidth={4} />
          )}
        </span>
      )}
    </button>
  );
}
