import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import HeroSection from "@/components/HeroSection";
import SearchBar from "@/components/SearchBar";
import ResultsGrid from "@/components/ResultsGrid";
import RecommendedForYou from "@/components/RecommendedForYou";
import FriendsWatching from "@/components/FriendsWatching";
import ExploreOtherServices from "@/components/ExploreOtherServices";
import { searchMulti, getTrending } from "@/lib/tmdb";

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");

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
    </div>
  );
};

export default Index;
