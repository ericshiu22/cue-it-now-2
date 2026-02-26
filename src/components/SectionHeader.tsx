import { ReactNode } from "react";
import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { motion } from "framer-motion";

interface SectionHeaderProps {
  title: string;
  subtitle: string;
  icon?: ReactNode;
}

const SectionHeader = ({ title, subtitle, icon }: SectionHeaderProps) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
    <div className="flex items-center gap-2">
      {icon}
      <h2 className="text-xl font-semibold text-foreground">{title}</h2>
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <button type="button" className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
            <Info className="h-4 w-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-[240px] text-xs z-[100]">
          <p>{subtitle}</p>
        </TooltipContent>
      </Tooltip>
    </div>
  </motion.div>
);

export default SectionHeader;
