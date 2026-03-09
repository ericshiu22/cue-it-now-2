import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Search, Share2, Clock, ChevronRight, ChevronLeft, Check } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SERVICE_LIST } from "@/lib/streaming-services";

/* ── 2026 standard monthly pricing ── */
const SERVICE_PRICES: Record<string, number> = {
  netflix: 15.49,
  max: 15.99,
  "disney+": 13.99,
  hulu: 17.99,
  "prime video": 14.99,
  "apple tv+": 9.99,
  peacock: 13.99,
  paramount: 12.99,
  crunchyroll: 7.99,
  tubi: 0,
  pluto: 0,
  discovery: 8.99,
  starz: 9.99,
  showtime: 11.99,
  mubi: 14.99,
  "amc+": 8.99,
};

const HABIT_OPTIONS = [
  { id: "friends", label: "Friend suggestions", icon: Users },
  { id: "search", label: "Search engines", icon: Search },
  { id: "social", label: "Social media", icon: Share2 },
];

interface OnboardingFlowProps {
  onComplete: (data: OnboardingData) => void;
}

export interface OnboardingData {
  habits: string[];
  searchTime: number;
  friendSuggestions: boolean;
  selectedServices: string[];
  guessedSpend: number;
  realCost: number;
}

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 300 : -300, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -300 : 300, opacity: 0 }),
};

export default function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);

  // Step 1 – Habit
  const [habits, setHabits] = useState<string[]>([]);
  const [searchTime, setSearchTime] = useState(15);
  const [friendSuggestions, setFriendSuggestions] = useState(true);

  // Step 2 – Audit
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [guessedSpend, setGuessedSpend] = useState<string>("");

  const realCost = selectedServices.reduce(
    (sum, id) => sum + (SERVICE_PRICES[id] ?? 0),
    0
  );

  const totalSteps = 2;

  const next = () => {
    if (step < totalSteps - 1) {
      setDirection(1);
      setStep((s) => s + 1);
    } else {
      onComplete({
        habits,
        searchTime,
        friendSuggestions,
        selectedServices,
        guessedSpend: parseFloat(guessedSpend) || 0,
        realCost,
      });
    }
  };

  const prev = () => {
    if (step > 0) {
      setDirection(-1);
      setStep((s) => s - 1);
    }
  };

  const toggleHabit = (id: string) =>
    setHabits((h) => (h.includes(id) ? h.filter((x) => x !== id) : [...h, id]));

  const toggleService = (id: string) =>
    setSelectedServices((s) =>
      s.includes(id) ? s.filter((x) => x !== id) : [...s, id]
    );

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 circuit-pattern pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-purple/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brand-cyan/8 rounded-full blur-3xl pointer-events-none" />

      {/* Progress bar */}
      <div className="relative z-10 w-full max-w-lg mb-8">
        <div className="flex items-center gap-2">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                i <= step
                  ? "bg-gradient-brand"
                  : "bg-muted"
              }`}
            />
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Step {step + 1} of {totalSteps}
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
              className="space-y-8"
            >
              {/* How do you find shows? */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-foreground">
                  How do you <span className="text-gradient">find shows</span>?
                </h2>
                <div className="grid grid-cols-3 gap-3">
                  {HABIT_OPTIONS.map((opt) => {
                    const active = habits.includes(opt.id);
                    const Icon = opt.icon;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => toggleHabit(opt.id)}
                        className={`glass rounded-xl p-4 flex flex-col items-center gap-2 transition-all duration-200 ${
                          active
                            ? "ring-2 ring-primary glow"
                            : "hover:ring-1 hover:ring-border"
                        }`}
                      >
                        <Icon
                          className={`h-7 w-7 ${
                            active ? "text-primary" : "text-muted-foreground"
                          }`}
                        />
                        <span
                          className={`text-xs font-medium text-center leading-tight ${
                            active ? "text-foreground" : "text-muted-foreground"
                          }`}
                        >
                          {opt.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Search Time slider */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    How much time do you waste searching per night?
                  </p>
                </div>
                <Slider
                  value={[searchTime]}
                  onValueChange={([v]) => setSearchTime(v)}
                  min={0}
                  max={60}
                  step={5}
                  className="w-full"
                />
                <p className="text-center text-lg font-semibold text-foreground">
                  {searchTime} <span className="text-sm text-muted-foreground font-normal">min</span>
                </p>
              </div>

              {/* Social toggle */}
              <div className="glass rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Friend suggestions
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Do you like getting suggestions from friends?
                  </p>
                </div>
                <Switch
                  checked={friendSuggestions}
                  onCheckedChange={setFriendSuggestions}
                />
              </div>
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
              className="space-y-6"
            >
              {/* Service grid */}
              <div className="space-y-3">
                <h2 className="text-2xl font-bold text-foreground">
                  The <span className="text-gradient">Audit</span>
                </h2>
                <p className="text-sm text-muted-foreground">
                  Select the streaming services you currently pay for.
                </p>

                <div className="grid grid-cols-4 gap-2.5">
                  {SERVICE_LIST.map((svc) => {
                    const active = selectedServices.includes(svc.id);
                    const price = SERVICE_PRICES[svc.id] ?? 0;
                    return (
                      <button
                        key={svc.id}
                        onClick={() => toggleService(svc.id)}
                        className={`glass rounded-xl p-3 flex flex-col items-center gap-1.5 transition-all duration-200 relative ${
                          active
                            ? "ring-2 ring-primary glow"
                            : "hover:ring-1 hover:ring-border"
                        }`}
                      >
                        {active && (
                          <div className="absolute top-1.5 right-1.5 h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                            <Check className="h-2.5 w-2.5 text-primary-foreground" />
                          </div>
                        )}
                        <span className="text-2xl">{svc.logo}</span>
                        <span
                          className={`text-[10px] font-medium text-center leading-tight ${
                            active ? "text-foreground" : "text-muted-foreground"
                          }`}
                        >
                          {svc.name}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {price === 0 ? "Free" : `$${price.toFixed(2)}`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Spending calculator */}
              <div className="glass rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      Your Guessed Spend
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                        $
                      </span>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={guessedSpend}
                        onChange={(e) => setGuessedSpend(e.target.value)}
                        className="pl-7 bg-secondary border-border"
                      />
                    </div>
                  </div>
                  <div className="flex-1 space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      Real Cost
                    </label>
                    <div className="h-10 rounded-md bg-secondary border border-border flex items-center px-3">
                      <span
                        className={`text-sm font-semibold ${
                          realCost > (parseFloat(guessedSpend) || 0)
                            ? "text-destructive"
                            : "text-primary"
                        }`}
                      >
                        ${realCost.toFixed(2)}
                      </span>
                      <span className="text-xs text-muted-foreground ml-1">/mo</span>
                    </div>
                  </div>
                </div>
                {guessedSpend && realCost > 0 && (
                  <motion.p
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-center text-muted-foreground"
                  >
                    {realCost > (parseFloat(guessedSpend) || 0)
                      ? `😬 You're spending $${(realCost - (parseFloat(guessedSpend) || 0)).toFixed(2)} more than you thought!`
                      : `👍 Nice estimate! You're within $${Math.abs(realCost - (parseFloat(guessedSpend) || 0)).toFixed(2)}.`}
                  </motion.p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
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
          {step === totalSteps - 1 ? "Get Started" : "Next"}{" "}
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
