import { getMuted } from "@/lib/sounds";
import type { Question } from "@/lib/quiz";

/**
 * Reads text aloud using a pre-generated MP3 (questions: /public/audio, stories:
 * /public/stories/<id>/audio). If the file is missing or fails to load, falls
 * back to the browser's built-in Arabic voice.
 *
 * A single shared <audio> element is reused on purpose: once it has been
 * played from a tap, iOS Safari lets later clips play without another tap.
 */

let audio: HTMLAudioElement | null = null;
let sfx: HTMLAudioElement | null = null;
/** Bumped on every new clip or stop, so stale callbacks can tell they are outdated. */
let token = 0;

// A 0.1s silent WAV, used only to unlock audio playback inside a tap.
const SILENCE =
  "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQAAAAA=";

function getAudio(): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;
  if (!audio) audio = new Audio();
  return audio;
}

function speakWithBrowserVoice(text: string, onEnd?: () => void) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "ar-SA";
  utterance.rate = 0.9;
  if (onEnd) utterance.onend = onEnd;
  window.speechSynthesis.speak(utterance);
}

export function stopSpeech() {
  token++;
  if (audio) {
    audio.onerror = null;
    audio.onended = null;
    audio.pause();
  }
  if (sfx) sfx.pause();
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

/**
 * Call this directly from a tap handler before the first clip of a screen,
 * so the browser lets later narration start on its own.
 */
export function unlockAudio() {
  const el = getAudio();
  if (!el) return;
  el.src = SILENCE;
  el.play().catch(() => {});
}

/** Plays a narration clip; `onEnd` runs when it finishes (not if it is stopped or replaced). */
export function playNarration(
  src: string,
  fallbackText: string,
  onEnd?: () => void,
) {
  stopSpeech();
  if (getMuted()) return;

  const el = getAudio();
  if (!el) return;

  const mine = token;
  const finish = () => {
    if (mine === token && onEnd) onEnd();
  };

  el.onended = finish;
  el.onerror = () => {
    if (mine !== token) return;
    el.onerror = null;
    speakWithBrowserVoice(fallbackText, finish);
  };
  el.src = src;
  el.currentTime = 0;
  el.play().catch(() => {
    // Autoplay can be blocked until the first tap; replay buttons still work.
  });
}

/** A short sound effect that plays alongside narration without interrupting it. */
export function playSfx(src: string) {
  if (typeof window === "undefined" || getMuted()) return;
  if (!sfx) sfx = new Audio();
  sfx.src = src;
  sfx.volume = 0.6;
  sfx.play().catch(() => {});
}

export function speakQuestion(categoryId: string, question: Question) {
  playNarration(`/audio/${categoryId}-${question.id}.mp3`, question.question);
}
