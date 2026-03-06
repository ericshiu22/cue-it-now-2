import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Users, DollarSign, ArrowRight, ChevronLeft } from "lucide-react";
import TermsOfService from "@/components/TermsOfService";
import NoticeAtCollection from "@/components/NoticeAtCollection";
import cueLogo from "@/assets/cue-it-logo.png";

const onboardingSlides = [
  {
    icon: Search,
    title: "Tired of endless scrolling?",
    subtitle: "You spend 20+ minutes deciding what to watch — then give up.",
    description:
      "Cue It helps you discover what to watch next, fast. Search across all your services in one place and build a smart queue tailored to you.",
  },
  {
    icon: Users,
    title: "Wonder what your friends are watching?",
    subtitle: "Great recommendations live in group chats you'll never find again.",
    description:
      "See what your friends are streaming in real-time. Share queues, compare tastes, and never miss a recommendation.",
  },
  {
    icon: DollarSign,
    title: "Paying for services you don't use?",
    subtitle: "The average household wastes $50+/month on idle subscriptions.",
    description:
      "Cue It tracks your subscription health, flags underused services, and guides you through smart swaps — so you only pay for what you actually watch.",
  },
];

const Auth = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [agreedToTos, setAgreedToTos] = useState(false);
  const [tosOpen, setTosOpen] = useState(false);
  const [agreedToNotice, setAgreedToNotice] = useState(false);
  const [noticeOpen, setNoticeOpen] = useState(false);
  const { signIn, signUp } = useAuth();

  // Onboarding step: -1 means show the registration form, 0-2 are slides
  const [onboardingStep, setOnboardingStep] = useState(0);
  const showOnboarding = !isLogin && onboardingStep >= 0 && onboardingStep < onboardingSlides.length;

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLogin && !agreedToTos) {
      toast.error("You must agree to the Terms of Service to create an account.");
      return;
    }
    if (!isLogin && !agreedToNotice) {
      toast.error("You must acknowledge the Notice at Collection.");
      return;
    }
    setLoading(true);
    const { error } = isLogin
      ? await signIn(email, password)
      : await signUp(email, password);
    setLoading(false);

    if (error) {
      toast.error(error.message);
    } else if (!isLogin) {
      toast.success("Account created! Let's set up your subscriptions.");
      const needsSubOnboarding = !localStorage.getItem("cue-subs-onboarded");
      if (needsSubOnboarding) {
        navigate("/onboarding-subs", { replace: true });
        return;
      }
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error("Enter your email first.");
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Recovery link sent! Check your email.");
    }
  };

  const handleNextSlide = () => {
    if (onboardingStep < onboardingSlides.length - 1) {
      setOnboardingStep(onboardingStep + 1);
    } else {
      // Done with slides, show form
      setOnboardingStep(-1);
    }
  };

  const handleBackSlide = () => {
    if (onboardingStep > 0) {
      setOnboardingStep(onboardingStep - 1);
    }
  };

  const handleSwitchToSignup = () => {
    setIsLogin(false);
    setOnboardingStep(0); // Start onboarding from first slide
  };

  // ── Onboarding slides view ──
  if (showOnboarding) {
    const slide = onboardingSlides[onboardingStep];
    const Icon = slide.icon;

    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="absolute inset-0 z-0 circuit-pattern pointer-events-none" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[hsl(var(--brand-purple)/0.08)] rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[hsl(var(--brand-cyan)/0.06)] rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="relative z-10 flex items-center justify-between px-6 pt-6">
          {onboardingStep > 0 ? (
            <button onClick={handleBackSlide} className="text-muted-foreground hover:text-foreground transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
          ) : (
            <div className="w-5" />
          )}
          <img src={cueLogo} alt="Cue It" className="h-10 w-auto" />
          <button
            onClick={() => setOnboardingStep(-1)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip
          </button>
        </div>

        {/* Content */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 max-w-lg mx-auto w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={onboardingStep}
              initial={{ opacity: 0, x: 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -60 }}
              transition={{ duration: 0.35, ease: "easeInOut" }}
              className="flex flex-col items-center text-center w-full"
            >
              <motion.div
                className="w-24 h-24 rounded-2xl bg-gradient-brand flex items-center justify-center mb-8 glow-strong"
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, duration: 0.4, type: "spring" }}
              >
                <Icon className="w-12 h-12 text-primary-foreground" />
              </motion.div>

              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3 leading-tight">
                {slide.title}
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground font-medium mb-4">
                {slide.subtitle}
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
                {slide.description}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="relative z-10 px-6 pb-8 flex flex-col items-center gap-4 max-w-lg mx-auto w-full">
          <div className="flex gap-2">
            {onboardingSlides.map((_, i) => (
              <button
                key={i}
                onClick={() => setOnboardingStep(i)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === onboardingStep
                    ? "w-8 bg-gradient-brand"
                    : "w-2 bg-muted-foreground/30"
                }`}
              />
            ))}
          </div>

          <button
            onClick={handleNextSlide}
            className="w-full py-3.5 rounded-xl bg-gradient-brand text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 glow hover:opacity-90 transition-opacity"
          >
            {onboardingStep < onboardingSlides.length - 1 ? "Next" : "Create Account"}
            <ArrowRight className="w-4 h-4" />
          </button>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <button
              onClick={() => setIsLogin(true)}
              className="text-primary hover:underline font-medium"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    );
  }

  // ── Login / Signup form view ──
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm space-y-6"
      >
        <div className="text-center">
          <h1 className="text-3xl font-bold">
            <span className="text-gradient">Cue It</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-2">
            {isLogin ? "Sign in to your account" : "Create a new account"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="glass rounded-xl p-6 space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2.5 rounded-lg bg-secondary text-foreground border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-3 py-2.5 rounded-lg bg-secondary text-foreground border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground"
              placeholder="••••••••"
            />
          </div>
          {!isLogin && (
            <div className="flex items-start gap-2">
              <Checkbox
                id="tos"
                checked={agreedToTos}
                onCheckedChange={(v) => setAgreedToTos(v === true)}
                className="mt-0.5"
              />
              <label htmlFor="tos" className="text-xs text-muted-foreground leading-snug cursor-pointer">
                I agree to the{" "}
                <button
                  type="button"
                  onClick={() => setTosOpen(true)}
                  className="text-primary hover:underline font-medium"
                >
                  Terms of Service & Disclaimers
                </button>
              </label>
            </div>
          )}
          {!isLogin && (
            <div className="flex items-start gap-2">
              <Checkbox
                id="notice"
                checked={agreedToNotice}
                onCheckedChange={(v) => setAgreedToNotice(v === true)}
                className="mt-0.5"
              />
              <label htmlFor="notice" className="text-xs text-muted-foreground leading-snug cursor-pointer">
                I acknowledge the{" "}
                <button
                  type="button"
                  onClick={() => setNoticeOpen(true)}
                  className="text-primary hover:underline font-medium"
                >
                  Notice at Collection
                </button>
              </label>
            </div>
          )}
          {!isLogin && (
            <div className="rounded-lg bg-secondary/50 border border-border p-3 space-y-2">
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                <strong className="text-foreground">Simulation Disclaimer:</strong>{" "}
                Cue-It is currently in a conceptual validation phase. All "Smart Churn" or "Savings" figures displayed are simulated estimates based on information you provide. These are for illustrative purposes only and do not constitute a guarantee of actual savings or financial advice.
              </p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                <strong className="text-foreground">Non-Binding Provision:</strong>{" "}
                Registration for this test does not create a contract for service. We reserve the right to terminate this test or modify features without notice. No billing information is collected at this stage.
              </p>
            </div>
          )}
          <button
            type="submit"
            disabled={loading || (!isLogin && (!agreedToTos || !agreedToNotice))}
            className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity glow disabled:opacity-50"
          >
            {loading ? "..." : isLogin ? "Sign In" : "Create Account"}
          </button>
          {isLogin && (
            <button
              type="button"
              onClick={handleForgotPassword}
              className="w-full text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              Forgot password?
            </button>
          )}
        </form>

        <TermsOfService open={tosOpen} onOpenChange={setTosOpen} />
        <NoticeAtCollection open={noticeOpen} onOpenChange={setNoticeOpen} />

        <p className="text-center text-sm text-muted-foreground">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <button
            onClick={() => isLogin ? handleSwitchToSignup() : setIsLogin(true)}
            className="text-primary hover:underline font-medium"
          >
            {isLogin ? "Sign up" : "Sign in"}
          </button>
        </p>
      </motion.div>
    </div>
  );
};

export default Auth;
