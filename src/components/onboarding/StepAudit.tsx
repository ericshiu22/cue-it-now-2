import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { SERVICE_LIST } from "@/lib/streaming-services";

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

export { SERVICE_PRICES };

interface Props {
  selectedServices: string[];
  guessedSpend: string;
  realCost: number;
  onToggleService: (id: string) => void;
  onGuessedSpendChange: (v: string) => void;
}

export default function StepAudit({
  selectedServices,
  guessedSpend,
  realCost,
  onToggleService,
  onGuessedSpendChange,
}: Props) {
  return (
    <div className="space-y-6">
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
                onClick={() => onToggleService(svc.id)}
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
                onChange={(e) => onGuessedSpendChange(e.target.value)}
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
    </div>
  );
}
