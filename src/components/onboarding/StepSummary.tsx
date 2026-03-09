import { motion } from "framer-motion";
import { DollarSign, Clock, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  realCost: number;
  guessedSpend: number;
  searchTime: number;
  onStart: () => void;
}

export default function StepSummary({
  realCost,
  guessedSpend,
  searchTime,
  onStart,
}: Props) {
  const savings = Math.max(0, realCost - guessedSpend);
  const monthlyHours = ((searchTime * 30) / 60).toFixed(1);

  return (
    <div className="flex flex-col items-center justify-center min-h-[480px] space-y-8">
      {/* Savings reveal */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="glass-strong rounded-2xl p-8 text-center space-y-3 w-full max-w-sm"
      >
        <div className="mx-auto h-14 w-14 rounded-full bg-primary/20 flex items-center justify-center glow-strong">
          <DollarSign className="h-8 w-8 text-primary" />
        </div>
        <p className="text-sm text-muted-foreground">We found</p>
        <p className="text-4xl font-bold text-glow text-primary">
          ${savings > 0 ? savings.toFixed(2) : realCost.toFixed(2)}
        </p>
        <p className="text-sm text-muted-foreground">
          in potential monthly savings
        </p>
      </motion.div>

      {/* Time reveal */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
        className="glass rounded-2xl p-6 text-center space-y-2 w-full max-w-sm"
      >
        <Clock className="h-6 w-6 text-muted-foreground mx-auto" />
        <p className="text-sm text-muted-foreground">
          You spend{" "}
          <span className="text-foreground font-semibold">{monthlyHours} hours</span>{" "}
          a month searching.
        </p>
        <p className="text-xs text-muted-foreground">Let's get that back.</p>
      </motion.div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.7 }}
        className="w-full max-w-sm space-y-3"
      >
        <Button
          onClick={onStart}
          size="lg"
          className="w-full glow-strong gap-2 text-base"
        >
          <Zap className="h-5 w-5" />
          Start 10-Day Free Trial
        </Button>
        <p className="text-[11px] text-center text-muted-foreground">
          After the trial, just $1.99/mo. Cancel anytime.
        </p>
      </motion.div>
    </div>
  );
}
