const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// API-Sports league ID mappings
const SOCCER_LEAGUES: Record<string, number> = {
  EPL: 39,
  "La Liga": 140,
  UCL: 2,
  MLS: 253,
  "Liga MX": 262,
};

const BASKETBALL_LEAGUES: Record<string, number> = {
  NBA: 12,
  NCAAM: 116,
};

const HOCKEY_LEAGUES: Record<string, number> = {
  NHL: 57,
};

const BASEBALL_LEAGUES: Record<string, number> = {
  MLB: 1,
};

const AMERICAN_FOOTBALL_LEAGUES: Record<string, number> = {
  NFL: 1,
  NCAAF: 8,
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
  // Common abbreviations
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

function mapBasketballStatus(shortStatus: number | string): "scheduled" | "live" | "final" {
  // API-Basketball uses numeric status or string
  const s = String(shortStatus);
  if (["1", "2", "3", "4", "5"].includes(s)) return "live"; // quarters/OT
  if (["6", "7"].includes(s)) return "live"; // break
  if (["3"].includes(s) || s === "FT" || s === "AOT") return "final";
  return "scheduled";
}

async function fetchSoccerGames(date: string): Promise<NormalizedGame[]> {
  const games: NormalizedGame[] = [];

  for (const [league, leagueId] of Object.entries(SOCCER_LEAGUES)) {
    try {
      const res = await fetch(
        `https://v3.football.api-sports.io/fixtures?date=${date}&league=${leagueId}&season=${new Date().getFullYear() > 6 ? new Date().getFullYear() - 1 : new Date().getFullYear()}`,
        { headers: { "x-apisports-key": API_KEY } }
      );
      const data = await res.json();
      if (!data.response) continue;

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

  for (const [league, leagueId] of Object.entries(BASKETBALL_LEAGUES)) {
    try {
      const res = await fetch(
        `https://v1.basketball.api-sports.io/games?date=${date}&league=${leagueId}&season=${league === "NBA" ? "2025-2026" : "2025-2026"}`,
        { headers: { "x-apisports-key": API_KEY } }
      );
      const data = await res.json();
      if (!data.response) continue;

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

  for (const [league, leagueId] of Object.entries(HOCKEY_LEAGUES)) {
    try {
      const res = await fetch(
        `https://v1.hockey.api-sports.io/games?date=${date}&league=${leagueId}&season=2025`,
        { headers: { "x-apisports-key": API_KEY } }
      );
      const data = await res.json();
      if (!data.response) continue;

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
          homeAbbr: (game.teams.home.name as string).substring(0, 3).toUpperCase(),
          homeLogo: game.teams.home.logo || "🏒",
          homeScore: game.scores?.home ?? null,
          awayTeam: game.teams.away.name,
          awayAbbr: (game.teams.away.name as string).substring(0, 3).toUpperCase(),
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

  for (const [league, leagueId] of Object.entries(BASEBALL_LEAGUES)) {
    try {
      const res = await fetch(
        `https://v1.baseball.api-sports.io/games?date=${date}&league=${leagueId}&season=2026`,
        { headers: { "x-apisports-key": API_KEY } }
      );
      const data = await res.json();
      if (!data.response) continue;

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

  for (const [league, leagueId] of Object.entries(AMERICAN_FOOTBALL_LEAGUES)) {
    try {
      const res = await fetch(
        `https://v1.american-football.api-sports.io/games?date=${date}&league=${leagueId}&season=2025`,
        { headers: { "x-apisports-key": API_KEY } }
      );
      const data = await res.json();
      if (!data.response) continue;

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
    
    // Optionally filter which sport groups to fetch
    const requestedLeagues: string[] = leagues || [];
    
    const fetchAll = requestedLeagues.length === 0;
    
    const promises: Promise<NormalizedGame[]>[] = [];
    
    // Soccer leagues
    const hasSoccer = fetchAll || requestedLeagues.some(l => 
      ["EPL", "La Liga", "UCL", "MLS", "Liga MX"].includes(l)
    );
    if (hasSoccer) promises.push(fetchSoccerGames(targetDate));
    
    // Basketball
    const hasBasketball = fetchAll || requestedLeagues.some(l => 
      ["NBA", "NCAAM"].includes(l)
    );
    if (hasBasketball) promises.push(fetchBasketballGames(targetDate));
    
    // Hockey
    const hasHockey = fetchAll || requestedLeagues.some(l => ["NHL"].includes(l));
    if (hasHockey) promises.push(fetchHockeyGames(targetDate));
    
    // Baseball
    const hasBaseball = fetchAll || requestedLeagues.some(l => ["MLB"].includes(l));
    if (hasBaseball) promises.push(fetchBaseballGames(targetDate));
    
    // American Football
    const hasAmFootball = fetchAll || requestedLeagues.some(l => 
      ["NFL", "NCAAF"].includes(l)
    );
    if (hasAmFootball) promises.push(fetchAmericanFootballGames(targetDate));

    const results = await Promise.allSettled(promises);
    const allGames: NormalizedGame[] = [];
    
    for (const result of results) {
      if (result.status === "fulfilled") {
        allGames.push(...result.value);
      }
    }

    // Filter to only requested leagues if specified
    const filtered = requestedLeagues.length > 0
      ? allGames.filter(g => requestedLeagues.includes(g.league))
      : allGames;

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
