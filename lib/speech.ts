import { getMuted } from "@/lib/sounds";
import type { Question } from "@/lib/quiz";

/**
 * Reads a question aloud using the pre-generated MP3 in /public/audio
 * (see scripts/generate-audio.py). If the file is missing or fails to load,
 * falls back to the browser's built-in Arabic voice.
 *
 * A single shared <audio> element is reused on purpose: once it has been
 * played from a tap, iOS Safari lets later questions play without another tap.
 */

let audio: HTMLAudioElement | null = null;

function getAudio(): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;
  if (!audio) audio = new Audio();
  return audio;
}

function speakWithBrowserVoice(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "ar-SA";
  utterance.rate = 0.9;
  window.speechSynthesis.speak(utterance);
}

export function stopSpeech() {
  if (audio) {
    audio.onerror = null;
    audio.pause();
  }
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

export function speakQuestion(categoryId: string, question: Question) {
  stopSpeech();
  if (getMuted()) return;

  const el = getAudio();
  if (!el) return;

  el.onerror = () => speakWithBrowserVoice(question.question);
  el.src = `/audio/${categoryId}-${question.id}.mp3`;
  el.currentTime = 0;
  el.play().catch(() => {
    // Autoplay can be blocked until the first tap; the replay button still works.
  });
}
