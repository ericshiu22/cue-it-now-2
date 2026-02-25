import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import cueLogo from "@/assets/cue-it-logo.png";

const INTRO_DURATION = 3500;

const HeroSection = ({ children }: { children: React.ReactNode }) => {
  const [showIntro, setShowIntro] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowIntro(false), INTRO_DURATION);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section
      className={`relative flex flex-col items-center justify-center px-4 overflow-hidden circuit-lines transition-all duration-700 ease-in-out ${
        showIntro ? "min-h-screen" : "min-h-0 py-6"
      }`}
    >
      <div className="absolute inset-0 z-0 circuit-pattern" />

      <AnimatePresence>
        {showIntro && (
          <>
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
          </>
        )}
      </AnimatePresence>

      <div className="relative z-10 text-center max-w-3xl mx-auto space-y-6">
        <AnimatePresence>
          {showIntro && (
            <>
              <motion.div
                key="logo"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, y: -40, scale: 0.8 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="flex flex-col items-center gap-3"
              >
                <img src={cueLogo} alt="Cue It" className="h-48 sm:h-64 w-auto" />
              </motion.div>

              <motion.p
                key="subtitle"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ delay: 0.4, duration: 0.7 }}
                className="text-sm sm:text-base text-muted-foreground tracking-widest uppercase"
              >
                Your Smart Streaming Assistant
              </motion.p>

              <motion.p
                key="tagline"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: 0.9, duration: 0.7 }}
                className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
              >
                Check the Feed. Find your Flow. Cue It.
              </motion.p>
            </>
          )}
        </AnimatePresence>

        <motion.div layout transition={{ duration: 0.6, ease: "easeInOut" }}>
          {children}
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
