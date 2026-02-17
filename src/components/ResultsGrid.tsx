import { motion } from "framer-motion";
import MovieCard from "./MovieCard";
import type { TMDBResult } from "@/lib/tmdb";

interface ResultsGridProps {
  results: TMDBResult[];
  title?: string;
}

const ResultsGrid = ({ results, title }: ResultsGridProps) => {
  const filtered = (results || []).filter(
    (r) => (r.media_type === "movie" || r.media_type === "tv") && r.poster_path
  );

  if (filtered.length === 0) return null;

  return (
    <section className="w-full max-w-7xl mx-auto px-4 py-8">
      {title && (
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xl font-semibold text-foreground mb-6"
        >
          {title}
        </motion.h2>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
        {filtered.slice(0, 18).map((item, i) => (
          <MovieCard key={item.id} item={item} index={i} />
        ))}
      </div>
    </section>
  );
};

export default ResultsGrid;
