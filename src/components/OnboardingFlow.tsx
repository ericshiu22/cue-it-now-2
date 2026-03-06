import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Users, DollarSign, ArrowRight, ChevronLeft } from "lucide-react";
import cueLogo from "@/assets/cue-it-logo.png";

interface OnboardingFlowProps {
  onComplete: () => void;
}

const slides = [
  {
    icon: Search,
    title: "Tired of endless scrolling?",
    subtitle: "You spend 20+ minutes deciding what to watch — then give up.",
    description:
      "Cue It helps you discover what to watch next, fast. Search across all your services in one place and build a smart queue tailored to you.",
    accent: "brand-cyan",
  },
  {
    icon: Users,
    title: "What are your friends watching?",
    subtitle: "Great recommendations live in group chats you'll never find again.",
    description:
      "See what your friends are streaming in real-time. Share queues, compare tastes, and never miss a recommendation.",
    accent: "brand-purple",
  },
  {
    icon: DollarSign,
    title: "Paying for services you don't use?",
    subtitle: "The average household wastes $50+/month on idle subscriptions.",
    description:
      "Cue It tracks your subscription health, flags underused services, and guides you through smart swaps — so you only pay for what you actually watch.",
    accent: "brand-cyan",
  },
];

const OnboardingFlow = ({ onComplete }: OnboardingFlowProps) => {
  const [step, setStep] = useState(0);

  const handleNext = () => {
    if (step < slides.length - 1) {
      setStep(step + 1);
    } else {
      localStorage.setItem("cue-onboarding-done", "true");
      onComplete();
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const slide = slides[step];
  const Icon = slide.icon;

  return (
    <motion.div
      className="fixed inset-0 z-[150] bg-background flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="absolute inset-0 z-0 circuit-pattern" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[hsl(var(--brand-purple)/0.08)] rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[hsl(var(--brand-cyan)/0.06)] rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-6 pt-6">
        {step > 0 ? (
          <button onClick={handleBack} className="text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
        ) : (
          <div className="w-5" />
        )}
        <img src={cueLogo} alt="Cue It" className="h-10 w-auto" />
        <button
          onClick={() => {
            localStorage.setItem("cue-onboarding-done", "true");
            onComplete();
          }}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Skip
        </button>
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 max-w-lg mx-auto w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -60 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            className="flex flex-col items-center text-center w-full"
          >
            {/* Icon */}
            <motion.div
              className="w-24 h-24 rounded-2xl bg-gradient-brand flex items-center justify-center mb-8 glow-strong"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, duration: 0.4, type: "spring" }}
            >
              <Icon className="w-12 h-12 text-primary-foreground" />
            </motion.div>

            {/* Title */}
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3 leading-tight">
              {slide.title}
            </h2>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-muted-foreground font-medium mb-4">
              {slide.subtitle}
            </p>

            {/* Description */}
            <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
              {slide.description}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="relative z-10 px-6 pb-8 flex flex-col items-center gap-4 max-w-lg mx-auto w-full">
        {/* Progress dots */}
        <div className="flex gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === step
                  ? "w-8 bg-gradient-brand"
                  : "w-2 bg-muted-foreground/30"
              }`}
            />
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={handleNext}
          className="w-full py-3.5 rounded-xl bg-gradient-brand text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 glow hover:opacity-90 transition-opacity"
        >
          {step < slides.length - 1 ? "Next" : "Get Started"}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
};

export default OnboardingFlow;
