import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import cueLogo from "@/assets/cue-it-logo.png";

const INTRO_DURATION = 3500;

const HeroSection = ({ children, onIntroComplete }: { children: React.ReactNode; onIntroComplete?: () => void }) => {
  const [showIntro, setShowIntro] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowIntro(false);
      onIntroComplete?.();
    }, INTRO_DURATION);
    return () => clearTimeout(timer);
  }, [onIntroComplete]);

  return (
    <>
      <AnimatePresence>
        {showIntro && (
          <motion.section
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="relative min-h-screen flex flex-col items-center justify-center px-4 overflow-hidden circuit-lines"
          >
            <div className="absolute inset-0 z-0 circuit-pattern" />
            <motion.div
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-purple/10 rounded-full blur-3xl pointer-events-none"
            />
            <motion.div
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brand-cyan/8 rounded-full blur-3xl pointer-events-none"
            />

            <div className="relative z-10 text-center max-w-3xl mx-auto space-y-6">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="flex flex-col items-center gap-3"
              >
                <img src={cueLogo} alt="Cue It" className="h-48 sm:h-64 w-auto" />
              </motion.div>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.7 }}
                className="text-sm sm:text-base text-muted-foreground tracking-widest uppercase"
              >
                Your Smart Streaming Assistant
              </motion.p>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9, duration: 0.7 }}
                className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
              >
                Check the Feed. Find your Flow. Cue It.
              </motion.p>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {!showIntro && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative py-6 px-4 circuit-lines"
        >
          <div className="absolute inset-0 z-0 circuit-pattern" />
          <div className="relative z-10 max-w-3xl mx-auto">
            {children}
          </div>
        </motion.section>
      )}
    </>
  );
};

export default HeroSection;
