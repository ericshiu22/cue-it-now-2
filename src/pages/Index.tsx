import { useState, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import HeroSection from "@/components/HeroSection";
import SearchBar from "@/components/SearchBar";
import ResultsGrid from "@/components/ResultsGrid";
import RecommendedForYou from "@/components/RecommendedForYou";
import FriendsWatching from "@/components/FriendsWatching";
import ExploreOtherServices from "@/components/ExploreOtherServices";
import { searchMulti, getTrending } from "@/lib/tmdb";

const INTRO_DURATION = 3500;

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [introComplete, setIntroComplete] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIntroComplete(true), INTRO_DURATION);
    return () => clearTimeout(timer);
  }, []);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const { data: trendingData } = useQuery({
    queryKey: ["trending"],
    queryFn: () => getTrending(),
    staleTime: 1000 * 60 * 30,
  });

  const { data: searchData, isLoading: searchLoading } = useQuery({
    queryKey: ["search", searchQuery],
    queryFn: () => searchMulti(searchQuery),
    enabled: !!searchQuery,
  });

  return (
    <div className="min-h-screen bg-background">
      <HeroSection>
        <SearchBar onSearch={handleSearch} isLoading={searchLoading} />
      </HeroSection>

      <AnimatePresence>
        {introComplete && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            {searchData && (
              <ResultsGrid
                results={searchData.results}
                title={`Results for "${searchQuery}"`}
              />
            )}
            {!searchQuery && (
              <>
                <RecommendedForYou />
                <FriendsWatching />
                <ExploreOtherServices />
                {trendingData && (
                  <ResultsGrid results={trendingData.results} title="Trending This Week" />
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Index;
