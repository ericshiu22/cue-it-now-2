export interface StreamingService {
  id: string;
  name: string;
  color: string;
  logo: string;
  searchUrl: (title: string) => string;
}

export const STREAMING_SERVICES: Record<string, StreamingService> = {
  netflix: {
    id: "netflix",
    name: "Netflix",
    color: "hsl(0, 75%, 50%)",
    logo: "🔴",
    searchUrl: (title) => `https://www.netflix.com/search?q=${encodeURIComponent(title)}`,
  },
  max: {
    id: "max",
    name: "Max",
    color: "hsl(240, 60%, 55%)",
    logo: "🟣",
    searchUrl: (title) => `https://play.max.com/search?q=${encodeURIComponent(title)}`,
  },
  "disney+": {
    id: "disney+",
    name: "Disney+",
    color: "hsl(220, 80%, 55%)",
    logo: "🔵",
    searchUrl: (title) => `https://www.disneyplus.com/search?q=${encodeURIComponent(title)}`,
  },
  hulu: {
    id: "hulu",
    name: "Hulu",
    color: "hsl(145, 70%, 45%)",
    logo: "🟢",
    searchUrl: (title) => `https://www.hulu.com/search?q=${encodeURIComponent(title)}`,
  },
  "prime video": {
    id: "prime video",
    name: "Prime Video",
    color: "hsl(195, 80%, 50%)",
    logo: "🟦",
    searchUrl: (title) => `https://www.amazon.com/s?k=${encodeURIComponent(title)}&i=instant-video`,
  },
  "apple tv+": {
    id: "apple tv+",
    name: "Apple TV+",
    color: "hsl(0, 0%, 70%)",
    logo: "⚪",
    searchUrl: (title) => `https://tv.apple.com/search?term=${encodeURIComponent(title)}`,
  },
  peacock: {
    id: "peacock",
    name: "Peacock",
    color: "hsl(35, 90%, 55%)",
    logo: "🟡",
    searchUrl: (title) => `https://www.peacocktv.com/search?query=${encodeURIComponent(title)}`,
  },
  paramount: {
    id: "paramount",
    name: "Paramount+",
    color: "hsl(215, 70%, 50%)",
    logo: "⛰️",
    searchUrl: (title) => `https://www.paramountplus.com/search?q=${encodeURIComponent(title)}`,
  },
};

export const getService = (id: string): StreamingService | undefined => {
  return STREAMING_SERVICES[id.toLowerCase()];
};

export const getDeepLink = (serviceId: string, title: string, customLink?: string | null): string => {
  if (customLink) return customLink;
  const service = getService(serviceId);
  return service ? service.searchUrl(title) : "#";
};

export const SERVICE_LIST = Object.values(STREAMING_SERVICES);
