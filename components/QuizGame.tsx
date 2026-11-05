"use client";

import { useEffect, useState } from "react";
import { passMark, prepareRound, type Phase, type Question } from "@/lib/quiz";
import CelebrationScreen from "./CelebrationScreen";
import QuizScreen from "./QuizScreen";
import ResultScreen from "./ResultScreen";
import StartScreen from "./StartScreen";

const NEXT_QUESTION_DELAY_MS = 1300;

export default function QuizGame() {
  const [phase, setPhase] = useState<Phase>("start");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);

  const total = questions.length;

  // After an answer is picked, wait briefly then move on automatically.
  useEffect(() => {
    if (selected === null) return;

    const timer = setTimeout(() => {
      if (index + 1 >= total) {
        setPhase(score >= passMark(total) ? "celebration" : "result");
      } else {
        setIndex(index + 1);
        setSelected(null);
      }
    }, NEXT_QUESTION_DELAY_MS);

    return () => clearTimeout(timer);
  }, [selected, index, total, score]);

  function startGame() {
    setQuestions(prepareRound());
    setIndex(0);
    setScore(0);
    setSelected(null);
    setPhase("playing");
  }

  function handleSelect(answerId: string) {
    if (selected !== null) return;
    setSelected(answerId);
    if (answerId === questions[index].correct) {
      setScore((s) => s + 1);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6 sm:pt-[max(2rem,env(safe-area-inset-top))] sm:pb-[max(2rem,env(safe-area-inset-bottom))] short:pt-[max(0.5rem,env(safe-area-inset-top))] short:pb-[max(0.5rem,env(safe-area-inset-bottom))]">
      {phase === "start" && <StartScreen onStart={startGame} />}
      {phase === "playing" && (
        <QuizScreen
          question={questions[index]}
          index={index}
          total={total}
          score={score}
          selected={selected}
          onSelect={handleSelect}
        />
      )}
      {phase === "celebration" && (
        <CelebrationScreen score={score} total={total} onRestart={startGame} />
      )}
      {phase === "result" && (
        <ResultScreen score={score} total={total} onRestart={startGame} />
      )}
    </main>
  );
}
