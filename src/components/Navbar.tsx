import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { ListVideo, LogOut, Search, Settings, User, Users, Wallet } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import cueLogo from "@/assets/cue-it-logo.png";

const Navbar = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [showIntro, setShowIntro] = useState(false);
  const introRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (introRef.current && !introRef.current.contains(e.target as Node)) {
        setShowIntro(false);
      }
    };
    if (showIntro) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showIntro]);

  return (
    <nav className="sticky top-0 z-50 glass-strong border-b border-border/50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="relative" ref={introRef}>
          <button
            onClick={() => setShowIntro((v) => !v)}
            className="flex items-center focus:outline-none"
          >
            <img src={cueLogo} alt="Cue It" className="h-9 w-auto" />
          </button>

          <AnimatePresence>
            {showIntro && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="fixed inset-0 bg-background/95 backdrop-blur-xl z-[100] flex flex-col items-center justify-center"
              >
                <button
                  onClick={() => setShowIntro(false)}
                  className="absolute top-5 right-6 text-muted-foreground hover:text-foreground text-2xl"
                >
                  ✕
                </button>
                <motion.img
                  src={cueLogo}
                  alt="Cue It"
                  className="h-40 sm:h-56 w-auto"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6 }}
                />
                <motion.p
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25, duration: 0.5 }}
                  className="mt-5 text-sm text-muted-foreground tracking-widest uppercase"
                >
                  Your Smart Streaming Assistant
                </motion.p>
                <motion.p
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.5 }}
                  className="mt-3 text-lg text-muted-foreground leading-relaxed"
                >
                  Check the Feed. Find your Flow. Cue It.
                </motion.p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-1">
          <Link
            to="/"
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              location.pathname === "/"
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Search className="h-4 w-4 inline mr-1.5 -mt-0.5" />
            Discover
          </Link>

          {user && (
            <Link
              to="/queue"
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === "/queue"
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <ListVideo className="h-4 w-4 inline mr-1.5 -mt-0.5" />
              My Queue
            </Link>
          )}

          {user && (
            <Link
              to="/friends"
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === "/friends"
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Users className="h-4 w-4 inline mr-1.5 -mt-0.5" />
              Friends
            </Link>
          )}

          {user && (
            <Link
              to="/subscriptions"
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === "/subscriptions"
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Wallet className="h-4 w-4 inline mr-1.5 -mt-0.5" />
              Sub Hub
            </Link>
          )}

          {user ? (
            <>
              <Link
                to="/profile"
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === "/profile"
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Settings className="h-4 w-4 inline mr-1.5 -mt-0.5" />
                Settings
              </Link>
              <button
                onClick={() => signOut()}
                className="ml-2 px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground transition-colors"
                title={user.email}
              >
                <LogOut className="h-4 w-4 inline mr-1.5 -mt-0.5" />
                Sign Out
              </button>
            </>
          ) : (
            <Link
              to="/auth"
              className="ml-2 px-4 py-1.5 rounded-lg bg-gradient-brand text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              <User className="h-4 w-4 inline mr-1.5 -mt-0.5" />
              Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
