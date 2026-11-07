"use client";

import { useState } from "react";
import Image from "next/image";
import type { Scene } from "@/lib/stories";

type Props = {
  /** full URL of the real illustration; if it is missing or fails, a placeholder is drawn */
  src: string;
  scene: Scene;
};

/**
 * The page illustration. Until a real image exists (or if it fails to load),
 * a soft colored placeholder with big emoji stands in for it.
 */
export default function StoryIllustration({ src, scene }: Props) {
  const [failed, setFailed] = useState(false);

  if (!failed) {
    return (
      <div className="absolute inset-0">
        <Image
          src={src}
          alt=""
          fill
          priority
          sizes="(max-width: 700px) 100vw, 700px"
          className="object-contain"
          onError={() => setFailed(true)}
        />
      </div>
    );
  }

  return <ScenePlaceholder scene={scene} />;
}

function ScenePlaceholder({ scene }: { scene: Scene }) {
  return (
    <div
      aria-hidden
      className="absolute inset-0 overflow-hidden [container-type:size]"
      style={{
        background: `linear-gradient(180deg, ${scene.from}, ${scene.to})`,
      }}
    >
      <div className="absolute inset-x-0 top-[6%] flex items-start justify-around px-[6%]">
        {scene.decor.map((emoji, i) => (
          <span
            key={i}
            className="animate-float text-[min(15cqw,18cqh)] leading-none"
            style={{ animationDelay: `${i * 0.7}s` }}
          >
            {emoji}
          </span>
        ))}
      </div>

      {/* grass */}
      <div className="absolute inset-x-[-10%] bottom-[-18%] h-[38%] rounded-[50%] bg-emerald-300/70" />

      <div className="absolute inset-x-0 bottom-[8%] flex items-end justify-center gap-[3%] px-[4%]">
        {scene.characters.map((emoji, i) => (
          <span
            key={i}
            className="text-[min(38cqw,44cqh)] leading-none drop-shadow-md"
            style={{
              fontSize:
                scene.characters.length > 2 ? "min(30cqw,36cqh)" : undefined,
            }}
          >
            {emoji}
          </span>
        ))}
      </div>
    </div>
  );
}
