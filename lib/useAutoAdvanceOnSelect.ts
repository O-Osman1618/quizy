"use client";

import { useEffect } from "react";
import { NEXT_QUESTION_DELAY_MS } from "@/lib/afterCorrectAnswer";

/**
 * Category-quiz helper: after any answer is locked in, wait then call advance.
 * Story quiz uses afterCorrectAnswer instead so answer audio can finish first.
 */
export function useAutoAdvanceOnSelect(
  selected: string | null,
  advance: () => void,
  delayMs: number = NEXT_QUESTION_DELAY_MS,
) {
  useEffect(() => {
    if (selected === null) return;
    const timer = setTimeout(advance, delayMs);
    return () => clearTimeout(timer);
  }, [selected, advance, delayMs]);
}

export { NEXT_QUESTION_DELAY_MS };
