import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { Lock } from "lucide-react";
import type { ReactNode } from "react";

interface AuthGateTooltipProps {
  children: ReactNode;
}

const AuthGateTooltip = ({ children }: AuthGateTooltipProps) => {
  const { user } = useAuth();

  if (user) return <>{children}</>;

  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="relative">
            <div className="pointer-events-none opacity-50">{children}</div>
            <div className="absolute inset-0 cursor-not-allowed" />
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="flex items-center gap-2 bg-popover border-border">
          <Lock className="h-3 w-3 text-primary" />
          <span className="text-xs font-medium">
            Registration Required —{" "}
            <Link to="/auth" className="text-primary underline underline-offset-2 pointer-events-auto">
              Sign Up
            </Link>
          </span>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default AuthGateTooltip;
