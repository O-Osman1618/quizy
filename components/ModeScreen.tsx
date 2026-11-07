type Props = {
  onQuiz: () => void;
  onStories: () => void;
};

const BASE =
  "flex min-h-0 flex-col items-center justify-center gap-1 rounded-[2rem] p-2 transition-transform duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] select-none hover:scale-[1.03] active:translate-y-1 active:scale-95 short:gap-0";

export default function ModeScreen({ onQuiz, onStories }: Props) {
  return (
    <section className="flex flex-1 flex-col gap-3 sm:gap-5 short:gap-2">
      <h1 className="animate-rise px-14 py-1 text-center text-[clamp(1.75rem,min(8vw,7dvh),3rem)] leading-snug font-extrabold">
        ماذا نلعب اليوم؟
      </h1>

      <div className="grid min-h-0 flex-1 grid-cols-1 grid-rows-2 gap-4 pb-2 sm:gap-6 short:grid-cols-2 short:grid-rows-1">
        <button
          type="button"
          onClick={onQuiz}
          className={`${BASE} bg-purple-200 shadow-[0_8px_0_0_#c4b5fd]`}
        >
          <span
            aria-hidden
            className="text-[clamp(3.5rem,min(24vw,16dvh),8rem)] leading-none"
          >
            🧠
          </span>
          <span className="text-[clamp(1.5rem,min(8vw,6dvh),2.5rem)] leading-tight font-extrabold">
            الأسئلة
          </span>
        </button>
        <button
          type="button"
          onClick={onStories}
          className={`${BASE} bg-pink-200 shadow-[0_8px_0_0_#f9a8d4]`}
        >
          <span
            aria-hidden
            className="text-[clamp(3.5rem,min(24vw,16dvh),8rem)] leading-none"
          >
            📖
          </span>
          <span className="text-[clamp(1.5rem,min(8vw,6dvh),2.5rem)] leading-tight font-extrabold">
            القصص
          </span>
        </button>
      </div>
    </section>
  );
}
