import { motion } from "framer-motion";
import { Eye, Bookmark, Check } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { GENRE_LIST, GENRE_SHOWS } from "./genre-data";
import { ShowSelection } from "./types";

interface Props {
  genres: string[];
  seenShows: string[];
  wantToWatch: ShowSelection[];
  onToggleGenre: (g: string) => void;
  onToggleSeen: (title: string) => void;
  onToggleWant: (show: ShowSelection) => void;
}

export default function StepGenre({
  genres,
  seenShows,
  wantToWatch,
  onToggleGenre,
  onToggleSeen,
  onToggleWant,
}: Props) {
  const wantTitles = wantToWatch.map((s) => s.title);

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h2 className="text-2xl font-bold text-foreground">
          Pick your <span className="text-gradient">top 3 genres</span>
        </h2>
        <p className="text-sm text-muted-foreground">
          We'll recommend shows you'll actually love.
        </p>
        <div className="flex flex-wrap gap-2">
          {GENRE_LIST.map((g) => {
            const active = genres.includes(g);
            const disabled = !active && genres.length >= 3;
            return (
              <button
                key={g}
                onClick={() => !disabled && onToggleGenre(g)}
                disabled={disabled}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  active
                    ? "bg-primary text-primary-foreground glow"
                    : disabled
                    ? "glass text-muted-foreground/40 cursor-not-allowed"
                    : "glass text-muted-foreground hover:ring-1 hover:ring-border"
                }`}
              >
                {active && <Check className="inline h-3.5 w-3.5 mr-1 -mt-0.5" />}
                {g}
              </button>
            );
          })}
        </div>
      </div>

      {genres.length > 0 && (
        <div className="space-y-5">
          {genres.map((genre) => {
            const shows = GENRE_SHOWS[genre] || [];
            return (
              <motion.div
                key={genre}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-2"
              >
                <h3 className="text-sm font-semibold text-foreground">
                  {genre}
                </h3>
                <ScrollArea className="w-full">
                  <div className="flex gap-3 pb-2">
                    {shows.map((show) => {
                      const isSeen = seenShows.includes(show.title);
                      const isWant = wantTitles.includes(show.title);
                      return (
                        <div
                          key={show.title}
                          className="glass rounded-xl p-3 min-w-[140px] max-w-[140px] flex flex-col items-center gap-2 shrink-0"
                        >
                          <span className="text-4xl">{show.poster}</span>
                          <p className="text-xs font-medium text-foreground text-center leading-tight">
                            {show.title}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {show.year} · {show.service}
                          </p>
                          <div className="flex gap-1.5 w-full">
                            <button
                              onClick={() => onToggleSeen(show.title)}
                              className={`flex-1 flex items-center justify-center gap-1 rounded-lg py-1.5 text-[10px] font-medium transition-all ${
                                isSeen
                                  ? "bg-primary/20 text-primary ring-1 ring-primary/50"
                                  : "glass hover:ring-1 hover:ring-border text-muted-foreground"
                              }`}
                            >
                              <Eye className="h-3 w-3" />
                              Seen
                            </button>
                            <button
                              onClick={() =>
                                onToggleWant({
                                  title: show.title,
                                  genre,
                                  poster: show.poster,
                                })
                              }
                              className={`flex-1 flex items-center justify-center gap-1 rounded-lg py-1.5 text-[10px] font-medium transition-all ${
                                isWant
                                  ? "bg-accent/30 text-accent-foreground ring-1 ring-accent/50"
                                  : "glass hover:ring-1 hover:ring-border text-muted-foreground"
                              }`}
                            >
                              <Bookmark className="h-3 w-3" />
                              Watch
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
