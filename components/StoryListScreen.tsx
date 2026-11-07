import { assetUrl, type Story } from "@/lib/stories";
import StoryIllustration from "./StoryIllustration";

type Props = {
  stories: Story[];
  onSelect: (story: Story) => void;
};

export default function StoryListScreen({ stories, onSelect }: Props) {
  return (
    <section className="flex flex-1 flex-col gap-3 sm:gap-5 short:gap-2">
      <h1 className="animate-rise px-14 py-1 text-center text-[clamp(1.75rem,min(8vw,7dvh),3rem)] leading-snug font-extrabold">
        اختر قصة
      </h1>

      <div className="relative flex min-h-0 flex-1 flex-col justify-center">
        <div className="flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-6 pt-2 sm:justify-center sm:gap-8 sm:px-6 short:gap-4 short:pb-3">
          {stories.map((story) => (
            <button
              key={story.id}
              type="button"
              onClick={() => onSelect(story)}
              className="group relative flex w-[min(52vw,14rem)] shrink-0 snap-center flex-col items-center gap-3 transition-transform duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] select-none hover:-translate-y-1 hover:scale-[1.03] active:translate-y-1 active:scale-95 sm:w-[min(40vw,16rem)] short:w-[min(36vw,11rem)] short:gap-2"
            >
              {/* Book body: cover + spine thickness on the logical start edge */}
              <span className="relative aspect-[3/4] w-full">
                <span
                  aria-hidden
                  className="absolute inset-y-[3%] start-0 z-0 w-[0.55rem] -translate-x-px rounded-s-md bg-gradient-to-b from-[#c4b5fd] to-[#7c5fe0] shadow-[2px_0_0_0_rgba(43,45,91,0.12)] rtl:translate-x-px"
                />
                <span className="relative z-10 block h-full overflow-hidden rounded-[1rem] rounded-s-[0.35rem] bg-white shadow-[0_10px_0_0_#f9a8d4,4px_6px_18px_rgba(43,45,91,0.18)] ring-1 ring-ink/10">
                  <span className="absolute inset-0">
                    <StoryIllustration
                      key={story.id}
                      src={assetUrl(story.id, "images", story.cover)}
                      scene={story.coverScene}
                    />
                  </span>
                  {/* Soft page-edge highlight on the open side */}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-y-0 end-0 w-3 bg-gradient-to-l from-white/50 to-transparent"
                  />
                </span>
              </span>

              <span className="px-1 text-center text-[clamp(1.125rem,min(5.5vw,4.5dvh),1.75rem)] leading-snug font-extrabold">
                {story.title}
              </span>
            </button>
          ))}
        </div>

        {/* Shelf ledge */}
        <div
          aria-hidden
          className="mx-2 h-3 rounded-full bg-gradient-to-b from-[#fcd34d] to-[#f59e0b] shadow-[0_6px_0_0_#d97706] sm:mx-6 short:h-2"
        />
        <div
          aria-hidden
          className="mx-6 -mt-0.5 h-2 rounded-b-2xl bg-[#b45309]/35 sm:mx-10"
        />
      </div>
    </section>
  );
}
