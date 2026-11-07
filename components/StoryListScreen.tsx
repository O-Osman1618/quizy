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

      <div className="grid min-h-0 flex-1 auto-rows-fr grid-cols-1 gap-4 pb-2 sm:grid-cols-2 sm:gap-6 short:grid-flow-col short:grid-cols-none short:auto-cols-fr">
        {stories.map((story) => (
          <button
            key={story.id}
            type="button"
            onClick={() => onSelect(story)}
            className="flex min-h-0 flex-col gap-2 rounded-[2rem] bg-white/80 p-2 shadow-[0_8px_0_0_#f9a8d4] transition-transform duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] select-none hover:scale-[1.02] active:translate-y-1 active:scale-95 sm:p-3"
          >
            <span className="relative min-h-[30dvh] flex-1 overflow-hidden rounded-[1.5rem]">
              <StoryIllustration
                key={story.id}
                src={assetUrl(story.id, "images", story.cover)}
                scene={story.coverScene}
              />
            </span>
            <span className="px-2 pb-1 text-center text-[clamp(1.375rem,min(6.5vw,5dvh),2.25rem)] leading-snug font-extrabold">
              {story.title}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
