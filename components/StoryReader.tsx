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
  const popupTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const indexRef = useRef(index);
  const questionOpenRef = useRef(questionOpen);

  const page = story.pages[index];
  const isLast = index === story.pages.length - 1;
  const total = story.pages.length;
  const progress = ((index + 1) / total) * 100;

  useEffect(() => {
    indexRef.current = index;
  }, [index]);

  useEffect(() => {
    questionOpenRef.current = questionOpen;
  }, [questionOpen]);

  const clearPopupTimer = useCallback(() => {
    if (popupTimer.current) {
      clearTimeout(popupTimer.current);
      popupTimer.current = null;
    }
  }, []);

  const openPopupSoon = useCallback(() => {
    clearPopupTimer();
    popupTimer.current = setTimeout(
      () => setQuestionOpen(true),
      QUESTION_POPUP_DELAY_MS,
    );
  }, [clearPopupTimer]);

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
            openPopupSoon();
          }
        },
      );
    },
    [story, openPopupSoon],
  );

  // Start reading the first page, and stop all audio when leaving the story.
  useEffect(() => {
    narrate(0);
    return () => {
      clearPopupTimer();
      stopSpeech();
    };
  }, [narrate, clearPopupTimer]);

  const goTo = useCallback(
    (next: number) => {
      clearPopupTimer();
      setDirection(next > indexRef.current ? "next" : "prev");
      setIndex(next);
      narrate(next);
    },
    [clearPopupTimer, narrate],
  );

  const handleNext = useCallback(() => {
    if (questionOpenRef.current) return;
    const i = indexRef.current;
    const current = story.pages[i];
    const last = i === story.pages.length - 1;
    playTap();
    // The question is asked before leaving its page.
    if (current.question && !answered.current.has(current.id)) {
      clearPopupTimer();
      stopSpeech();
      setQuestionOpen(true);
      return;
    }
    if (last) {
      stopSpeech();
      onFinish();
      return;
    }
    goTo(i + 1);
  }, [story, clearPopupTimer, goTo, onFinish]);

  const handlePrev = useCallback(() => {
    if (questionOpenRef.current || indexRef.current === 0) return;
    playTap();
    goTo(indexRef.current - 1);
  }, [goTo]);

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
  }, [handleNext, handlePrev]);

  return (
    <section className="flex flex-1 flex-col gap-3 sm:gap-4 short:gap-2">
      <header className="flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={() => {
            playTap();
            clearPopupTimer();
            stopSpeech();
            onExit();
          }}
          aria-label="خروج من القصة"
          className="grid size-11 shrink-0 place-items-center rounded-full bg-white/80 text-ink shadow-[0_4px_0_0_#cbd5e1] transition-transform duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] select-none hover:scale-110 active:translate-y-0.5 active:scale-90"
        >
          <X className="size-6" aria-hidden strokeWidth={3} />
        </button>

        <span className="text-base font-bold whitespace-nowrap sm:text-xl">
          صفحة {index + 1} / {total}
        </span>

        <div
          className="h-3 min-w-0 flex-1 overflow-hidden rounded-full bg-white/80"
          role="progressbar"
          aria-label="صفحات القصة"
          aria-valuemin={1}
          aria-valuemax={total}
          aria-valuenow={index + 1}
        >
          <div
            className="h-full rounded-full bg-pop-purple transition-[width] duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        <SoundToggle />
      </header>

      <div
        key={`page-${page.id}`}
        className={`flex min-h-0 flex-1 flex-col gap-3 ${
          page.image ? "short:flex-row" : ""
        } ${
          direction === "next" ? "animate-page-next" : "animate-page-prev"
        }`}
      >
        {page.image ? (
          <>
            <div className="relative min-h-[40dvh] flex-1 overflow-hidden short:min-h-0">
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

            <div className="flex min-h-0 shrink-0 flex-col items-center gap-3 px-1 pb-1 short:w-[38%] short:max-h-full short:justify-center">
              <p className="w-full max-w-prose whitespace-pre-line px-2 text-start text-[clamp(0.9375rem,min(3.8vw,2.8dvh),1.25rem)] leading-snug font-bold short:text-[clamp(0.8125rem,3.2dvh,1.0625rem)]">
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
          </>
        ) : (
          <div
            className="relative flex min-h-0 flex-1 flex-col items-center justify-center gap-5 overflow-hidden rounded-3xl px-6 py-8 sm:px-10"
            style={{
              background: `linear-gradient(180deg, ${page.scene.from}, ${page.scene.to})`,
            }}
          >
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

            <p className="w-full max-w-2xl whitespace-pre-line text-center text-[clamp(1.0625rem,min(4.2vw,3.2dvh),1.5rem)] leading-relaxed font-bold">
              {page.text}
            </p>
            <button
              type="button"
              onClick={() => narrate(index)}
              aria-label="اسمع القصة"
              className="grid size-12 shrink-0 place-items-center rounded-full bg-pop-purple text-white shadow-[0_4px_0_0_#7c5fe0] transition-transform duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] select-none hover:scale-110 active:translate-y-0.5 active:scale-90"
            >
              <AudioLines className="size-6" aria-hidden strokeWidth={2.5} />
            </button>
          </div>
        )}
      </div>

      {questionOpen && page.question && (
        <StoryQuestionPopup
          key={`popup-${page.id}`}
          storyId={story.id}
          question={page.question}
          onCorrect={handleAnswered}
        />
      )}
    </section>
  );
}
