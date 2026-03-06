import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import TermsOfService from "@/components/TermsOfService";
import NoticeAtCollection from "@/components/NoticeAtCollection";

const Auth = () => {
  const { user } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [agreedToTos, setAgreedToTos] = useState(false);
  const [tosOpen, setTosOpen] = useState(false);
  const [agreedToNotice, setAgreedToNotice] = useState(false);
  const [noticeOpen, setNoticeOpen] = useState(false);
  const { signIn, signUp } = useAuth();

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
      toast.success("Account created! You're signed in.");
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
            onClick={() => setIsLogin(!isLogin)}
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
