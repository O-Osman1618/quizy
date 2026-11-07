import { useState } from "react";
import { Heart, PartyPopper, Sparkles, Star, Trophy } from "lucide-react";
import { questionsWord } from "@/lib/quiz";
import EndActions from "./EndActions";

type Props = {
  score: number;
  total: number;
  onPlayAgain: () => void;
  onChooseCategory: () => void;
  /** replaces the default heading */
  heading?: string;
  /** show a row of stars instead of the score sentence */
  showStars?: boolean;
  playAgainLabel?: string;
  chooseLabel?: string;
};

const CONFETTI_COLORS = [
  "#4cc9f0",
  "#ffd93d",
  "#6ee7b7",
  "#a78bfa",
  "#ff7eb6",
  "#fb923c",
];

type Piece = {
  left: number;
  delay: number;
  duration: number;
  size: number;
  drift: number;
  color: string;
  round: boolean;
};

function makePieces(): Piece[] {
  // Fewer pieces on small screens keeps the animation smooth on phones.
  const count = window.innerWidth < 640 ? 26 : 56;
  return Array.from({ length: count }, (_, i) => ({
    left: Math.random() * 100,
    delay: Math.random() * 2.5,
    duration: 3 + Math.random() * 3,
    size: 8 + Math.random() * 8,
    drift: (Math.random() - 0.5) * 160,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    round: Math.random() > 0.5,
  }));
}

const FLOATERS = [
  { Icon: Star, className: "top-[8%] start-[8%] text-pop-yellow", delay: "0s" },
  { Icon: Sparkles, className: "top-[14%] end-[10%] text-pop-purple", delay: "0.6s" },
  { Icon: Heart, className: "bottom-[12%] start-[12%] text-pink-400", delay: "1.2s" },
  { Icon: PartyPopper, className: "bottom-[16%] end-[8%] text-orange-400", delay: "1.8s" },
];

export default function CelebrationScreen({
  score,
  total,
  onPlayAgain,
  onChooseCategory,
  heading = "أحسنت يا بطل! 🎉",
  showStars = false,
  playAgainLabel,
  chooseLabel,
}: Props) {
  // This screen only mounts after user interaction (never during SSR),
  // so random values in the initializer cannot cause a hydration mismatch.
  const [pieces] = useState(makePieces);

  return (
    <section className="relative flex flex-1 flex-col items-center justify-center gap-5 text-center short:gap-2">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 overflow-hidden motion-reduce:hidden"
      >
        {pieces.map((p, i) => (
          <span
            key={i}
            className="absolute top-0 animate-confetti"
            style={
              {
                left: `${p.left}%`,
                width: p.size,
                height: p.round ? p.size : p.size * 1.6,
                backgroundColor: p.color,
                borderRadius: p.round ? "9999px" : "2px",
                animationDelay: `${p.delay}s`,
                animationDuration: `${p.duration}s`,
                "--drift": `${p.drift}px`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      {FLOATERS.map(({ Icon, className, delay }, i) => (
        <Icon
          key={i}
          aria-hidden
          className={`absolute size-[clamp(2rem,9vw,3.5rem)] animate-float ${className}`}
          style={{ animationDelay: delay }}
        />
      ))}

      <Trophy
        aria-hidden
        className="size-[clamp(4rem,min(32vw,24dvh),12rem)] animate-pop fill-pop-yellow text-amber-500"
        strokeWidth={1.5}
      />
      <h1 className="animate-rise text-[clamp(1.75rem,min(10vw,9dvh),4.5rem)] leading-tight font-extrabold">
        {heading}
      </h1>
      {showStars ? (
        <div
          className="flex items-center justify-center gap-2"
          role="img"
          aria-label={`${score} من ${total} نجوم`}
        >
          {Array.from({ length: total }, (_, i) => (
            <Star
              key={i}
              aria-hidden
              className={`size-[clamp(2.5rem,min(14vw,10dvh),4.5rem)] ${
                i < score
                  ? "animate-pop fill-pop-yellow text-amber-500"
                  : "fill-white/70 text-slate-300"
              }`}
              style={{ animationDelay: `${i * 0.25}s` }}
              strokeWidth={1.5}
            />
          ))}
        </div>
      ) : (
        <p className="text-[clamp(1.25rem,5vw,2rem)] font-bold">
          أجبت على {score} من {total} {questionsWord(total)} بشكل صحيح
        </p>
      )}
      <EndActions
        onPlayAgain={onPlayAgain}
        onChooseCategory={onChooseCategory}
        playAgainLabel={playAgainLabel}
        chooseLabel={chooseLabel}
      />
    </section>
  );
}
