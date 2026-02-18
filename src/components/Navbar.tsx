import { Link, useLocation } from "react-router-dom";
import { ListVideo, LogOut, Search, Settings, User, UserPlus, Users, Wallet } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import cueLogo from "@/assets/cue-it-logo.png";

const Navbar = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();

  return (
    <nav className="sticky top-0 z-50 glass-strong border-b border-border/50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center">
          <img src={cueLogo} alt="Cue It" className="h-9 w-auto" />
        </Link>

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
              to="/linkup"
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === "/linkup"
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Users className="h-4 w-4 inline mr-1.5 -mt-0.5" />
              The Link Up
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
              <UserPlus className="h-4 w-4 inline mr-1.5 -mt-0.5" />
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
