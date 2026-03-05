export type GameStatus = "scheduled" | "live" | "final";
export type League = "NFL" | "NBA" | "MLB" | "NHL" | "NCAAF" | "WNBA" | "NCAAM" | "NCAAW" | "F1" | "NASCAR" | "Golf" | "MLS" | "Liga MX" | "EPL" | "La Liga" | "UCL";

export interface GameData {
  id: string;
  league: League;
  homeTeam: string;
  homeAbbr: string;
  homeLogo: string;
  homeScore: number | null;
  awayTeam: string;
  awayAbbr: string;
  awayLogo: string;
  awayScore: number | null;
  status: GameStatus;
  startTime: string; // ISO string
  period?: string;
  clock?: string;
  broadcaster: string;
  streamingService: string;
  isEvent?: boolean;
  eventName?: string;
  eventRound?: string;
  position?: string;
}

// Season schedule info for season pass tracking
export interface SeasonInfo {
  name: string;
  league: string;
  primaryService: string;
  startDate: string;
  endDate: string;
}

export const SEASON_DATA: Record<string, SeasonInfo> = {
  NFL: { name: "2025–26 NFL Season", league: "NFL", primaryService: "peacock", startDate: "2025-09-04", endDate: "2026-02-08" },
  NBA: { name: "2025–26 NBA Season", league: "NBA", primaryService: "hulu", startDate: "2025-10-21", endDate: "2026-06-19" },
  MLB: { name: "2026 MLB Season", league: "MLB", primaryService: "appletv", startDate: "2026-03-26", endDate: "2026-10-25" },
  NHL: { name: "2025–26 NHL Season", league: "NHL", primaryService: "hulu", startDate: "2025-10-07", endDate: "2026-06-15" },
  NCAAF: { name: "2026 College Football", league: "NCAAF", primaryService: "hulu", startDate: "2026-08-29", endDate: "2027-01-12" },
  WNBA: { name: "2026 WNBA Season", league: "WNBA", primaryService: "paramount", startDate: "2026-05-16", endDate: "2026-10-20" },
  NCAAM: { name: "2025–26 NCAA Men's Basketball", league: "NCAAM", primaryService: "paramount", startDate: "2025-11-04", endDate: "2026-04-06" },
  NCAAW: { name: "2025–26 NCAA Women's Basketball", league: "NCAAW", primaryService: "hulu", startDate: "2025-11-04", endDate: "2026-04-06" },
  F1: { name: "2026 F1 World Championship", league: "F1", primaryService: "hulu", startDate: "2026-03-15", endDate: "2026-12-06" },
  NASCAR: { name: "2026 NASCAR Cup Series", league: "NASCAR", primaryService: "peacock", startDate: "2026-02-15", endDate: "2026-11-08" },
  Golf: { name: "2026 PGA Tour", league: "Golf", primaryService: "peacock", startDate: "2026-01-08", endDate: "2026-08-30" },
  MLS: { name: "2026 MLS Season", league: "MLS", primaryService: "appletv", startDate: "2026-02-22", endDate: "2026-11-09" },
  "Liga MX": { name: "2026 Liga MX Clausura", league: "Liga MX", primaryService: "peacock", startDate: "2026-01-10", endDate: "2026-05-25" },
  EPL: { name: "2025–26 Premier League", league: "EPL", primaryService: "peacock", startDate: "2025-08-16", endDate: "2026-05-24" },
  "La Liga": { name: "2025–26 La Liga", league: "La Liga", primaryService: "hulu", startDate: "2025-08-15", endDate: "2026-05-24" },
  UCL: { name: "2025–26 Champions League", league: "UCL", primaryService: "paramount", startDate: "2025-09-17", endDate: "2026-05-30" },
};

/** Check if a league is currently in-season */
export function isLeagueInSeason(league: string): boolean {
  const season = SEASON_DATA[league];
  if (!season) return true;
  const now = new Date();
  return now >= new Date(season.startDate) && now <= new Date(season.endDate);
}

/**
 * Create a UTC Date for a given Eastern Time hour on a specific day offset.
 * Uses America/New_York to handle EST/EDT automatically.
 */
function etToUtc(dayOffset: number, hour: number, minute = 0): string {
  const now = new Date();
  // Build a date string in ET
  const base = new Date(now.getFullYear(), now.getMonth(), now.getDate() + dayOffset);
  const month = String(base.getMonth() + 1).padStart(2, '0');
  const day = String(base.getDate()).padStart(2, '0');
  const h = String(hour).padStart(2, '0');
  const m = String(minute).padStart(2, '0');
  // Use Intl to figure out the ET offset, then compute UTC
  // Simpler approach: construct an ET-labeled string and parse it
  const etString = `${base.getFullYear()}-${month}-${day}T${h}:${m}:00`;
  // Get the offset for this date in ET
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    timeZoneName: 'shortOffset',
  });
  const parts = formatter.formatToParts(base);
  const tzPart = parts.find(p => p.type === 'timeZoneName');
  // Parse offset like "GMT-5" or "GMT-4"
  const offsetMatch = tzPart?.value?.match(/GMT([+-]\d+)/);
  const offsetHours = offsetMatch ? parseInt(offsetMatch[1]) : -5;
  // Convert ET to UTC by subtracting the offset
  const utcDate = new Date(etString + "Z");
  utcDate.setHours(utcDate.getHours() - offsetHours);
  return utcDate.toISOString();
}

function todayAt(hour: number, minute = 0): string {
  return etToUtc(0, hour, minute);
}

function yesterdayAt(hour: number, minute = 0): string {
  return etToUtc(-1, hour, minute);
}

function tomorrowAt(hour: number, minute = 0): string {
  return etToUtc(1, hour, minute);
}

/**
 * Determine the status of a game based on its start time and typical game duration.
 * This makes games automatically transition from scheduled → live → final.
 */
function dynamicStatus(startTime: string, durationHours = 2.5): { status: GameStatus; elapsed: number } {
  const now = Date.now();
  const start = new Date(startTime).getTime();
  const end = start + durationHours * 3600000;

  if (now < start) return { status: "scheduled", elapsed: 0 };
  if (now >= start && now < end) return { status: "live", elapsed: (now - start) / 60000 };
  return { status: "final", elapsed: durationHours * 60 };
}

function nbaPeriodClock(elapsedMinutes: number): { period: string; clock: string } {
  // NBA: 4 quarters of 12 min, breaks between. ~48 min game time over ~2.5 hrs.
  const gameMinutes = elapsedMinutes * (48 / 150); // compress real time to game time
  const quarter = Math.min(4, Math.floor(gameMinutes / 12) + 1);
  const remaining = 12 - (gameMinutes % 12);
  return { period: `${quarter}${quarter === 1 ? 'st' : quarter === 2 ? 'nd' : quarter === 3 ? 'rd' : 'th'}`, clock: `${Math.floor(remaining)}:${String(Math.floor((remaining % 1) * 60)).padStart(2, '0')}` };
}

function nhlPeriodClock(elapsedMinutes: number): { period: string; clock: string } {
  const gameMinutes = elapsedMinutes * (60 / 150);
  const periodNum = Math.min(3, Math.floor(gameMinutes / 20) + 1);
  const remaining = 20 - (gameMinutes % 20);
  return { period: `${periodNum}${periodNum === 1 ? 'st' : periodNum === 2 ? 'nd' : 'rd'}`, clock: `${Math.floor(remaining)}:${String(Math.floor((remaining % 1) * 60)).padStart(2, '0')}` };
}

function soccerClock(elapsedMinutes: number): { period: string; clock: string } {
  const gameMinutes = elapsedMinutes * (90 / 120);
  const half = gameMinutes <= 45 ? "1st Half" : "2nd Half";
  return { period: half, clock: `${Math.min(90, Math.floor(gameMinutes))}'` };
}

/** Generate a seeded pseudo-random score based on game id + status */
function seededScore(id: string, maxScore: number): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = Math.imul(31, h) + id.charCodeAt(i) | 0;
  }
  return Math.abs(h % (maxScore + 1));
}

function buildGame(raw: Omit<GameData, 'status' | 'period' | 'clock'> & { _duration?: number }): GameData {
  const duration = raw._duration || 2.5;
  const { status, elapsed } = dynamicStatus(raw.startTime, duration);

  let period: string | undefined;
  let clock: string | undefined;
  let homeScore = raw.homeScore;
  let awayScore = raw.awayScore;

  if (status === "live") {
    if (raw.league === "NBA" || raw.league === "NCAAM" || raw.league === "NCAAW" || raw.league === "WNBA") {
      const pc = nbaPeriodClock(elapsed);
      period = pc.period;
      clock = pc.clock;
      // Scores based on elapsed time
      const factor = elapsed / 150;
      homeScore = Math.floor(seededScore(raw.id + "h", 110) * factor + 10 * factor);
      awayScore = Math.floor(seededScore(raw.id + "a", 110) * factor + 10 * factor);
    } else if (raw.league === "NHL") {
      const pc = nhlPeriodClock(elapsed);
      period = pc.period;
      clock = pc.clock;
      const factor = elapsed / 150;
      homeScore = Math.floor(seededScore(raw.id + "h", 5) * factor);
      awayScore = Math.floor(seededScore(raw.id + "a", 5) * factor);
    } else if (["MLS", "EPL", "La Liga", "UCL", "Liga MX"].includes(raw.league)) {
      const pc = soccerClock(elapsed);
      period = pc.period;
      clock = pc.clock;
      const factor = elapsed / 120;
      homeScore = Math.floor(seededScore(raw.id + "h", 4) * factor);
      awayScore = Math.floor(seededScore(raw.id + "a", 4) * factor);
    } else if (raw.isEvent) {
      period = raw.eventRound;
    }
  } else if (status === "final") {
    // Generate final scores
    if (raw.league === "NBA" || raw.league === "NCAAM") {
      homeScore = seededScore(raw.id + "hf", 30) + 90;
      awayScore = seededScore(raw.id + "af", 30) + 90;
    } else if (raw.league === "NHL") {
      homeScore = seededScore(raw.id + "hf", 5) + 1;
      awayScore = seededScore(raw.id + "af", 5) + 1;
    } else if (["MLS", "EPL", "La Liga", "UCL", "Liga MX"].includes(raw.league)) {
      homeScore = seededScore(raw.id + "hf", 4);
      awayScore = seededScore(raw.id + "af", 4);
    }
  } else {
    homeScore = null;
    awayScore = null;
  }

  const { _duration, ...rest } = raw as any;
  return { ...rest, status, period, clock, homeScore, awayScore };
}

// ── Multi-day schedule with realistic game times (ET) ──
const allMockGames: GameData[] = [
  // ═══════════════════ YESTERDAY ═══════════════════
  buildGame({
    id: "nba-y-1", league: "NBA",
    homeTeam: "Miami Heat", homeAbbr: "MIA", homeLogo: "🏀", homeScore: null,
    awayTeam: "New York Knicks", awayAbbr: "NYK", awayLogo: "🏀", awayScore: null,
    startTime: yesterdayAt(19, 30),
    broadcaster: "ESPN", streamingService: "hulu",
  }),
  buildGame({
    id: "nba-y-2", league: "NBA",
    homeTeam: "Sacramento Kings", homeAbbr: "SAC", homeLogo: "🏀", homeScore: null,
    awayTeam: "Houston Rockets", awayAbbr: "HOU", awayLogo: "🏀", awayScore: null,
    startTime: yesterdayAt(22, 0),
    broadcaster: "NBA TV", streamingService: "hulu",
  }),
  buildGame({
    id: "nhl-y-1", league: "NHL",
    homeTeam: "Boston Bruins", homeAbbr: "BOS", homeLogo: "🏒", homeScore: null,
    awayTeam: "Detroit Red Wings", awayAbbr: "DET", awayLogo: "🏒", awayScore: null,
    startTime: yesterdayAt(19, 0),
    broadcaster: "ESPN", streamingService: "hulu",
  }),
  buildGame({
    id: "epl-y-1", league: "EPL",
    homeTeam: "Tottenham Hotspur", homeAbbr: "TOT", homeLogo: "⚽", homeScore: null,
    awayTeam: "Aston Villa", awayAbbr: "AVL", awayLogo: "⚽", awayScore: null,
    startTime: yesterdayAt(15, 0),
    broadcaster: "Peacock", streamingService: "peacock",
    _duration: 2,
  }),

  // ═══════════════════ TODAY ═══════════════════
  // ── NBA ──
  buildGame({
    id: "nba-today-1", league: "NBA",
    homeTeam: "Denver Nuggets", homeAbbr: "DEN", homeLogo: "🏀", homeScore: null,
    awayTeam: "Los Angeles Lakers", awayAbbr: "LAL", awayLogo: "🏀", awayScore: null,
    startTime: todayAt(21, 0),
    broadcaster: "ESPN", streamingService: "hulu",
  }),
  buildGame({
    id: "nba-today-2", league: "NBA",
    homeTeam: "Cleveland Cavaliers", homeAbbr: "CLE", homeLogo: "🏀", homeScore: null,
    awayTeam: "Boston Celtics", awayAbbr: "BOS", awayLogo: "🏀", awayScore: null,
    startTime: todayAt(19, 0),
    broadcaster: "TNT", streamingService: "hbomax",
  }),
  buildGame({
    id: "nba-today-3", league: "NBA",
    homeTeam: "Phoenix Suns", homeAbbr: "PHX", homeLogo: "🏀", homeScore: null,
    awayTeam: "Golden State Warriors", awayAbbr: "GSW", awayLogo: "🏀", awayScore: null,
    startTime: todayAt(22, 0),
    broadcaster: "NBA TV", streamingService: "hulu",
  }),
  buildGame({
    id: "nba-today-4", league: "NBA",
    homeTeam: "Milwaukee Bucks", homeAbbr: "MIL", homeLogo: "🏀", homeScore: null,
    awayTeam: "Philadelphia 76ers", awayAbbr: "PHI", awayLogo: "🏀", awayScore: null,
    startTime: todayAt(19, 30),
    broadcaster: "ESPN", streamingService: "hulu",
  }),
  buildGame({
    id: "nba-today-5", league: "NBA",
    homeTeam: "Dallas Mavericks", homeAbbr: "DAL", homeLogo: "🏀", homeScore: null,
    awayTeam: "Minnesota Timberwolves", awayAbbr: "MIN", awayLogo: "🏀", awayScore: null,
    startTime: todayAt(20, 30),
    broadcaster: "TNT", streamingService: "hbomax",
  }),

  // ── NHL ──
  buildGame({
    id: "nhl-today-1", league: "NHL",
    homeTeam: "Edmonton Oilers", homeAbbr: "EDM", homeLogo: "🏒", homeScore: null,
    awayTeam: "Colorado Avalanche", awayAbbr: "COL", awayLogo: "🏒", awayScore: null,
    startTime: todayAt(21, 0),
    broadcaster: "ESPN", streamingService: "hulu",
  }),
  buildGame({
    id: "nhl-today-2", league: "NHL",
    homeTeam: "New York Rangers", homeAbbr: "NYR", homeLogo: "🏒", homeScore: null,
    awayTeam: "Toronto Maple Leafs", awayAbbr: "TOR", awayLogo: "🏒", awayScore: null,
    startTime: todayAt(19, 0),
    broadcaster: "TNT", streamingService: "hbomax",
  }),
  buildGame({
    id: "nhl-today-3", league: "NHL",
    homeTeam: "Tampa Bay Lightning", homeAbbr: "TBL", homeLogo: "🏒", homeScore: null,
    awayTeam: "Florida Panthers", awayAbbr: "FLA", awayLogo: "🏒", awayScore: null,
    startTime: todayAt(19, 30),
    broadcaster: "ESPN", streamingService: "hulu",
  }),

  // ── NCAAM ──
  buildGame({
    id: "ncaam-today-1", league: "NCAAM",
    homeTeam: "Duke Blue Devils", homeAbbr: "DUKE", homeLogo: "🏀", homeScore: null,
    awayTeam: "UNC Tar Heels", awayAbbr: "UNC", awayLogo: "🏀", awayScore: null,
    startTime: todayAt(18, 0),
    broadcaster: "ESPN", streamingService: "hulu",
  }),
  buildGame({
    id: "ncaam-today-2", league: "NCAAM",
    homeTeam: "Kansas Jayhawks", homeAbbr: "KU", homeLogo: "🏀", homeScore: null,
    awayTeam: "Kentucky Wildcats", awayAbbr: "UK", awayLogo: "🏀", awayScore: null,
    startTime: todayAt(20, 0),
    broadcaster: "CBS", streamingService: "paramount",
  }),

  // ── NCAAW ──
  buildGame({
    id: "ncaaw-today-1", league: "NCAAW",
    homeTeam: "South Carolina Gamecocks", homeAbbr: "SC", homeLogo: "🏀", homeScore: null,
    awayTeam: "LSU Tigers", awayAbbr: "LSU", awayLogo: "🏀", awayScore: null,
    startTime: todayAt(19, 0),
    broadcaster: "ESPN2", streamingService: "hulu",
  }),

  // ── MLS ──
  buildGame({
    id: "mls-today-1", league: "MLS",
    homeTeam: "LAFC", homeAbbr: "LAFC", homeLogo: "⚽", homeScore: null,
    awayTeam: "Inter Miami CF", awayAbbr: "MIA", awayLogo: "⚽", awayScore: null,
    startTime: todayAt(20, 30),
    broadcaster: "Apple TV+", streamingService: "appletv",
    _duration: 2,
  }),
  buildGame({
    id: "mls-today-2", league: "MLS",
    homeTeam: "LA Galaxy", homeAbbr: "LAG", homeLogo: "⚽", homeScore: null,
    awayTeam: "Seattle Sounders", awayAbbr: "SEA", awayLogo: "⚽", awayScore: null,
    startTime: todayAt(22, 0),
    broadcaster: "Apple TV+", streamingService: "appletv",
    _duration: 2,
  }),

  // ── Liga MX ──
  buildGame({
    id: "ligamx-today-1", league: "Liga MX",
    homeTeam: "Club América", homeAbbr: "AME", homeLogo: "⚽", homeScore: null,
    awayTeam: "Chivas Guadalajara", awayAbbr: "CHI", awayLogo: "⚽", awayScore: null,
    startTime: todayAt(21, 0),
    broadcaster: "Telemundo", streamingService: "peacock",
    _duration: 2,
  }),

  // ── EPL ──
  buildGame({
    id: "epl-today-1", league: "EPL",
    homeTeam: "Arsenal", homeAbbr: "ARS", homeLogo: "⚽", homeScore: null,
    awayTeam: "Manchester United", awayAbbr: "MUN", awayLogo: "⚽", awayScore: null,
    startTime: todayAt(12, 30),
    broadcaster: "NBC", streamingService: "peacock",
    _duration: 2,
  }),
  buildGame({
    id: "epl-today-2", league: "EPL",
    homeTeam: "Liverpool", homeAbbr: "LIV", homeLogo: "⚽", homeScore: null,
    awayTeam: "Chelsea", awayAbbr: "CHE", awayLogo: "⚽", awayScore: null,
    startTime: todayAt(15, 0),
    broadcaster: "Peacock", streamingService: "peacock",
    _duration: 2,
  }),

  // ── La Liga ──
  buildGame({
    id: "laliga-today-1", league: "La Liga",
    homeTeam: "Real Madrid", homeAbbr: "RMA", homeLogo: "⚽", homeScore: null,
    awayTeam: "FC Barcelona", awayAbbr: "FCB", awayLogo: "⚽", awayScore: null,
    startTime: todayAt(15, 0),
    broadcaster: "ESPN+", streamingService: "hulu",
    _duration: 2,
  }),

  // ── UCL ──
  buildGame({
    id: "ucl-today-1", league: "UCL",
    homeTeam: "Bayern Munich", homeAbbr: "BAY", homeLogo: "⚽", homeScore: null,
    awayTeam: "Paris Saint-Germain", awayAbbr: "PSG", awayLogo: "⚽", awayScore: null,
    startTime: todayAt(15, 0),
    broadcaster: "CBS", streamingService: "paramount",
    _duration: 2,
  }),

  // ── Golf ──
  buildGame({
    id: "golf-today-1", league: "Golf",
    homeTeam: "Scottie Scheffler", homeAbbr: "SCH", homeLogo: "⛳", homeScore: null,
    awayTeam: "Rory McIlroy", awayAbbr: "McI", awayLogo: "⛳", awayScore: null,
    startTime: todayAt(10, 0),
    broadcaster: "CBS", streamingService: "paramount",
    isEvent: true, eventName: "Arnold Palmer Invitational", eventRound: "Round 3", position: "Leader: SCH (-12)",
    _duration: 5,
  }),

  // ═══════════════════ TOMORROW ═══════════════════
  buildGame({
    id: "nba-t-1", league: "NBA",
    homeTeam: "Los Angeles Lakers", homeAbbr: "LAL", homeLogo: "🏀", homeScore: null,
    awayTeam: "Portland Trail Blazers", awayAbbr: "POR", awayLogo: "🏀", awayScore: null,
    startTime: tomorrowAt(22, 0),
    broadcaster: "ESPN", streamingService: "hulu",
  }),
  buildGame({
    id: "nba-t-2", league: "NBA",
    homeTeam: "Chicago Bulls", homeAbbr: "CHI", homeLogo: "🏀", homeScore: null,
    awayTeam: "Atlanta Hawks", awayAbbr: "ATL", awayLogo: "🏀", awayScore: null,
    startTime: tomorrowAt(20, 0),
    broadcaster: "TNT", streamingService: "hbomax",
  }),
  buildGame({
    id: "nba-t-3", league: "NBA",
    homeTeam: "Indiana Pacers", homeAbbr: "IND", homeLogo: "🏀", homeScore: null,
    awayTeam: "Toronto Raptors", awayAbbr: "TOR", awayLogo: "🏀", awayScore: null,
    startTime: tomorrowAt(19, 0),
    broadcaster: "NBA TV", streamingService: "hulu",
  }),
  buildGame({
    id: "nhl-t-1", league: "NHL",
    homeTeam: "Pittsburgh Penguins", homeAbbr: "PIT", homeLogo: "🏒", homeScore: null,
    awayTeam: "Washington Capitals", awayAbbr: "WSH", awayLogo: "🏒", awayScore: null,
    startTime: tomorrowAt(19, 0),
    broadcaster: "TNT", streamingService: "hbomax",
  }),
  buildGame({
    id: "nhl-t-2", league: "NHL",
    homeTeam: "Vegas Golden Knights", homeAbbr: "VGK", homeLogo: "🏒", homeScore: null,
    awayTeam: "Dallas Stars", awayAbbr: "DAL", awayLogo: "🏒", awayScore: null,
    startTime: tomorrowAt(22, 0),
    broadcaster: "ESPN", streamingService: "hulu",
  }),
  buildGame({
    id: "ucl-t-1", league: "UCL",
    homeTeam: "Manchester City", homeAbbr: "MCI", homeLogo: "⚽", homeScore: null,
    awayTeam: "Inter Milan", awayAbbr: "INT", awayLogo: "⚽", awayScore: null,
    startTime: tomorrowAt(15, 0),
    broadcaster: "CBS", streamingService: "paramount",
    _duration: 2,
  }),
  buildGame({
    id: "mls-t-1", league: "MLS",
    homeTeam: "Atlanta United", homeAbbr: "ATL", homeLogo: "⚽", homeScore: null,
    awayTeam: "Nashville SC", awayAbbr: "NSH", awayLogo: "⚽", awayScore: null,
    startTime: tomorrowAt(19, 30),
    broadcaster: "Apple TV+", streamingService: "appletv",
    _duration: 2,
  }),
  buildGame({
    id: "nascar-t-1", league: "NASCAR",
    homeTeam: "Kyle Larson", homeAbbr: "LAR", homeLogo: "🏁", homeScore: null,
    awayTeam: "Denny Hamlin", awayAbbr: "HAM", awayLogo: "🏁", awayScore: null,
    startTime: tomorrowAt(14, 0),
    broadcaster: "FOX", streamingService: "hulu",
    isEvent: true, eventName: "Atlanta Motor Speedway", eventRound: "Race",
    _duration: 3,
  }),

  // ═══════════════════ DAY AFTER TOMORROW ═══════════════════
  buildGame({
    id: "nba-d2-1", league: "NBA",
    homeTeam: "Boston Celtics", homeAbbr: "BOS", homeLogo: "🏀", homeScore: null,
    awayTeam: "Milwaukee Bucks", awayAbbr: "MIL", awayLogo: "🏀", awayScore: null,
    startTime: etToUtc(2, 19, 30),
    broadcaster: "ESPN", streamingService: "hulu",
  }),
  buildGame({
    id: "nba-d2-2", league: "NBA",
    homeTeam: "Golden State Warriors", homeAbbr: "GSW", homeLogo: "🏀", homeScore: null,
    awayTeam: "Denver Nuggets", awayAbbr: "DEN", awayLogo: "🏀", awayScore: null,
    startTime: etToUtc(2, 22, 0),
    broadcaster: "TNT", streamingService: "hbomax",
  }),
  buildGame({
    id: "nhl-d2-1", league: "NHL",
    homeTeam: "Carolina Hurricanes", homeAbbr: "CAR", homeLogo: "🏒", homeScore: null,
    awayTeam: "New York Rangers", awayAbbr: "NYR", awayLogo: "🏒", awayScore: null,
    startTime: etToUtc(2, 19, 0),
    broadcaster: "ESPN", streamingService: "hulu",
  }),
  buildGame({
    id: "epl-d2-1", league: "EPL",
    homeTeam: "Manchester City", homeAbbr: "MCI", homeLogo: "⚽", homeScore: null,
    awayTeam: "Newcastle United", awayAbbr: "NEW", awayLogo: "⚽", awayScore: null,
    startTime: etToUtc(2, 12, 30),
    broadcaster: "NBC", streamingService: "peacock",
    _duration: 2,
  }),
  buildGame({
    id: "golf-d2-1", league: "Golf",
    homeTeam: "Scottie Scheffler", homeAbbr: "SCH", homeLogo: "⛳", homeScore: null,
    awayTeam: "Rory McIlroy", awayAbbr: "McI", awayLogo: "⛳", awayScore: null,
    startTime: etToUtc(2, 10, 0),
    broadcaster: "CBS", streamingService: "paramount",
    isEvent: true, eventName: "Arnold Palmer Invitational", eventRound: "Final Round", position: "Leader: SCH (-15)",
    _duration: 5,
  }),
];

/** Only include games from leagues currently in-season */
export const MOCK_GAMES: GameData[] = allMockGames.filter((g) => isLeagueInSeason(g.league));

/** Get games for a specific date (compares in user's local timezone) */
export function getGamesForDate(date: Date): GameData[] {
  const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const dayEnd = dayStart + 24 * 60 * 60 * 1000;
  return MOCK_GAMES.filter((g) => {
    const t = new Date(g.startTime).getTime();
    return t >= dayStart && t < dayEnd;
  });
}
