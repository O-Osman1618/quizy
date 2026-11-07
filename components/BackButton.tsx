import { ArrowRight } from "lucide-react";
import { playTap } from "@/lib/sounds";

type Props = {
  onClick: () => void;
};

/** Round "back" button, pinned to the top-start corner (right side in Arabic). */
export default function BackButton({ onClick }: Props) {
  return (
    <button
      type="button"
      onClick={() => {
        playTap();
        onClick();
      }}
      aria-label="رجوع"
      className="absolute start-4 top-[max(1rem,env(safe-area-inset-top))] z-20 grid size-11 place-items-center rounded-full bg-white/80 text-ink shadow-[0_4px_0_0_#cbd5e1] transition-transform duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] select-none hover:scale-110 active:translate-y-0.5 active:scale-90 sm:start-6 short:top-2"
    >
      <ArrowRight className="size-6" aria-hidden strokeWidth={3} />
    </button>
  );
}
