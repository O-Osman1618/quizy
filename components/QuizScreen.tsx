import { Star } from "lucide-react";
import type { Question } from "@/lib/quiz";
import AnswerCard from "./AnswerCard";
import SoundToggle from "./SoundToggle";

type Props = {
  question: Question;
  index: number;
  total: number;
  score: number;
  selected: string | null;
  onSelect: (id: string) => void;
};

export default function QuizScreen({
  question,
  index,
  total,
  score,
  selected,
  onSelect,
}: Props) {
  const progress = ((index + (selected !== null ? 1 : 0)) / total) * 100;
  const answeredRight = selected !== null && selected === question.correct;

  return (
    <section className="flex flex-1 flex-col gap-3 sm:gap-5 short:gap-2">
      <header className="flex items-center gap-2 sm:gap-3">
        <SoundToggle />
        <span className="text-base font-bold whitespace-nowrap sm:text-xl">
          سؤال {index + 1} / {total}
        </span>
        <div
          className="h-3 flex-1 overflow-hidden rounded-full bg-white/80"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={index + (selected !== null ? 1 : 0)}
        >
          <div
            className="h-full rounded-full bg-pop-purple transition-[width] duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div
          className="flex items-center gap-1.5 rounded-full bg-pop-yellow px-3 py-1.5 text-lg font-extrabold shadow-[0_4px_0_0_#e0b400] sm:text-2xl"
          aria-label={`النقاط ${score}`}
        >
          <Star className="size-6 fill-white text-white" aria-hidden />
          <span key={score} className="inline-block min-w-[1.5ch] text-center">
            {score}
          </span>
        </div>
      </header>

      <h2 className="py-1 text-center text-[clamp(1.375rem,min(6.5vw,5.5dvh),2.75rem)] leading-snug font-extrabold">
        {question.question}
      </h2>

      <div className="grid min-h-0 flex-1 grid-cols-2 grid-rows-2 gap-3 pb-2 sm:gap-6 short:grid-cols-4 short:grid-rows-1 short:gap-3">
        {question.answers.map((answer, i) => (
          <AnswerCard
            key={answer.id}
            answer={answer}
            index={i}
            selected={selected}
            correct={question.correct}
            onSelect={onSelect}
          />
        ))}
      </div>

      <p className="sr-only" aria-live="polite">
        {selected === null ? "" : answeredRight ? "إجابة صحيحة" : "حاول مرة أخرى"}
      </p>
    </section>
  );
}
