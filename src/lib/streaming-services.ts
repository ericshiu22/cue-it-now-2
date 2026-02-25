export interface StreamingService {
  id: string;
  name: string;
  color: string;
  logo: string;
  searchUrl: (title: string) => string;
  cancelUrl: string;
}

export const STREAMING_SERVICES: Record<string, StreamingService> = {
  netflix: {
    id: "netflix",
    name: "Netflix",
    color: "hsl(0, 75%, 50%)",
    logo: "🔴",
    searchUrl: (title) => `https://www.netflix.com/search?q=${encodeURIComponent(title)}`,
    cancelUrl: "https://www.netflix.com/cancelplan",
  },
  max: {
    id: "max",
    name: "HBO Max",
    color: "hsl(240, 60%, 55%)",
    logo: "🟣",
    searchUrl: (title) => `https://play.max.com/search?q=${encodeURIComponent(title)}`,
    cancelUrl: "https://www.max.com/account",
  },
  "disney+": {
    id: "disney+",
    name: "Disney+",
    color: "hsl(220, 80%, 55%)",
    logo: "🔵",
    searchUrl: (title) => `https://www.disneyplus.com/search?q=${encodeURIComponent(title)}`,
    cancelUrl: "https://www.disneyplus.com/account",
  },
  hulu: {
    id: "hulu",
    name: "Hulu",
    color: "hsl(145, 70%, 45%)",
    logo: "🟢",
    searchUrl: (title) => `https://www.hulu.com/search?q=${encodeURIComponent(title)}`,
    cancelUrl: "https://secure.hulu.com/account",
  },
  "prime video": {
    id: "prime video",
    name: "Prime Video",
    color: "hsl(195, 80%, 50%)",
    logo: "🟦",
    searchUrl: (title) => `https://www.amazon.com/s?k=${encodeURIComponent(title)}&i=instant-video`,
    cancelUrl: "https://www.amazon.com/gp/video/settings",
  },
  "apple tv+": {
    id: "apple tv+",
    name: "Apple TV+",
    color: "hsl(0, 0%, 70%)",
    logo: "⚪",
    searchUrl: (title) => `https://tv.apple.com/search?term=${encodeURIComponent(title)}`,
    cancelUrl: "https://support.apple.com/en-us/HT202039",
  },
  peacock: {
    id: "peacock",
    name: "Peacock",
    color: "hsl(35, 90%, 55%)",
    logo: "🟡",
    searchUrl: (title) => `https://www.peacocktv.com/search?query=${encodeURIComponent(title)}`,
    cancelUrl: "https://www.peacocktv.com/account/subscription",
  },
  paramount: {
    id: "paramount",
    name: "Paramount+",
    color: "hsl(215, 70%, 50%)",
    logo: "⛰️",
    searchUrl: (title) => `https://www.paramountplus.com/search?q=${encodeURIComponent(title)}`,
    cancelUrl: "https://www.paramountplus.com/account/",
  },
  crunchyroll: {
    id: "crunchyroll",
    name: "Crunchyroll",
    color: "hsl(25, 95%, 53%)",
    logo: "🍥",
    searchUrl: (title) => `https://www.crunchyroll.com/search?q=${encodeURIComponent(title)}`,
    cancelUrl: "https://www.crunchyroll.com/account/subscription",
  },
  tubi: {
    id: "tubi",
    name: "Tubi",
    color: "hsl(340, 80%, 55%)",
    logo: "🟧",
    searchUrl: (title) => `https://tubitv.com/search/${encodeURIComponent(title)}`,
    cancelUrl: "https://tubitv.com/account",
  },
  pluto: {
    id: "pluto",
    name: "Pluto TV",
    color: "hsl(210, 15%, 40%)",
    logo: "📡",
    searchUrl: (title) => `https://pluto.tv/search/details/${encodeURIComponent(title)}`,
    cancelUrl: "https://pluto.tv/account",
  },
  discovery: {
    id: "discovery",
    name: "Discovery+",
    color: "hsl(210, 80%, 45%)",
    logo: "🌍",
    searchUrl: (title) => `https://www.discoveryplus.com/search?q=${encodeURIComponent(title)}`,
    cancelUrl: "https://www.discoveryplus.com/account",
  },
  starz: {
    id: "starz",
    name: "Starz",
    color: "hsl(270, 50%, 40%)",
    logo: "⭐",
    searchUrl: (title) => `https://www.starz.com/search?q=${encodeURIComponent(title)}`,
    cancelUrl: "https://www.starz.com/account",
  },
  showtime: {
    id: "showtime",
    name: "Showtime",
    color: "hsl(0, 75%, 45%)",
    logo: "🎭",
    searchUrl: (title) => `https://www.sho.com/search?q=${encodeURIComponent(title)}`,
    cancelUrl: "https://www.sho.com/account",
  },
  mubi: {
    id: "mubi",
    name: "MUBI",
    color: "hsl(0, 0%, 15%)",
    logo: "🎬",
    searchUrl: (title) => `https://mubi.com/search?query=${encodeURIComponent(title)}`,
    cancelUrl: "https://mubi.com/account",
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

/** Map a TMDB provider name to our internal service ID */
export const mapProviderToServiceId = (name: string): string => {
  const lower = name.toLowerCase().trim();
  if (lower === "netflix") return "netflix";
  if (lower === "max" || lower === "hbo max") return "max";
  if (lower === "disney plus" || lower === "disney+") return "disney+";
  if (lower === "hulu") return "hulu";
  if (lower === "amazon prime video" || lower === "amazon prime video with ads" || lower === "prime video") return "prime video";
  if (lower === "apple tv plus" || lower === "apple tv+") return "apple tv+";
  if (lower === "peacock" || lower === "peacock premium" || lower === "peacock premium plus") return "peacock";
  if (lower === "paramount+" || lower === "paramount plus") return "paramount";
  if (lower === "crunchyroll") return "crunchyroll";
  if (lower === "tubi" || lower === "tubi tv") return "tubi";
  if (lower === "pluto tv") return "pluto";
  if (lower === "discovery+" || lower === "discovery plus") return "discovery";
  if (lower === "starz") return "starz";
  if (lower === "mubi") return "mubi";
  return "unassigned";
};
