import type { Category } from "@/lib/quiz";

const COLORS = [
  "bg-sky-200 shadow-[0_8px_0_0_#7dd3fc]",
  "bg-yellow-200 shadow-[0_8px_0_0_#fde047]",
  "bg-emerald-200 shadow-[0_8px_0_0_#6ee7b7]",
  "bg-purple-200 shadow-[0_8px_0_0_#c4b5fd]",
  "bg-pink-200 shadow-[0_8px_0_0_#f9a8d4]",
];

type Props = {
  categories: Category[];
  onSelect: (category: Category) => void;
};

export default function CategoryScreen({ categories, onSelect }: Props) {
  const odd = categories.length % 2 === 1;

  return (
    <section className="flex flex-1 flex-col gap-3 sm:gap-5 short:gap-2">
      <h1 className="animate-rise px-14 py-1 text-center text-[clamp(1.75rem,min(8vw,7dvh),3rem)] leading-snug font-extrabold">
        اختر موضوعاً
      </h1>

      <div
        className="grid min-h-0 flex-1 auto-rows-fr grid-cols-2 gap-3 pb-2 sm:gap-6 short:grid-flow-col short:grid-cols-none short:grid-rows-1 short:auto-cols-fr short:gap-3"
      >
        {categories.map((category, i) => {
          // With an odd count, centre the last card on its own row (portrait only).
          const lastAlone = odd && i === categories.length - 1;
          return (
            <button
              key={category.id}
              type="button"
              onClick={() => onSelect(category)}
              className={`flex min-h-0 flex-col items-center justify-center gap-1 rounded-[2rem] p-2 transition-transform duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] select-none hover:scale-[1.03] active:translate-y-1 active:scale-95 ${
                COLORS[i % COLORS.length]
              } ${
                lastAlone
                  ? "col-span-2 w-[calc(50%-0.375rem)] justify-self-center sm:w-[calc(50%-0.75rem)] short:col-span-1 short:w-auto"
                  : ""
              }`}
            >
              <span
                aria-hidden
                className="text-[clamp(2.5rem,min(16vw,10dvh),5.5rem)] leading-none"
              >
                {category.emoji}
              </span>
              <span className="text-[clamp(1.125rem,min(5.5vw,4dvh),1.75rem)] leading-tight font-extrabold">
                {category.name}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
