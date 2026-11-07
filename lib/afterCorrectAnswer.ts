import { getMuted } from "@/lib/sounds";
import { playNarration } from "@/lib/speech";

export const NEXT_QUESTION_DELAY_MS = 2800;
export const POPUP_CLOSE_FALLBACK_MS = 1800;

type Options = {
  /** full URL of the correct-answer narration clip */
  audioSrc?: string | null;
  fallbackText: string;
  /** used when there is no clip, or sound is muted */
  fallbackMs: number;
  onContinue: () => void;
};

/**
 * After a correct tap: play the answer clip (if any), then continue.
 * Returns a cancel function for effect cleanup.
 */
export function afterCorrectAnswer({
  audioSrc,
  fallbackText,
  fallbackMs,
  onContinue,
}: Options): () => void {
  let cancelled = false;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const finish = () => {
    if (cancelled) return;
    cancelled = true;
    if (timer) clearTimeout(timer);
    onContinue();
  };

  if (audioSrc && !getMuted()) {
    playNarration(audioSrc, fallbackText, finish);
    // Safety if play is blocked and onEnd never fires.
    timer = setTimeout(finish, Math.max(fallbackMs * 4, 12000));
  } else {
    timer = setTimeout(finish, fallbackMs);
  }

  return () => {
    cancelled = true;
    if (timer) clearTimeout(timer);
  };
}
