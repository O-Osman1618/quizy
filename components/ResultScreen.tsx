import { Medal } from "lucide-react";
import { questionsWord } from "@/lib/quiz";
import EndActions from "./EndActions";

type Props = {
  score: number;
  total: number;
  onPlayAgain: () => void;
  onChooseCategory: () => void;
};

export default function ResultScreen({
  score,
  total,
  onPlayAgain,
  onChooseCategory,
}: Props) {
  return (
    <section className="flex flex-1 flex-col items-center justify-center gap-5 text-center short:gap-2">
      <Medal
        aria-hidden
        className="size-[clamp(3.5rem,min(28vw,20dvh),10rem)] animate-pop text-pop-purple"
        strokeWidth={1.5}
      />
      <h1 className="animate-rise text-[clamp(1.75rem,min(9vw,8dvh),3.75rem)] leading-tight font-extrabold">
        محاولة رائعة! 💪
      </h1>
      <p className="text-[clamp(1.25rem,5vw,2rem)] font-bold">
        أجبت على {score} من {total} {questionsWord(total)} بشكل صحيح
      </p>
      <p className="text-[clamp(1.125rem,4.5vw,1.5rem)]">
        جرّب مرة ثانية وستفوز!
      </p>
      <EndActions
        onPlayAgain={onPlayAgain}
        onChooseCategory={onChooseCategory}
      />
    </section>
  );
}
