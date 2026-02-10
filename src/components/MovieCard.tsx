import { Star } from "lucide-react";
import { motion } from "framer-motion";
import { getImageUrl, type TMDBResult } from "@/lib/tmdb";

interface MovieCardProps {
  item: TMDBResult;
  index: number;
}

const MovieCard = ({ item, index }: MovieCardProps) => {
  const title = item.title || item.name || "Unknown";
  const year = (item.release_date || item.first_air_date || "").slice(0, 4);
  const poster = getImageUrl(item.poster_path, "w500");
  const rating = item.vote_average?.toFixed(1);
  const mediaType = item.media_type === "tv" ? "TV" : "Movie";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      className="group relative cursor-pointer"
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

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
          <p className="text-sm text-muted-foreground line-clamp-3">{item.overview}</p>
          <button className="mt-3 w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity glow">
            🎬 Cue It
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
