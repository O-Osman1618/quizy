import { Play } from "lucide-react";

type Props = {
  onStart: () => void;
};

export default function StartScreen({ onStart }: Props) {
  return (
    <section className="flex flex-1 flex-col items-center justify-center gap-10 text-center">
      <h1 className="animate-rise text-[clamp(2.25rem,9vw,4.5rem)] leading-tight font-extrabold text-ink">
        أهلا وسهلا بك يا خليل
      </h1>
      <button
        type="button"
        onClick={onStart}
        className="flex w-full max-w-xs items-center justify-center gap-3 rounded-full bg-pop-yellow px-8 py-4 text-[clamp(1.75rem,7vw,2.5rem)] font-extrabold text-ink shadow-[0_8px_0_0_#e0b400] transition-transform duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] select-none hover:scale-105 active:translate-y-1 active:scale-95 active:shadow-[0_3px_0_0_#e0b400]"
      >
        <Play className="size-8 fill-current" aria-hidden />
        ابدأ
      </button>
    </section>
  );
}
