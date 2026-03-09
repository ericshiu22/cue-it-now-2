import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const MESSAGES = [
  "Analyzing your streaming habits…",
  "Calculating potential savings…",
  "Building your Command Center…",
  "Almost ready…",
];

interface Props {
  onDone: () => void;
}

export default function StepProcessing({ onDone }: Props) {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((i) => {
        if (i >= MESSAGES.length - 1) {
          clearInterval(interval);
          setTimeout(onDone, 800);
          return i;
        }
        return i + 1;
      });
    }, 1200);
    return () => clearInterval(interval);
  }, [onDone]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-8">
      {/* Spinner */}
      <div className="relative h-24 w-24">
        <motion.div
          className="absolute inset-0 rounded-full border-4 border-primary/20"
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary"
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
        />
        <div className="absolute inset-2 rounded-full bg-primary/10 glow" />
      </div>

      <motion.p
        key={msgIndex}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="text-lg font-semibold text-foreground text-center"
      >
        {MESSAGES[msgIndex]}
      </motion.p>

      {/* Progress dots */}
      <div className="flex gap-2">
        {MESSAGES.map((_, i) => (
          <div
            key={i}
            className={`h-2 w-2 rounded-full transition-colors duration-300 ${
              i <= msgIndex ? "bg-primary glow" : "bg-muted"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
