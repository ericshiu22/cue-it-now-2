import { useEffect } from "react";
import { motion } from "framer-motion";
import cueLogo from "@/assets/cue-it-logo.png";

const SplashScreen = ({ onComplete }: { onComplete: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 3500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-[200] bg-background flex flex-col items-center justify-center"
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="absolute inset-0 z-0 circuit-pattern" />
      <motion.div
        className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-purple/10 rounded-full blur-3xl pointer-events-none"
      />
      <motion.div
        className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brand-cyan/8 rounded-full blur-3xl pointer-events-none"
      />

      <div className="relative z-10 flex flex-col items-center">
        <motion.img
          src={cueLogo}
          alt="Cue It"
          className="h-48 sm:h-64 w-auto"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
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
      </div>
    </motion.div>
  );
};

export default SplashScreen;
