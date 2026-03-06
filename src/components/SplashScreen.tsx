import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import cueLogo from "@/assets/cue-it-logo.png";

const headlines = [
  "Tired of endless scrolling?",
  "Wonder what your friends are watching?",
  "Paying for services you don't use?",
];

const SplashScreen = ({ onComplete }: { onComplete: () => void }) => {
  const [headlineIndex, setHeadlineIndex] = useState(0);
  const [showFinal, setShowFinal] = useState(false);

  useEffect(() => {
    // Cycle headlines every 1.2s, then show final taglines
    const interval = setInterval(() => {
      setHeadlineIndex((prev) => {
        if (prev < headlines.length - 1) return prev + 1;
        clearInterval(interval);
        setTimeout(() => setShowFinal(true), 800);
        return prev;
      });
    }, 1200);

    const dismiss = setTimeout(onComplete, 1200 * headlines.length + 4200);
    return () => {
      clearInterval(interval);
      clearTimeout(dismiss);
    };
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-[200] bg-background flex flex-col items-center justify-center"
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="absolute inset-0 z-0 circuit-pattern" />
      <motion.div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-purple/10 rounded-full blur-3xl pointer-events-none" />
      <motion.div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brand-cyan/8 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center">
        <motion.img
          src={cueLogo}
          alt="Cue It"
          className="h-48 sm:h-64 w-auto"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />

        <div className="mt-6 h-16 flex items-center justify-center">
          <AnimatePresence mode="wait">
            {!showFinal ? (
              <motion.p
                key={headlineIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="text-base sm:text-lg md:text-xl text-muted-foreground font-medium text-center"
              >
                {headlines[headlineIndex]}
              </motion.p>
            ) : (
              <motion.div
                key="final"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7 }}
                className="flex flex-col items-center"
              >
                <p className="text-sm sm:text-base text-muted-foreground tracking-widest uppercase">
                  Your Smart Streaming Assistant
                </p>
                <p className="mt-3 text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed">
                  Check the Feed. Find your Flow. Cue It.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

export default SplashScreen;
