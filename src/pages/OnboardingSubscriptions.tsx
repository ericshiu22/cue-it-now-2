import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ArrowRight, Tv, Search, Heart, Film, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { SERVICE_LIST, mapProviderToServiceId } from "@/lib/streaming-services";
import { searchMulti, getImageUrl, type TMDBResult } from "@/lib/tmdb";
import { toast } from "sonner";

// TMDB genre IDs
const GENRES = [
  { id: 28, name: "Action", emoji: "💥" },
  { id: 35, name: "Comedy", emoji: "😂" },
  { id: 18, name: "Drama", emoji: "🎭" },
  { id: 27, name: "Horror", emoji: "👻" },
  { id: 878, name: "Sci-Fi", emoji: "🚀" },
  { id: 10749, name: "Romance", emoji: "💕" },
  { id: 53, name: "Thriller", emoji: "🔪" },
  { id: 16, name: "Animation", emoji: "🎨" },
  { id: 99, name: "Documentary", emoji: "🎬" },
  { id: 14, name: "Fantasy", emoji: "🧙" },
  { id: 10402, name: "Music", emoji: "🎵" },
  { id: 9648, name: "Mystery", emoji: "🔍" },
];

const OnboardingSubscriptions = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Step management: 0 = subscriptions, 1 = genres, 2 = favorite shows
  const [step, setStep] = useState(0);

  // Step 0: Subscriptions
  const [selectedSubs, setSelectedSubs] = useState<Set<string>>(new Set());

  // Step 1: Genres
  const [selectedGenres, setSelectedGenres] = useState<Set<number>>(new Set());

  // Step 2: Favorite shows
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<TMDBResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [favoriteShows, setFavoriteShows] = useState<TMDBResult[]>([]);

  const [saving, setSaving] = useState(false);

  const toggleSub = (id: string) => {
    setSelectedSubs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleGenre = (id: number) => {
    setSelectedGenres((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSearch = useCallback(async (q: string) => {
    setSearchQuery(q);
    if (q.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await searchMulti(q.trim());
      const filtered = (res.results || []).filter(
        (r) => (r.media_type === "movie" || r.media_type === "tv") && r.poster_path
      );
      setSearchResults(filtered.slice(0, 12));
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const addFavorite = (item: TMDBResult) => {
    if (favoriteShows.find((f) => f.id === item.id)) return;
    if (favoriteShows.length >= 5) {
      toast.info("You can pick up to 5 favorites.");
      return;
    }
    setFavoriteShows((prev) => [...prev, item]);
    setSearchQuery("");
    setSearchResults([]);
  };

  const removeFavorite = (id: number) => {
    setFavoriteShows((prev) => prev.filter((f) => f.id !== id));
  };

  const handleFinish = async () => {
    if (!user) return;
    setSaving(true);

    try {
      // Save subscriptions
      const subInserts = Array.from(selectedSubs).map((serviceId) => {
        const svc = SERVICE_LIST.find((s) => s.id === serviceId);
        return {
          user_id: user.id,
          service_name: svc?.name ?? serviceId,
          monthly_cost: 0,
          is_active: true,
        };
      });

      if (subInserts.length > 0) {
        const { error } = await supabase.from("active_subscriptions").insert(subInserts);
        if (error) toast.error("Couldn't save subscriptions. You can add them later.");
      }

      // Save favorite shows as seed cues
      if (favoriteShows.length > 0) {
        const cueInserts = favoriteShows.map((show) => ({
          user_id: user.id,
          tmdb_id: show.id,
          title: show.title || show.name || "Unknown",
          media_type: show.media_type,
          poster_path: show.poster_path,
          overview: show.overview || null,
          release_year: (show.release_date || show.first_air_date || "").slice(0, 4) || null,
          vote_average: show.vote_average || null,
          service_provider: "Unknown",
          status: "queued",
          provider_status: "active",
        }));

        const { error } = await supabase.from("cues").insert(cueInserts);
        if (error) toast.error("Couldn't save favorites. You can add them from the search bar.");
      }

      // Save genre preferences to localStorage for fallback
      if (selectedGenres.size > 0) {
        localStorage.setItem("cue-preferred-genres", JSON.stringify(Array.from(selectedGenres)));
      }

      localStorage.setItem("cue-subs-onboarded", "true");
      navigate("/", { replace: true });
    } catch {
      toast.error("Something went wrong. You can set these up later.");
      navigate("/", { replace: true });
    } finally {
      setSaving(false);
    }
  };

  const totalSteps = 3;

  // ── Step 0: Subscriptions ──
  const renderSubscriptions = () => (
    <motion.div
      key="step-subs"
      initial={{ opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -60 }}
      transition={{ duration: 0.3 }}
      className="flex-1 flex flex-col w-full"
    >
      <div className="text-center mb-6">
        <div className="w-14 h-14 rounded-xl bg-gradient-brand flex items-center justify-center mx-auto mb-4 glow">
          <Tv className="w-7 h-7 text-primary-foreground" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
          What do you subscribe to?
        </h1>
        <p className="text-sm text-muted-foreground">
          Select your active streaming services so we can personalize your experience.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full mb-6 overflow-y-auto max-h-[50vh]">
        {SERVICE_LIST.map((svc) => {
          const isSelected = selectedSubs.has(svc.id);
          return (
            <button
              key={svc.id}
              onClick={() => toggleSub(svc.id)}
              className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-200 ${
                isSelected
                  ? "border-primary bg-primary/10 glow"
                  : "border-border bg-card hover:border-muted-foreground/30"
              }`}
            >
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-2 right-2 w-5 h-5 rounded-full bg-gradient-brand flex items-center justify-center"
                >
                  <Check className="w-3 h-3 text-primary-foreground" />
                </motion.div>
              )}
              <span className="text-2xl">{svc.logo}</span>
              <span className="text-xs font-medium text-foreground text-center leading-tight">
                {svc.name}
              </span>
            </button>
          );
        })}
      </div>
    </motion.div>
  );

  // ── Step 1: Genres ──
  const renderGenres = () => (
    <motion.div
      key="step-genres"
      initial={{ opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -60 }}
      transition={{ duration: 0.3 }}
      className="flex-1 flex flex-col w-full"
    >
      <div className="text-center mb-6">
        <div className="w-14 h-14 rounded-xl bg-gradient-brand flex items-center justify-center mx-auto mb-4 glow">
          <Film className="w-7 h-7 text-primary-foreground" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
          What genres do you love?
        </h1>
        <p className="text-sm text-muted-foreground">
          Pick a few so we can recommend the right content.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full mb-6">
        {GENRES.map((genre) => {
          const isSelected = selectedGenres.has(genre.id);
          return (
            <button
              key={genre.id}
              onClick={() => toggleGenre(genre.id)}
              className={`relative flex items-center gap-3 p-3.5 rounded-xl border transition-all duration-200 ${
                isSelected
                  ? "border-primary bg-primary/10 glow"
                  : "border-border bg-card hover:border-muted-foreground/30"
              }`}
            >
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-2 right-2 w-5 h-5 rounded-full bg-gradient-brand flex items-center justify-center"
                >
                  <Check className="w-3 h-3 text-primary-foreground" />
                </motion.div>
              )}
              <span className="text-xl">{genre.emoji}</span>
              <span className="text-sm font-medium text-foreground">{genre.name}</span>
            </button>
          );
        })}
      </div>
    </motion.div>
  );

  // ── Step 2: Favorite Shows ──
  const renderFavoriteShows = () => (
    <motion.div
      key="step-shows"
      initial={{ opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -60 }}
      transition={{ duration: 0.3 }}
      className="flex-1 flex flex-col w-full"
    >
      <div className="text-center mb-6">
        <div className="w-14 h-14 rounded-xl bg-gradient-brand flex items-center justify-center mx-auto mb-4 glow">
          <Heart className="w-7 h-7 text-primary-foreground" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
          What are you watching?
        </h1>
        <p className="text-sm text-muted-foreground">
          Add a few favorites so we can recommend similar titles.
        </p>
      </div>

      {/* Selected favorites */}
      {favoriteShows.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {favoriteShows.map((show) => (
            <motion.div
              key={show.id}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-lg px-3 py-1.5"
            >
              {show.poster_path && (
                <img
                  src={getImageUrl(show.poster_path, "w200") || ""}
                  alt=""
                  className="w-6 h-8 rounded object-cover"
                />
              )}
              <span className="text-xs font-medium text-foreground truncate max-w-[120px]">
                {show.title || show.name}
              </span>
              <button
                onClick={() => removeFavorite(show.id)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </div>
      )}

      {/* Search input */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search for a movie or show..."
          className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-secondary text-foreground border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground"
        />
      </div>

      {/* Search results */}
      <div className="flex-1 overflow-y-auto max-h-[40vh] space-y-1">
        {searching && (
          <p className="text-xs text-muted-foreground text-center py-4">Searching...</p>
        )}
        {!searching && searchResults.length === 0 && searchQuery.length >= 2 && (
          <p className="text-xs text-muted-foreground text-center py-4">No results found</p>
        )}
        {!searching && searchQuery.length < 2 && favoriteShows.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-4">
            Type a show or movie name to search
          </p>
        )}
        {searchResults.map((item) => {
          const isAdded = favoriteShows.some((f) => f.id === item.id);
          return (
            <button
              key={item.id}
              onClick={() => !isAdded && addFavorite(item)}
              disabled={isAdded}
              className={`w-full flex items-center gap-3 p-2.5 rounded-lg border transition-all ${
                isAdded
                  ? "border-primary/30 bg-primary/5 opacity-60"
                  : "border-border bg-card hover:border-muted-foreground/30"
              }`}
            >
              {item.poster_path && (
                <img
                  src={getImageUrl(item.poster_path, "w200") || ""}
                  alt=""
                  className="w-10 h-14 rounded object-cover shrink-0"
                />
              )}
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {item.title || item.name}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {item.media_type === "movie" ? "Movie" : "TV Show"}
                  {(item.release_date || item.first_air_date) &&
                    ` · ${(item.release_date || item.first_air_date || "").slice(0, 4)}`}
                </p>
              </div>
              {isAdded ? (
                <Check className="w-4 h-4 text-primary shrink-0" />
              ) : (
                <span className="text-xs text-primary font-medium shrink-0">Add</span>
              )}
            </button>
          );
        })}
      </div>
    </motion.div>
  );

  const canContinue = () => {
    if (step === 0) return true; // subs are optional
    if (step === 1) return true; // genres are optional
    if (step === 2) return true; // shows are optional
    return true;
  };

  const handleNext = () => {
    if (step < totalSteps - 1) {
      setStep(step + 1);
    } else {
      handleFinish();
    }
  };

  const ctaLabel = () => {
    if (step === 2) {
      if (saving) return "Saving...";
      return favoriteShows.length > 0 ? "Finish Setup" : "Skip & Finish";
    }
    return "Next";
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="absolute inset-0 z-0 circuit-pattern pointer-events-none" />

      <div className="relative z-10 flex-1 flex flex-col items-center px-4 py-8 max-w-lg mx-auto w-full">
        {/* Progress indicator */}
        <div className="flex gap-2 mb-6">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === step ? "w-8 bg-gradient-brand" : i < step ? "w-4 bg-primary/40" : "w-4 bg-muted-foreground/20"
              }`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 0 && renderSubscriptions()}
          {step === 1 && renderGenres()}
          {step === 2 && renderFavoriteShows()}
        </AnimatePresence>

        {/* CTA */}
        <div className="w-full space-y-3 mt-4">
          <button
            onClick={handleNext}
            disabled={saving || !canContinue()}
            className="w-full py-3.5 rounded-xl bg-gradient-brand text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 glow hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {ctaLabel()}
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              localStorage.setItem("cue-subs-onboarded", "true");
              navigate("/", { replace: true });
            }}
            className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-2"
          >
            Skip for now — I'll set this up later
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingSubscriptions;
