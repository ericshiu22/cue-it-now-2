import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import cueLogo from "@/assets/cue-it-logo.png";

const headlines = [
  { top: "Stop overpaying", bottom: "for streaming." },
  { top: "Find what you want to", bottom: "watch faster." },
];

const SplashScreen = ({ onComplete }: { onComplete: () => void }) => {
  const [phase, setPhase] = useState(0); // 0,1 = headlines, 2 = logo reveal

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 3000),
      setTimeout(() => setPhase(2), 6000),
      setTimeout(onComplete, 8000),
    ];
    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-[200] bg-background flex flex-col items-center justify-center overflow-hidden"
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="absolute inset-0 z-0 circuit-pattern" />
      <motion.div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-purple/10 rounded-full blur-3xl pointer-events-none" />
      <motion.div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brand-cyan/8 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center px-6 text-center">
        <AnimatePresence mode="wait">
          {phase < 2 && (
            <motion.div
              key={phase}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="flex flex-col items-center gap-2"
            >
              <h1 className="text-3xl sm:text-5xl font-bold text-foreground leading-tight">
                {headlines[phase].top}
              </h1>
              <p className="text-2xl sm:text-4xl font-semibold text-gradient leading-tight">
                {headlines[phase].bottom}
              </p>
            </motion.div>
          )}

          {phase === 2 && (
            <motion.div
              key="logo"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="flex flex-col items-center"
            >
              <motion.img
                src={cueLogo}
                alt="Cue It"
                className="h-48 sm:h-64 w-auto"
              />
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.7 }}
                className="mt-6 text-sm sm:text-base text-muted-foreground tracking-widest uppercase"
              >
                Your Smart Streaming Assistant
              </motion.p>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9, duration: 0.7 }}
                className="mt-3 text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed"
              >
                Check the Feed. Find your Flow. Cue It.
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default SplashScreen;
