import { Link, useLocation } from "react-router-dom";
import { ListVideo, LogOut, Search, Settings, User, Users, Wallet, Compass, Radio, Play } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import cueLogo from "@/assets/cue-it-logo.png";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

const Navbar = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();

  return (
    <nav className="sticky top-0 z-50 glass-strong border-b border-border/50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center focus:outline-none">
              <img src={cueLogo} alt="Cue It" className="h-9 w-auto" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-72 p-4 bg-popover border border-border shadow-xl">
            <p className="text-base font-bold text-foreground mb-3">Stop Searching. Start Streaming.</p>
            <DropdownMenuSeparator />
            <div className="flex items-start gap-2.5 py-2.5">
              <Radio className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <p className="text-sm text-muted-foreground"><span className="font-semibold text-foreground">Check the Feed:</span> See what the squad is binging right now.</p>
            </div>
            <div className="flex items-start gap-2.5 py-2.5">
              <Compass className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <p className="text-sm text-muted-foreground"><span className="font-semibold text-foreground">Find Your Flow:</span> Locate any title across all platforms instantly.</p>
            </div>
            <div className="flex items-start gap-2.5 py-2.5">
              <Play className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <p className="text-sm text-muted-foreground"><span className="font-semibold text-foreground">Cue It:</span> Lock in your choice and share the vibe.</p>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

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
