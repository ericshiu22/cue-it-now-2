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
  crunchyroll: {
    id: "crunchyroll",
    name: "Crunchyroll",
    color: "hsl(25, 95%, 53%)",
    logo: "🍥",
    searchUrl: (title) => `https://www.crunchyroll.com/search?q=${encodeURIComponent(title)}`,
  },
  tubi: {
    id: "tubi",
    name: "Tubi",
    color: "hsl(340, 80%, 55%)",
    logo: "🟧",
    searchUrl: (title) => `https://tubitv.com/search/${encodeURIComponent(title)}`,
  },
  pluto: {
    id: "pluto",
    name: "Pluto TV",
    color: "hsl(210, 15%, 40%)",
    logo: "📡",
    searchUrl: (title) => `https://pluto.tv/search/details/${encodeURIComponent(title)}`,
  },
  discovery: {
    id: "discovery",
    name: "Discovery+",
    color: "hsl(210, 80%, 45%)",
    logo: "🌍",
    searchUrl: (title) => `https://www.discoveryplus.com/search?q=${encodeURIComponent(title)}`,
  },
  starz: {
    id: "starz",
    name: "Starz",
    color: "hsl(270, 50%, 40%)",
    logo: "⭐",
    searchUrl: (title) => `https://www.starz.com/search?q=${encodeURIComponent(title)}`,
  },
  showtime: {
    id: "showtime",
    name: "Showtime",
    color: "hsl(0, 75%, 45%)",
    logo: "🎭",
    searchUrl: (title) => `https://www.sho.com/search?q=${encodeURIComponent(title)}`,
  },
  mubi: {
    id: "mubi",
    name: "MUBI",
    color: "hsl(0, 0%, 15%)",
    logo: "🎬",
    searchUrl: (title) => `https://mubi.com/search?query=${encodeURIComponent(title)}`,
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
