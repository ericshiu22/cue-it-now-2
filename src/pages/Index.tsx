import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import HeroSection from "@/components/HeroSection";
import SearchBar from "@/components/SearchBar";
import ResultsGrid from "@/components/ResultsGrid";
import ApiKeyPrompt from "@/components/ApiKeyPrompt";
import { searchMulti, getTrending } from "@/lib/tmdb";

const Index = () => {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem("tmdb_key") || "");
  const [searchQuery, setSearchQuery] = useState("");

  const handleApiKey = (key: string) => {
    localStorage.setItem("tmdb_key", key);
    setApiKey(key);
  };

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const { data: trendingData } = useQuery({
    queryKey: ["trending", apiKey],
    queryFn: () => getTrending(apiKey),
    enabled: !!apiKey,
    staleTime: 1000 * 60 * 30,
  });

  const { data: searchData, isLoading: searchLoading } = useQuery({
    queryKey: ["search", searchQuery, apiKey],
    queryFn: () => searchMulti(searchQuery, apiKey),
    enabled: !!searchQuery && !!apiKey,
  });

  return (
    <div className="min-h-screen bg-background">
      <HeroSection>
        {!apiKey ? (
          <ApiKeyPrompt onSubmit={handleApiKey} />
        ) : (
          <SearchBar onSearch={handleSearch} isLoading={searchLoading} />
        )}
      </HeroSection>

      {apiKey && (
        <>
          {searchData && (
            <ResultsGrid
              results={searchData.results}
              title={`Results for "${searchQuery}"`}
            />
          )}
          {!searchQuery && trendingData && (
            <ResultsGrid results={trendingData.results} title="Trending This Week" />
          )}
        </>
      )}
    </div>
  );
};

export default Index;
