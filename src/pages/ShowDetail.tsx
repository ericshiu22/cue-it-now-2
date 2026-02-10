import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Star, Calendar, Film, Tv, ExternalLink, Check } from "lucide-react";
import { getImageUrl } from "@/lib/tmdb";
import { SERVICE_LIST } from "@/lib/streaming-services";
import { addCue } from "@/lib/cue-actions";

const TMDB_BASE = "https://api.themoviedb.org/3";

interface ShowDetails {
  id: number;
  title?: string;
  name?: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  vote_average: number;
  release_date?: string;
  first_air_date?: string;
  genres: { id: number; name: string }[];
  runtime?: number;
  number_of_seasons?: number;
  tagline?: string;
  status?: string;
}

const ShowDetail = () => {
  const { type, id } = useParams<{ type: string; id: string }>();
  const [show, setShow] = useState<ShowDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [cued, setCued] = useState(false);
  const [cueing, setCueing] = useState(false);

  const apiKey = localStorage.getItem("tmdb_key") || "";

  useEffect(() => {
    if (!apiKey || !type || !id) return;
    const fetchDetails = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${TMDB_BASE}/${type}/${id}?api_key=${apiKey}`);
        if (res.ok) setShow(await res.json());
      } catch {
        // silent
      }
      setLoading(false);
    };
    fetchDetails();
  }, [apiKey, type, id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!show) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Show not found.</p>
        <Link to="/" className="text-primary hover:underline">Go back</Link>
      </div>
    );
  }

  const title = show.title || show.name || "Unknown";
  const year = (show.release_date || show.first_air_date || "").slice(0, 4);
  const backdrop = getImageUrl(show.backdrop_path, "original");
  const poster = getImageUrl(show.poster_path, "w500");
  const isTV = type === "tv";

  return (
    <div className="min-h-screen bg-background">
      {/* Backdrop */}
      <div className="relative h-[50vh] sm:h-[60vh] overflow-hidden">
        {backdrop ? (
          <img src={backdrop} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-secondary" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 to-transparent" />

        {/* Back button */}
        <Link
          to="/"
          className="absolute top-6 left-6 z-20 glass-strong p-2 rounded-full text-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 -mt-48 sm:-mt-56">
        <div className="flex flex-col sm:flex-row gap-8">
          {/* Poster */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-shrink-0"
          >
            <div className="w-48 sm:w-56 aspect-[2/3] rounded-xl overflow-hidden glass glow-strong shadow-2xl">
              {poster ? (
                <img src={poster} alt={title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-secondary flex items-center justify-center">
                  {isTV ? <Tv className="h-12 w-12 text-muted-foreground" /> : <Film className="h-12 w-12 text-muted-foreground" />}
                </div>
              )}
            </div>
          </motion.div>

          {/* Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex-1 space-y-4"
          >
            <div className="flex items-center gap-2">
              <span className="glass px-2.5 py-0.5 rounded-md text-xs font-medium text-foreground">
                {isTV ? "TV Series" : "Movie"}
              </span>
              {show.status && (
                <span className="text-xs text-muted-foreground">{show.status}</span>
              )}
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold text-foreground leading-tight">{title}</h1>

            {show.tagline && (
              <p className="text-muted-foreground italic text-sm">"{show.tagline}"</p>
            )}

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              {year && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" /> {year}
                </span>
              )}
              {show.vote_average > 0 && (
                <span className="flex items-center gap-1.5">
                  <Star className="h-4 w-4 fill-primary text-primary" />
                  {show.vote_average.toFixed(1)}
                </span>
              )}
              {show.runtime && <span>{show.runtime} min</span>}
              {show.number_of_seasons && (
                <span>{show.number_of_seasons} season{show.number_of_seasons > 1 ? "s" : ""}</span>
              )}
            </div>

            {show.genres?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {show.genres.map((g) => (
                  <span key={g.id} className="glass px-3 py-1 rounded-full text-xs font-medium text-foreground">
                    {g.name}
                  </span>
                ))}
              </div>
            )}

            <p className="text-muted-foreground leading-relaxed max-w-2xl">{show.overview}</p>

            {/* Cue It button */}
            <button
              onClick={async () => {
                if (cued || cueing) return;
                setCueing(true);
                const ok = await addCue({
                  tmdb_id: show.id,
                  title,
                  poster_path: show.poster_path,
                  media_type: type || "movie",
                  vote_average: show.vote_average,
                  release_year: year,
                  overview: show.overview,
                });
                setCueing(false);
                if (ok) setCued(true);
              }}
              disabled={cued || cueing}
              className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm transition-opacity glow ${
                cued
                  ? "bg-secondary text-foreground"
                  : "bg-primary text-primary-foreground hover:opacity-90"
              } disabled:opacity-70`}
            >
              {cued ? (
                <><Check className="h-4 w-4" /> Added to Queue</>
              ) : cueing ? "Saving..." : "🎬 Cue It"}
            </button>
          </motion.div>
        </div>

        {/* Streaming Services */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mt-12 mb-16"
        >
          <h2 className="text-lg font-bold text-foreground mb-5">
            Where to <span className="text-gradient">Watch</span>
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {SERVICE_LIST.map((service) => (
              <a
                key={service.id}
                href={service.searchUrl(title)}
                target="_blank"
                rel="noopener noreferrer"
                className="glass group flex items-center gap-3 px-4 py-3.5 rounded-xl hover:border-primary/50 transition-all duration-300 hover:glow"
              >
                <span className="text-xl">{service.logo}</span>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-semibold text-foreground block truncate">{service.name}</span>
                  <span className="text-[11px] text-muted-foreground">Search on {service.name}</span>
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
              </a>
            ))}
          </div>
        </motion.section>
      </div>
    </div>
  );
};

export default ShowDetail;
