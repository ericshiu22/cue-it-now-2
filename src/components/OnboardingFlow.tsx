import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import StepHabit from "./onboarding/StepHabit";
import StepAudit from "./onboarding/StepAudit";
import { SERVICE_PRICES } from "./onboarding/StepAudit";
import StepGenre from "./onboarding/StepGenre";
import StepProcessing from "./onboarding/StepProcessing";
import StepSummary from "./onboarding/StepSummary";
import { OnboardingData, ShowSelection } from "./onboarding/types";

export type { OnboardingData };

const STORAGE_KEY = "cue-onboarding-progress";
const TOTAL_STEPS = 5; // Habit, Audit, Genre, Processing, Summary

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 300 : -300, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -300 : 300, opacity: 0 }),
};

interface OnboardingFlowProps {
  onComplete: (data: OnboardingData) => void;
}

function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const saved = loadProgress();

  const [step, setStep] = useState<number>(saved?.step ?? 0);
  const [direction, setDirection] = useState(1);

  // Step 1
  const [habits, setHabits] = useState<string[]>(saved?.habits ?? []);
  const [searchTime, setSearchTime] = useState(saved?.searchTime ?? 15);
  const [friendSuggestions, setFriendSuggestions] = useState(saved?.friendSuggestions ?? true);

  // Step 2
  const [selectedServices, setSelectedServices] = useState<string[]>(saved?.selectedServices ?? []);
  const [guessedSpend, setGuessedSpend] = useState<string>(saved?.guessedSpend ?? "");

  // Step 3
  const [genres, setGenres] = useState<string[]>(saved?.genres ?? []);
  const [seenShows, setSeenShows] = useState<string[]>(saved?.seenShows ?? []);
  const [wantToWatch, setWantToWatch] = useState<ShowSelection[]>(saved?.wantToWatch ?? []);

  // Step 4 done
  const [processingDone, setProcessingDone] = useState(false);

  const realCost = selectedServices.reduce(
    (sum, id) => sum + (SERVICE_PRICES[id] ?? 0),
    0
  );

  // Persist progress
  useEffect(() => {
    if (step < 3) {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          step,
          habits,
          searchTime,
          friendSuggestions,
          selectedServices,
          guessedSpend,
          genres,
          seenShows,
          wantToWatch,
        })
      );
    }
  }, [step, habits, searchTime, friendSuggestions, selectedServices, guessedSpend, genres, seenShows, wantToWatch]);

  const next = () => {
    if (step < TOTAL_STEPS - 1) {
      setDirection(1);
      setStep((s) => s + 1);
    }
  };

  const prev = () => {
    if (step > 0 && step < 3) {
      setDirection(-1);
      setStep((s) => s - 1);
    }
  };

  const handleProcessingDone = useCallback(() => {
    setProcessingDone(true);
    setDirection(1);
    setStep(4);
  }, []);

  const handleStart = () => {
    localStorage.removeItem(STORAGE_KEY);
    onComplete({
      habits,
      searchTime,
      friendSuggestions,
      selectedServices,
      guessedSpend: parseFloat(guessedSpend) || 0,
      realCost,
      genres,
      seenShows,
      wantToWatch,
    });
  };

  const toggleHabit = (id: string) =>
    setHabits((h) => (h.includes(id) ? h.filter((x) => x !== id) : [...h, id]));

  const toggleService = (id: string) =>
    setSelectedServices((s) =>
      s.includes(id) ? s.filter((x) => x !== id) : [...s, id]
    );

  const toggleGenre = (g: string) =>
    setGenres((prev) =>
      prev.includes(g) ? prev.filter((x) => x !== g) : prev.length < 3 ? [...prev, g] : prev
    );

  const toggleSeen = (title: string) =>
    setSeenShows((prev) =>
      prev.includes(title) ? prev.filter((x) => x !== title) : [...prev, title]
    );

  const toggleWant = (show: ShowSelection) =>
    setWantToWatch((prev) =>
      prev.find((s) => s.title === show.title)
        ? prev.filter((s) => s.title !== show.title)
        : [...prev, show]
    );

  const isProcessingOrSummary = step >= 3;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 circuit-pattern pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-purple/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brand-cyan/8 rounded-full blur-3xl pointer-events-none" />

      {/* Glowing progress bar */}
      <div className="relative z-10 w-full max-w-lg mb-8">
        <div className="flex items-center gap-2">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                i <= step ? "bg-gradient-brand glow" : "bg-muted"
              }`}
            />
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Step {Math.min(step + 1, TOTAL_STEPS)} of {TOTAL_STEPS}
        </p>
      </div>

      {/* Slides */}
      <div className="relative z-10 w-full max-w-lg min-h-[480px]">
        <AnimatePresence mode="wait" custom={direction}>
          {step === 0 && (
            <motion.div
              key="habit"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: "easeInOut" }}
            >
              <StepHabit
                habits={habits}
                searchTime={searchTime}
                friendSuggestions={friendSuggestions}
                onToggleHabit={toggleHabit}
                onSearchTimeChange={setSearchTime}
                onFriendSuggestionsChange={setFriendSuggestions}
              />
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              key="audit"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: "easeInOut" }}
            >
              <StepAudit
                selectedServices={selectedServices}
                guessedSpend={guessedSpend}
                realCost={realCost}
                onToggleService={toggleService}
                onGuessedSpendChange={setGuessedSpend}
              />
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="genre"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: "easeInOut" }}
            >
              <StepGenre
                genres={genres}
                seenShows={seenShows}
                wantToWatch={wantToWatch}
                onToggleGenre={toggleGenre}
                onToggleSeen={toggleSeen}
                onToggleWant={toggleWant}
              />
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="processing"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: "easeInOut" }}
            >
              <StepProcessing onDone={handleProcessingDone} />
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="summary"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: "easeInOut" }}
            >
              <StepSummary
                realCost={realCost}
                guessedSpend={parseFloat(guessedSpend) || 0}
                searchTime={searchTime}
                onStart={handleStart}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation – hidden during processing/summary */}
      {!isProcessingOrSummary && (
        <div className="relative z-10 w-full max-w-lg flex items-center justify-between mt-8">
          <Button
            variant="ghost"
            onClick={prev}
            disabled={step === 0}
            className="gap-1"
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </Button>
          <Button onClick={next} className="gap-1 glow">
            {step === 2 ? "See My Results" : "Next"}{" "}
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
