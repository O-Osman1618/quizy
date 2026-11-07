"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AudioLines, Check, ChevronLeft, ChevronRight, X } from "lucide-react";
import { playTap } from "@/lib/sounds";
import { assetUrl, type Story } from "@/lib/stories";
import { playNarration, playSfx, stopSpeech } from "@/lib/speech";
import SoundToggle from "./SoundToggle";
import StoryIllustration from "./StoryIllustration";
import StoryQuestionPopup from "./StoryQuestionPopup";

type Props = {
  story: Story;
  /** leave the story and go back to the list */
  onExit: () => void;
  /** the last page was turned: time for the quiz */
  onFinish: () => void;
};

const QUESTION_POPUP_DELAY_MS = 700;

const ARROW =
  "absolute top-1/2 z-10 grid size-14 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-ink shadow-[0_4px_0_0_#cbd5e1] backdrop-blur transition-transform duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] select-none hover:scale-110 active:scale-90 sm:size-16 short:size-12";

export default function StoryReader({ story, onExit, onFinish }: Props) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState<"next" | "prev">("next");
  const [questionOpen, setQuestionOpen] = useState(false);
  // Pages whose pop-up question has already been answered.
  const answered = useRef<Set<number>>(new Set());

  const page = story.pages[index];
  const isLast = index === story.pages.length - 1;

  const narrate = useCallback(
    (pageIndex: number) => {
      const p = story.pages[pageIndex];
      if (p.sfx) playSfx(assetUrl(story.id, "audio", p.sfx));
      playNarration(
        assetUrl(story.id, "audio", p.audio),
        p.text,
        // When the narrator finishes a page that has a question, ask it.
        () => {
          if (p.question && !answered.current.has(p.id)) {
            setTimeout(() => setQuestionOpen(true), QUESTION_POPUP_DELAY_MS);
          }
        },
      );
    },
    [story],
  );

  // Start reading the first page, and stop all audio when leaving the story.
  useEffect(() => {
    narrate(0);
    return stopSpeech;
  }, [narrate]);

  function goTo(next: number) {
    setDirection(next > index ? "next" : "prev");
    setIndex(next);
    narrate(next);
  }

  function handleNext() {
    if (questionOpen) return;
    playTap();
    // The question is asked before leaving its page.
    if (page.question && !answered.current.has(page.id)) {
      stopSpeech();
      setQuestionOpen(true);
      return;
    }
    if (isLast) {
      stopSpeech();
      onFinish();
      return;
    }
    goTo(index + 1);
  }

  function handlePrev() {
    if (questionOpen || index === 0) return;
    playTap();
    goTo(index - 1);
  }

  function handleAnswered() {
    answered.current.add(page.id);
    setQuestionOpen(false);
    if (isLast) {
      onFinish();
    } else {
      goTo(index + 1);
    }
  }

  // Keyboard: in right-to-left reading, the left arrow turns to the next page.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") handleNext();
      if (e.key === "ArrowRight") handlePrev();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <section className="flex flex-1 flex-col gap-3 sm:gap-4 short:gap-2">
      <header className="flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={() => {
            playTap();
            stopSpeech();
            onExit();
          }}
          aria-label="خروج من القصة"
          className="grid size-11 shrink-0 place-items-center rounded-full bg-white/80 text-ink shadow-[0_4px_0_0_#cbd5e1] transition-transform duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] select-none hover:scale-110 active:translate-y-0.5 active:scale-90"
        >
          <X className="size-6" aria-hidden strokeWidth={3} />
        </button>

        <div
          className="flex flex-1 items-center justify-center gap-2"
          role="progressbar"
          aria-label="صفحات القصة"
          aria-valuemin={1}
          aria-valuemax={story.pages.length}
          aria-valuenow={index + 1}
        >
          {story.pages.map((p, i) => (
            <span
              key={p.id}
              className={`h-3 rounded-full transition-all duration-300 ${
                i === index
                  ? "w-8 bg-pop-purple"
                  : i < index
                    ? "w-3 bg-pop-purple/60"
                    : "w-3 bg-white/90"
              }`}
            />
          ))}
        </div>

        <SoundToggle />
      </header>

      <div className="flex min-h-0 flex-1 flex-col rounded-[2rem] bg-white/70 p-2 shadow-[0_8px_0_0_#c7d7f5] sm:p-3">
        <div
          key={page.id}
          className={`flex min-h-0 flex-1 gap-3 flex-col short:flex-row ${
            direction === "next" ? "animate-page-next" : "animate-page-prev"
          }`}
        >
          <div className="relative min-h-[40dvh] flex-1 overflow-hidden rounded-[1.5rem] short:min-h-[62dvh]">
            <StoryIllustration
              key={page.id}
              src={assetUrl(story.id, "images", page.image)}
              scene={page.scene}
            />

            {index > 0 && (
              <button
                type="button"
                onClick={handlePrev}
                aria-label="الصفحة السابقة"
                className={`${ARROW} right-2`}
              >
                <ChevronRight className="size-9" aria-hidden strokeWidth={3} />
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              aria-label={isLast ? "هيا نلعب" : "الصفحة التالية"}
              className={`${ARROW} left-2 ${
                isLast ? "animate-pulse-ring bg-green-400 text-white" : ""
              }`}
            >
              {isLast ? (
                <Check className="size-9" aria-hidden strokeWidth={4} />
              ) : (
                <ChevronLeft className="size-9" aria-hidden strokeWidth={3} />
              )}
            </button>
          </div>

          <div className="flex shrink-0 items-center justify-center gap-3 px-1 pb-1 short:w-[38%] short:flex-col short:justify-center">
            <p className="text-center text-[clamp(1.375rem,min(6vw,4.4dvh),2.25rem)] leading-relaxed font-extrabold short:text-[clamp(1.125rem,4.5dvh,1.75rem)]">
              {page.text}
            </p>
            <button
              type="button"
              onClick={() => narrate(index)}
              aria-label="اسمع القصة"
              className="grid size-12 shrink-0 place-items-center rounded-full bg-pop-purple text-white shadow-[0_4px_0_0_#7c5fe0] transition-transform duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] select-none hover:scale-110 active:translate-y-0.5 active:scale-90 short:size-10"
            >
              <AudioLines className="size-6" aria-hidden strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>

      {questionOpen && page.question && (
        <StoryQuestionPopup
          key={page.id}
          storyId={story.id}
          question={page.question}
          onCorrect={handleAnswered}
        />
      )}
    </section>
  );
}
