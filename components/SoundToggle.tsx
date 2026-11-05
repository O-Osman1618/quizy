"use client";

import { useSyncExternalStore } from "react";
import { Volume2, VolumeX } from "lucide-react";
import {
  getMuted,
  getServerMuted,
  playTap,
  setMuted,
  subscribeMuted,
} from "@/lib/sounds";

export default function SoundToggle() {
  const muted = useSyncExternalStore(subscribeMuted, getMuted, getServerMuted);

  function toggle() {
    const next = !muted;
    setMuted(next);
    // Give feedback when turning the sound back on.
    if (!next) playTap();
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={muted}
      aria-label={muted ? "تشغيل الصوت" : "كتم الصوت"}
      className="grid size-11 shrink-0 place-items-center rounded-full bg-white/80 text-ink shadow-[0_4px_0_0_#cbd5e1] transition-transform duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] select-none hover:scale-110 active:translate-y-0.5 active:scale-90"
    >
      {muted ? (
        <VolumeX className="size-6" aria-hidden />
      ) : (
        <Volume2 className="size-6" aria-hidden />
      )}
    </button>
  );
}
