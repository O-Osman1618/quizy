"use client";

import { useCallback, useEffect, useState } from "react";
import {
  categories,
  passMark,
  prepareRound,
  type Category,
  type Phase,
  type Question,
} from "@/lib/quiz";
import {
  playCelebrate,
  playCorrect,
  playTap,
  playTryAgain,
  playWrong,
} from "@/lib/sounds";
import { speakQuestion, stopSpeech, unlockAudio } from "@/lib/speech";
import { stories, type Story } from "@/lib/stories";
import BackButton from "./BackButton";
import CategoryScreen from "./CategoryScreen";
import CelebrationScreen from "./CelebrationScreen";
import ModeScreen from "./ModeScreen";
import QuizScreen from "./QuizScreen";
import StoryListScreen from "./StoryListScreen";
import StoryQuiz from "./StoryQuiz";
import StoryReader from "./StoryReader";
import SoundToggle from "./SoundToggle";
import ResultScreen from "./ResultScreen";
import StartScreen from "./StartScreen";

// Long enough for a young child to see which answer was right before moving on.
const NEXT_QUESTION_DELAY_MS = 2800;

export default function QuizGame() {
  const [phase, setPhase] = useState<Phase>("start");
  const [category, setCategory] = useState<Category | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [story, setStory] = useState<Story | null>(null);
  const [storyScore, setStoryScore] = useState(0);

  const total = questions.length;

  // After an answer is picked, wait briefly then move on automatically.
  useEffect(() => {
    if (selected === null) return;

    const timer = setTimeout(() => {
      if (index + 1 >= total) {
        if (score >= passMark(total)) {
          playCelebrate();
          setPhase("celebration");
        } else {
          playTryAgain();
          setPhase("result");
        }
      } else {
        setIndex(index + 1);
        setSelected(null);
        if (category) speakQuestion(category.id, questions[index + 1]);
      }
    }, NEXT_QUESTION_DELAY_MS);

    return () => clearTimeout(timer);
  }, [selected, index, total, score, category, questions]);

  function showModes() {
    stopSpeech();
    playTap();
    setPhase("modes");
  }

  function showStories() {
    stopSpeech();
    playTap();
    setPhase("stories");
  }

  function startStory(chosen: Story) {
    playTap();
    // Called straight from the tap, so the browser allows audio from here on.
    unlockAudio();
    setStory(chosen);
    setPhase("story");
  }

  function finishStory() {
    setPhase("storyQuiz");
  }

  const finishStoryQuiz = useCallback((finalScore: number) => {
    playCelebrate();
    setStoryScore(finalScore);
    setPhase("storyEnd");
  }, []);

  function showCategories() {
    stopSpeech();
    playTap();
    setPhase("categories");
  }

  function startRound(chosen: Category) {
    playTap();
    setCategory(chosen);
    const round = prepareRound(chosen);
    setQuestions(round);
    // Called straight from the tap, so the browser allows audio from here on.
    speakQuestion(chosen.id, round[0]);
    setIndex(0);
    setScore(0);
    setSelected(null);
    setPhase("playing");
  }

  function handleSelect(answerId: string) {
    if (selected !== null) return;
    stopSpeech();
    setSelected(answerId);
    if (answerId === questions[index].correct) {
      setScore((s) => s + 1);
      playCorrect();
    } else {
      playWrong();
    }
  }

  return (
    <main className="relative mx-auto flex min-h-dvh w-full max-w-2xl flex-col px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6 sm:pt-[max(2rem,env(safe-area-inset-top))] sm:pb-[max(2rem,env(safe-area-inset-bottom))] short:pt-[max(0.5rem,env(safe-area-inset-top))] short:pb-[max(0.5rem,env(safe-area-inset-bottom))]">
      {phase !== "playing" &&
        phase !== "story" &&
        phase !== "storyQuiz" && (
        <div className="absolute end-4 top-[max(1rem,env(safe-area-inset-top))] z-20 sm:end-6 short:top-2">
          <SoundToggle />
        </div>
      )}
      {phase === "modes" && <BackButton onClick={() => setPhase("start")} />}
      {phase === "categories" && <BackButton onClick={showModes} />}
      {phase === "stories" && <BackButton onClick={showModes} />}
      {phase === "start" && <StartScreen onStart={showModes} />}
      {phase === "modes" && (
        <ModeScreen onQuiz={showCategories} onStories={showStories} />
      )}
      {phase === "categories" && (
        <CategoryScreen categories={categories} onSelect={startRound} />
      )}
      {phase === "stories" && (
        <StoryListScreen stories={stories} onSelect={startStory} />
      )}
      {phase === "story" && story && (
        <StoryReader story={story} onExit={showStories} onFinish={finishStory} />
      )}
      {phase === "storyQuiz" && story && (
        <StoryQuiz story={story} onDone={finishStoryQuiz} />
      )}
      {phase === "storyEnd" && story && (
        <CelebrationScreen
          score={storyScore}
          total={story.quiz.length}
          showStars
          playAgainLabel="اقرأ القصة مرة أخرى"
          chooseLabel="قصص أخرى"
          onPlayAgain={() => startStory(story)}
          onChooseCategory={showStories}
        />
      )}
      {phase === "playing" && (
        <QuizScreen
          question={questions[index]}
          index={index}
          total={total}
          score={score}
          selected={selected}
          onSelect={handleSelect}
          onReplay={() => category && speakQuestion(category.id, questions[index])}
        />
      )}
      {phase === "celebration" && (
        <CelebrationScreen
          score={score}
          total={total}
          onPlayAgain={() => category && startRound(category)}
          onChooseCategory={showCategories}
        />
      )}
      {phase === "result" && (
        <ResultScreen
          score={score}
          total={total}
          onPlayAgain={() => category && startRound(category)}
          onChooseCategory={showCategories}
        />
      )}
    </main>
  );
}
