const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// API-Sports league ID mappings
const SOCCER_LEAGUES: Record<string, { id: number; season: number }> = {
  EPL: { id: 39, season: 2025 },       // 2025-26 season
  "La Liga": { id: 140, season: 2025 },
  UCL: { id: 2, season: 2025 },
  MLS: { id: 253, season: 2026 },      // Calendar-year season
  "Liga MX": { id: 262, season: 2026 },
};

const BASKETBALL_LEAGUES: Record<string, { id: number; season: string }> = {
  NBA: { id: 12, season: "2025-2026" },
  NCAAM: { id: 116, season: "2025-2026" },
};

const HOCKEY_LEAGUES: Record<string, { id: number; season: number }> = {
  NHL: { id: 57, season: 2025 },
};

const BASEBALL_LEAGUES: Record<string, { id: number; season: number }> = {
  MLB: { id: 1, season: 2026 },
};

const AMERICAN_FOOTBALL_LEAGUES: Record<string, { id: number; season: number }> = {
  NFL: { id: 1, season: 2025 },
  NCAAF: { id: 8, season: 2025 },
};

// Broadcaster/streaming mappings per league
const LEAGUE_BROADCASTERS: Record<string, { broadcaster: string; streaming: string }> = {
  NBA: { broadcaster: "ESPN", streaming: "hulu" },
  NHL: { broadcaster: "ESPN", streaming: "hulu" },
  MLS: { broadcaster: "Apple TV+", streaming: "appletv" },
  EPL: { broadcaster: "NBC", streaming: "peacock" },
  "La Liga": { broadcaster: "ESPN+", streaming: "hulu" },
  UCL: { broadcaster: "CBS", streaming: "paramount" },
  "Liga MX": { broadcaster: "Telemundo", streaming: "peacock" },
  MLB: { broadcaster: "ESPN", streaming: "appletv" },
  NFL: { broadcaster: "FOX", streaming: "hulu" },
  NCAAF: { broadcaster: "ESPN", streaming: "hulu" },
  NCAAM: { broadcaster: "CBS", streaming: "paramount" },
};

const API_KEY = Deno.env.get("API_SPORTS_KEY") || "";

interface NormalizedGame {
  id: string;
  league: string;
  homeTeam: string;
  homeAbbr: string;
  homeLogo: string;
  homeScore: number | null;
  awayTeam: string;
  awayAbbr: string;
  awayLogo: string;
  awayScore: number | null;
  status: "scheduled" | "live" | "final";
  startTime: string;
  period?: string;
  clock?: string;
  broadcaster: string;
  streamingService: string;
}

function abbreviate(name: string): string {
  const abbrs: Record<string, string> = {
    "Los Angeles Lakers": "LAL", "Boston Celtics": "BOS", "Golden State Warriors": "GSW",
    "Milwaukee Bucks": "MIL", "Phoenix Suns": "PHX", "Denver Nuggets": "DEN",
    "Miami Heat": "MIA", "Philadelphia 76ers": "PHI", "Dallas Mavericks": "DAL",
    "New York Knicks": "NYK", "Brooklyn Nets": "BKN", "Chicago Bulls": "CHI",
    "Cleveland Cavaliers": "CLE", "Toronto Raptors": "TOR", "Indiana Pacers": "IND",
    "Atlanta Hawks": "ATL", "Charlotte Hornets": "CHA", "Washington Wizards": "WAS",
    "Orlando Magic": "ORL", "Detroit Pistons": "DET", "Sacramento Kings": "SAC",
    "Portland Trail Blazers": "POR", "Minnesota Timberwolves": "MIN",
    "Oklahoma City Thunder": "OKC", "New Orleans Pelicans": "NOP",
    "San Antonio Spurs": "SAS", "Houston Rockets": "HOU", "Utah Jazz": "UTA",
    "Memphis Grizzlies": "MEM", "LA Clippers": "LAC",
    "Edmonton Oilers": "EDM", "Florida Panthers": "FLA", "New York Rangers": "NYR",
    "Toronto Maple Leafs": "TOR", "Colorado Avalanche": "COL",
  };
  return abbrs[name] || name.substring(0, 3).toUpperCase();
}

function mapSoccerStatus(shortStatus: string): "scheduled" | "live" | "final" {
  const live = ["1H", "HT", "2H", "ET", "BT", "P", "SUSP", "INT", "LIVE"];
  const final = ["FT", "AET", "PEN", "PST", "CANC", "ABD", "AWD", "WO"];
  if (live.includes(shortStatus)) return "live";
  if (final.includes(shortStatus)) return "final";
  return "scheduled";
}

async function fetchWithLogging(url: string, label: string): Promise<any> {
  console.log(`[${label}] Fetching: ${url}`);
  const res = await fetch(url, { headers: { "x-apisports-key": API_KEY } });
  const text = await res.text();
  
  if (!res.ok) {
    console.error(`[${label}] HTTP ${res.status}: ${text.substring(0, 500)}`);
    return null;
  }
  
  try {
    const data = JSON.parse(text);
    const count = data.response?.length || 0;
    console.log(`[${label}] Got ${count} results. Remaining: ${data.paging?.total || 'N/A'}`);
    if (count === 0 && data.errors && Object.keys(data.errors).length > 0) {
      console.error(`[${label}] API errors:`, JSON.stringify(data.errors));
    }
    return data;
  } catch {
    console.error(`[${label}] Failed to parse JSON: ${text.substring(0, 200)}`);
    return null;
  }
}

async function fetchSoccerGames(date: string): Promise<NormalizedGame[]> {
  const games: NormalizedGame[] = [];

  for (const [league, config] of Object.entries(SOCCER_LEAGUES)) {
    try {
      const data = await fetchWithLogging(
        `https://v3.football.api-sports.io/fixtures?date=${date}&league=${config.id}&season=${config.season}`,
        `Soccer/${league}`
      );
      if (!data?.response) continue;

      for (const fixture of data.response) {
        const status = mapSoccerStatus(fixture.fixture.status.short);
        const info = LEAGUE_BROADCASTERS[league] || { broadcaster: "ESPN", streaming: "hulu" };
        
        let period: string | undefined;
        let clock: string | undefined;
        if (status === "live") {
          period = fixture.fixture.status.short === "HT" ? "Half Time" :
                   fixture.fixture.status.short === "1H" ? "1st Half" : "2nd Half";
          clock = fixture.fixture.status.elapsed ? `${fixture.fixture.status.elapsed}'` : undefined;
        }

        games.push({
          id: `soccer-${league}-${fixture.fixture.id}`,
          league,
          homeTeam: fixture.teams.home.name,
          homeAbbr: (fixture.teams.home.name as string).substring(0, 3).toUpperCase(),
          homeLogo: fixture.teams.home.logo || "⚽",
          homeScore: fixture.goals.home,
          awayTeam: fixture.teams.away.name,
          awayAbbr: (fixture.teams.away.name as string).substring(0, 3).toUpperCase(),
          awayLogo: fixture.teams.away.logo || "⚽",
          awayScore: fixture.goals.away,
          status,
          startTime: fixture.fixture.date,
          period,
          clock,
          broadcaster: info.broadcaster,
          streamingService: info.streaming,
        });
      }
    } catch (e) {
      console.error(`Error fetching ${league}:`, e);
    }
  }
  return games;
}

async function fetchBasketballGames(date: string): Promise<NormalizedGame[]> {
  const games: NormalizedGame[] = [];

  for (const [league, config] of Object.entries(BASKETBALL_LEAGUES)) {
    try {
      const data = await fetchWithLogging(
        `https://v1.basketball.api-sports.io/games?date=${date}&league=${config.id}&season=${config.season}`,
        `Basketball/${league}`
      );
      if (!data?.response) continue;

      for (const game of data.response) {
        const shortStatus = game.status?.short || "NS";
        let status: "scheduled" | "live" | "final" = "scheduled";
        
        if (["Q1", "Q2", "Q3", "Q4", "OT", "BT", "HT"].includes(shortStatus)) status = "live";
        else if (["FT", "AOT", "POST"].includes(shortStatus)) status = "final";
        
        const info = LEAGUE_BROADCASTERS[league] || { broadcaster: "ESPN", streaming: "hulu" };
        
        let period: string | undefined;
        let clock: string | undefined;
        if (status === "live") {
          period = shortStatus;
          clock = game.status?.timer ? `${game.status.timer}:00` : undefined;
        }

        games.push({
          id: `bball-${league}-${game.id}`,
          league,
          homeTeam: game.teams.home.name,
          homeAbbr: abbreviate(game.teams.home.name),
          homeLogo: game.teams.home.logo || "🏀",
          homeScore: game.scores?.home?.total ?? null,
          awayTeam: game.teams.away.name,
          awayAbbr: abbreviate(game.teams.away.name),
          awayLogo: game.teams.away.logo || "🏀",
          awayScore: game.scores?.away?.total ?? null,
          status,
          startTime: game.date,
          period,
          clock,
          broadcaster: info.broadcaster,
          streamingService: info.streaming,
        });
      }
    } catch (e) {
      console.error(`Error fetching ${league}:`, e);
    }
  }
  return games;
}

async function fetchHockeyGames(date: string): Promise<NormalizedGame[]> {
  const games: NormalizedGame[] = [];

  for (const [league, config] of Object.entries(HOCKEY_LEAGUES)) {
    try {
      const data = await fetchWithLogging(
        `https://v1.hockey.api-sports.io/games?date=${date}&league=${config.id}&season=${config.season}`,
        `Hockey/${league}`
      );
      if (!data?.response) continue;

      for (const game of data.response) {
        const shortStatus = game.status?.short || "NS";
        let status: "scheduled" | "live" | "final" = "scheduled";
        
        if (["P1", "P2", "P3", "OT", "BT", "PT"].includes(shortStatus)) status = "live";
        else if (["FT", "AOT", "AP", "POST"].includes(shortStatus)) status = "final";
        
        const info = LEAGUE_BROADCASTERS[league] || { broadcaster: "ESPN", streaming: "hulu" };

        games.push({
          id: `hockey-${league}-${game.id}`,
          league,
          homeTeam: game.teams.home.name,
          homeAbbr: abbreviate(game.teams.home.name),
          homeLogo: game.teams.home.logo || "🏒",
          homeScore: game.scores?.home ?? null,
          awayTeam: game.teams.away.name,
          awayAbbr: abbreviate(game.teams.away.name),
          awayLogo: game.teams.away.logo || "🏒",
          awayScore: game.scores?.away ?? null,
          status,
          startTime: game.date,
          period: status === "live" ? shortStatus : undefined,
          broadcaster: info.broadcaster,
          streamingService: info.streaming,
        });
      }
    } catch (e) {
      console.error(`Error fetching ${league}:`, e);
    }
  }
  return games;
}

async function fetchBaseballGames(date: string): Promise<NormalizedGame[]> {
  const games: NormalizedGame[] = [];

  for (const [league, config] of Object.entries(BASEBALL_LEAGUES)) {
    try {
      const data = await fetchWithLogging(
        `https://v1.baseball.api-sports.io/games?date=${date}&league=${config.id}&season=${config.season}`,
        `Baseball/${league}`
      );
      if (!data?.response) continue;

      for (const game of data.response) {
        const shortStatus = game.status?.short || "NS";
        let status: "scheduled" | "live" | "final" = "scheduled";
        
        if (["IN1", "IN2", "IN3", "IN4", "IN5", "IN6", "IN7", "IN8", "IN9", "BT"].includes(shortStatus)) status = "live";
        else if (["FT", "POST"].includes(shortStatus)) status = "final";
        
        const info = LEAGUE_BROADCASTERS[league] || { broadcaster: "ESPN", streaming: "appletv" };

        games.push({
          id: `baseball-${league}-${game.id}`,
          league,
          homeTeam: game.teams.home.name,
          homeAbbr: (game.teams.home.name as string).substring(0, 3).toUpperCase(),
          homeLogo: game.teams.home.logo || "⚾",
          homeScore: game.scores?.home?.total ?? null,
          awayTeam: game.teams.away.name,
          awayAbbr: (game.teams.away.name as string).substring(0, 3).toUpperCase(),
          awayLogo: game.teams.away.logo || "⚾",
          awayScore: game.scores?.away?.total ?? null,
          status,
          startTime: game.date,
          period: status === "live" ? shortStatus.replace("IN", "Inning ") : undefined,
          broadcaster: info.broadcaster,
          streamingService: info.streaming,
        });
      }
    } catch (e) {
      console.error(`Error fetching ${league}:`, e);
    }
  }
  return games;
}

async function fetchAmericanFootballGames(date: string): Promise<NormalizedGame[]> {
  const games: NormalizedGame[] = [];

  for (const [league, config] of Object.entries(AMERICAN_FOOTBALL_LEAGUES)) {
    try {
      const data = await fetchWithLogging(
        `https://v1.american-football.api-sports.io/games?date=${date}&league=${config.id}&season=${config.season}`,
        `AmFootball/${league}`
      );
      if (!data?.response) continue;

      for (const game of data.response) {
        const shortStatus = game.game?.status?.short || "NS";
        let status: "scheduled" | "live" | "final" = "scheduled";
        
        if (["Q1", "Q2", "Q3", "Q4", "OT", "HT", "BT"].includes(shortStatus)) status = "live";
        else if (["FT", "AOT", "POST"].includes(shortStatus)) status = "final";
        
        const info = LEAGUE_BROADCASTERS[league] || { broadcaster: "FOX", streaming: "hulu" };

        games.push({
          id: `amfb-${league}-${game.game.id}`,
          league,
          homeTeam: game.teams.home.name,
          homeAbbr: (game.teams.home.name as string).substring(0, 3).toUpperCase(),
          homeLogo: game.teams.home.logo || "🏈",
          homeScore: game.scores?.home?.total ?? null,
          awayTeam: game.teams.away.name,
          awayAbbr: (game.teams.away.name as string).substring(0, 3).toUpperCase(),
          awayLogo: game.teams.away.logo || "🏈",
          awayScore: game.scores?.away?.total ?? null,
          status,
          startTime: game.game.date.date,
          period: status === "live" ? shortStatus : undefined,
          clock: status === "live" ? game.game.status?.timer || undefined : undefined,
          broadcaster: info.broadcaster,
          streamingService: info.streaming,
        });
      }
    } catch (e) {
      console.error(`Error fetching ${league}:`, e);
    }
  }
  return games;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { date, leagues } = await req.json().catch(() => ({}));
    const targetDate = date || new Date().toISOString().split("T")[0];
    
    console.log(`[live-sports] Request for date=${targetDate}, leagues=${JSON.stringify(leagues)}, API_KEY present=${!!API_KEY}`);
    
    const requestedLeagues: string[] = leagues || [];
    const fetchAll = requestedLeagues.length === 0;
    
    const promises: Promise<NormalizedGame[]>[] = [];
    
    const hasSoccer = fetchAll || requestedLeagues.some(l => 
      ["EPL", "La Liga", "UCL", "MLS", "Liga MX"].includes(l)
    );
    if (hasSoccer) promises.push(fetchSoccerGames(targetDate));
    
    const hasBasketball = fetchAll || requestedLeagues.some(l => 
      ["NBA", "NCAAM"].includes(l)
    );
    if (hasBasketball) promises.push(fetchBasketballGames(targetDate));
    
    const hasHockey = fetchAll || requestedLeagues.some(l => ["NHL"].includes(l));
    if (hasHockey) promises.push(fetchHockeyGames(targetDate));
    
    const hasBaseball = fetchAll || requestedLeagues.some(l => ["MLB"].includes(l));
    if (hasBaseball) promises.push(fetchBaseballGames(targetDate));
    
    const hasAmFootball = fetchAll || requestedLeagues.some(l => 
      ["NFL", "NCAAF"].includes(l)
    );
    if (hasAmFootball) promises.push(fetchAmericanFootballGames(targetDate));

    const results = await Promise.allSettled(promises);
    const allGames: NormalizedGame[] = [];
    
    for (const result of results) {
      if (result.status === "fulfilled") {
        allGames.push(...result.value);
      } else {
        console.error("[live-sports] Promise rejected:", result.reason);
      }
    }

    const filtered = requestedLeagues.length > 0
      ? allGames.filter(g => requestedLeagues.includes(g.league))
      : allGames;

    console.log(`[live-sports] Returning ${filtered.length} games total`);

    return new Response(
      JSON.stringify({ games: filtered, date: targetDate, count: filtered.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Live sports error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch live sports data", games: [] }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
