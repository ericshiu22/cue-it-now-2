import { useState, useEffect } from "react";
import { Star, Check } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { getImageUrl, getWatchProviders, type TMDBResult, type WatchProvider } from "@/lib/tmdb";
import { addCue } from "@/lib/cue-actions";

interface MovieCardProps {
  item: TMDBResult;
  index: number;
  hideProviderBadges?: boolean;
}

// Map TMDB provider names to our service IDs
const mapProviderToServiceId = (name: string): string => {
  const lower = name.toLowerCase();
  if (lower.includes("netflix")) return "netflix";
  if (lower.includes("max") && !lower.includes("paramount")) return "max";
  if (lower.includes("disney")) return "disney+";
  if (lower.includes("hulu")) return "hulu";
  if (lower.includes("prime") || lower.includes("amazon")) return "prime video";
  if (lower.includes("apple")) return "apple tv+";
  if (lower.includes("peacock")) return "peacock";
  if (lower.includes("paramount")) return "paramount";
  return lower;
};

const MovieCard = ({ item, index, hideProviderBadges = false }: MovieCardProps) => {
  const navigate = useNavigate();
  const [cued, setCued] = useState(false);
  const [saving, setSaving] = useState(false);
  const [providers, setProviders] = useState<WatchProvider[]>([]);
  const [isRentBuyOnly, setIsRentBuyOnly] = useState(false);
  const title = item.title || item.name || "Unknown";
  const year = (item.release_date || item.first_air_date || "").slice(0, 4);
  const poster = getImageUrl(item.poster_path, "w500");
  const rating = item.vote_average?.toFixed(1);
  const mediaType = item.media_type === "tv" ? "TV" : "Movie";

  useEffect(() => {
    if (!item.id || !item.media_type) return;
    getWatchProviders(item.media_type, item.id).then((result) => {
      if (result) {
        const flatrate = [...(result.flatrate || []), ...(result.ads || [])];
        const unique = Array.from(new Map(flatrate.map((p) => [p.provider_id, p])).values());
        if (unique.length > 0) {
          setProviders(unique.slice(0, 3));
          setIsRentBuyOnly(false);
        } else if ((result.rent?.length || 0) > 0 || (result.buy?.length || 0) > 0) {
          setProviders([]);
          setIsRentBuyOnly(true);
        }
      }
    });
  }, [item.id, item.media_type]);

  const handleClick = () => {
    navigate(`/show/${item.media_type}/${item.id}`);
  };

  const handleCue = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (cued || saving) return;
    setSaving(true);
    const primaryService = providers.length > 0
      ? mapProviderToServiceId(providers[0].provider_name)
      : "unassigned";
    const ok = await addCue({
      tmdb_id: item.id,
      title,
      poster_path: item.poster_path,
      media_type: item.media_type,
      vote_average: item.vote_average,
      release_year: year,
      overview: item.overview,
      service_provider: primaryService,
    });
    setSaving(false);
    if (ok) setCued(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      className="group relative cursor-pointer"
      onClick={handleClick}
    >
      <div className="relative aspect-[2/3] rounded-xl overflow-hidden glass">
        {poster ? (
          <img
            src={poster}
            alt={title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-secondary">
            <span className="text-muted-foreground text-sm">No Poster</span>
          </div>
        )}

        {/* Streaming provider badges on poster */}
        {!hideProviderBadges && providers.length > 0 && (
          <div className="absolute top-2 right-2 flex items-center gap-1 z-10">
            {providers.map((p) => (
              <div
                key={p.provider_id}
                className="h-7 w-7 rounded-md overflow-hidden shadow-md ring-1 ring-background/30"
                title={p.provider_name}
              >
                <img
                  src={getImageUrl(p.logo_path, "w200") || ""}
                  alt={p.provider_name}
                  className="h-full w-full object-cover"
                />
              </div>
            ))}
          </div>
        )}
        {isRentBuyOnly && (
          <div className="absolute top-2 right-2 z-10">
            <span className="bg-secondary/90 backdrop-blur-sm text-foreground text-[10px] font-semibold px-2 py-1 rounded-md shadow-md">
              Rent/Buy
            </span>
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
          <p className="text-sm text-muted-foreground line-clamp-3">{item.overview}</p>
          <button
            onClick={handleCue}
            disabled={cued || saving}
            className={`mt-3 w-full py-2.5 rounded-lg font-semibold text-sm transition-opacity glow ${
              cued
                ? "bg-secondary text-foreground"
                : "bg-primary text-primary-foreground hover:opacity-90"
            } disabled:opacity-70`}
          >
            {cued ? (
              <span className="inline-flex items-center gap-1.5"><Check className="h-4 w-4" /> Cued</span>
            ) : saving ? "..." : "🎬 Cue It"}
          </button>
        </div>

        {/* Badge */}
        <div className="absolute top-2 left-2 glass-strong px-2 py-0.5 rounded-md text-xs font-medium text-foreground">
          {mediaType}
        </div>
      </div>

      <div className="mt-3 space-y-1">
        <h3 className="font-semibold text-foreground truncate text-sm">{title}</h3>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {year && <span>{year}</span>}
          {rating && Number(rating) > 0 && (
            <span className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-primary text-primary" />
              {rating}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default MovieCard;
