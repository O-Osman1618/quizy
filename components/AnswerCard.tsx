import { Check, X } from "lucide-react";
import type { Answer } from "@/lib/quiz";

const COLORS = [
  "bg-sky-200 shadow-[0_8px_0_0_#7dd3fc]",
  "bg-yellow-200 shadow-[0_8px_0_0_#fde047]",
  "bg-emerald-200 shadow-[0_8px_0_0_#6ee7b7]",
  "bg-purple-200 shadow-[0_8px_0_0_#c4b5fd]",
];

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
  index,
  selected,
  correct,
  onSelect,
}: Props) {
  const locked = selected !== null;
  const isSelected = selected === answer.id;
  const isCorrect = answer.id === correct;

  let state = `${COLORS[index % COLORS.length]} hover:scale-[1.03] active:translate-y-1 active:scale-95`;
  if (locked) {
    if (isCorrect) {
      state =
        "bg-green-400 shadow-[0_8px_0_0_#16a34a] animate-pop animate-pulse-ring z-10";
    } else if (isSelected) {
      state = "bg-red-200 shadow-[0_8px_0_0_#fca5a5] animate-shake";
    } else {
      state = `${COLORS[index % COLORS.length]} opacity-50`;
    }
  }

  return (
    <button
      type="button"
      disabled={locked}
      onClick={() => onSelect(answer.id)}
      aria-label={answer.text}
      className={`relative flex min-h-0 flex-col items-center justify-center gap-1 rounded-[2rem] p-2 transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] select-none ${state}`}
    >
      <span
        aria-hidden
        className="text-[clamp(2.5rem,min(18vw,12dvh),6.5rem)] leading-none"
      >
        {answer.image}
      </span>
      <span className="text-[clamp(1.125rem,min(5vw,4dvh),1.75rem)] leading-tight font-extrabold">
        {answer.text}
      </span>
      {locked && (isCorrect || isSelected) && (
        <span
          aria-hidden
          className={`absolute top-2 end-2 grid size-8 place-items-center rounded-full text-white ${
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
