import { motion } from "framer-motion";
import cueLogo from "@/assets/cue-it-logo.png";

const HeroSection = ({ children }: { children: React.ReactNode }) => {
  return (
    <section className="relative min-h-[70vh] flex flex-col items-center justify-center px-4 overflow-hidden circuit-lines">
      {/* Circuit pattern overlay */}
      <div className="absolute inset-0 z-0 circuit-pattern" />

      {/* Gradient orbs for depth */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-purple/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brand-cyan/8 rounded-full blur-3xl pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 text-center max-w-3xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.7 }}
          className="flex flex-col items-center gap-3"
        >
          <img src={cueLogo} alt="Cue It" className="h-48 sm:h-64 w-auto" />
          <p className="text-sm sm:text-base text-muted-foreground tracking-widest uppercase">Your Smart Streaming Assistant</p>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
        >
          See what your friends are binging, and where to binge it.
        </motion.p>

        {children}
      </div>
    </section>
  );
};

export default HeroSection;
