import { LayoutGrid, RotateCcw } from "lucide-react";

type Props = {
  onPlayAgain: () => void;
  onChooseCategory: () => void;
  playAgainLabel?: string;
  chooseLabel?: string;
};

const BUTTON =
  "flex w-full items-center justify-center gap-3 rounded-full px-8 py-4 font-extrabold text-ink transition-transform duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] select-none hover:scale-105 active:translate-y-1 active:scale-95 short:py-2";

export default function EndActions({
  onPlayAgain,
  onChooseCategory,
  playAgainLabel = "العب مرة أخرى",
  chooseLabel = "اختر موضوعاً آخر",
}: Props) {
  return (
    <div className="relative z-10 mt-2 flex w-full max-w-xs flex-col gap-4 short:max-w-xl short:flex-row short:gap-3">
      <button
        type="button"
        onClick={onPlayAgain}
        className={`${BUTTON} bg-pop-mint text-[clamp(1.25rem,min(6vw,6dvh),2.25rem)] shadow-[0_8px_0_0_#34b98a] active:shadow-[0_3px_0_0_#34b98a]`}
      >
        <RotateCcw className="size-7 shrink-0" aria-hidden strokeWidth={3} />
        {playAgainLabel}
      </button>
      <button
        type="button"
        onClick={onChooseCategory}
        className={`${BUTTON} bg-pop-blue text-[clamp(1.125rem,min(5vw,5dvh),1.75rem)] shadow-[0_8px_0_0_#2aa5cc] active:shadow-[0_3px_0_0_#2aa5cc]`}
      >
        <LayoutGrid className="size-6 shrink-0" aria-hidden strokeWidth={3} />
        {chooseLabel}
      </button>
    </div>
  );
}
