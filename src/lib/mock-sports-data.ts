export type GameStatus = "scheduled" | "live" | "final";
export type League = "NFL" | "NBA" | "MLB";

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
  streamingService: string; // matches streaming-services IDs
}

const now = new Date();
const later = (hours: number) => new Date(now.getTime() + hours * 3600000).toISOString();
const ago = (hours: number) => new Date(now.getTime() - hours * 3600000).toISOString();

// Season schedule info for season pass tracking
export interface SeasonInfo {
  name: string;
  league: string;
  primaryService: string;
  startDate: string;
  endDate: string;
}

export const SEASON_DATA: Record<string, SeasonInfo> = {
  NFL: {
    name: "2025–26 NFL Season",
    league: "NFL",
    primaryService: "peacock",
    startDate: "2025-09-04",
    endDate: "2026-02-08",
  },
  NBA: {
    name: "2025–26 NBA Season",
    league: "NBA",
    primaryService: "hulu",
    startDate: "2025-10-21",
    endDate: "2026-06-19",
  },
  MLB: {
    name: "2026 MLB Season",
    league: "MLB",
    primaryService: "appletv",
    startDate: "2026-03-26",
    endDate: "2026-10-25",
  },
};

export const MOCK_GAMES: GameData[] = [
  {
    id: "nba-1",
    league: "NBA",
    homeTeam: "Los Angeles Lakers",
    homeAbbr: "LAL",
    homeLogo: "🏀",
    homeScore: 87,
    awayTeam: "Boston Celtics",
    awayAbbr: "BOS",
    awayLogo: "🏀",
    awayScore: 91,
    status: "live",
    startTime: ago(1.5),
    period: "3rd",
    clock: "4:32",
    broadcaster: "ESPN",
    streamingService: "hulu",
  },
  {
    id: "nba-2",
    league: "NBA",
    homeTeam: "Golden State Warriors",
    homeAbbr: "GSW",
    homeLogo: "🏀",
    homeScore: null,
    awayTeam: "Milwaukee Bucks",
    awayAbbr: "MIL",
    awayLogo: "🏀",
    awayScore: null,
    status: "scheduled",
    startTime: later(3),
    broadcaster: "TNT",
    streamingService: "hbomax",
  },
  {
    id: "nfl-1",
    league: "NFL",
    homeTeam: "Kansas City Chiefs",
    homeAbbr: "KC",
    homeLogo: "🏈",
    homeScore: 21,
    awayTeam: "San Francisco 49ers",
    awayAbbr: "SF",
    awayLogo: "🏈",
    awayScore: 17,
    status: "live",
    startTime: ago(2),
    period: "3rd",
    clock: "8:15",
    broadcaster: "FOX",
    streamingService: "hulu",
  },
  {
    id: "nfl-2",
    league: "NFL",
    homeTeam: "Dallas Cowboys",
    homeAbbr: "DAL",
    homeLogo: "🏈",
    homeScore: null,
    awayTeam: "Philadelphia Eagles",
    awayAbbr: "PHI",
    awayLogo: "🏈",
    awayScore: null,
    status: "scheduled",
    startTime: later(5),
    broadcaster: "CBS",
    streamingService: "paramount",
  },
  {
    id: "mlb-1",
    league: "MLB",
    homeTeam: "New York Yankees",
    homeAbbr: "NYY",
    homeLogo: "⚾",
    homeScore: 3,
    awayTeam: "Los Angeles Dodgers",
    awayAbbr: "LAD",
    awayLogo: "⚾",
    awayScore: 5,
    status: "final",
    startTime: ago(4),
    broadcaster: "Apple TV+",
    streamingService: "appletv",
  },
  {
    id: "mlb-2",
    league: "MLB",
    homeTeam: "Houston Astros",
    homeAbbr: "HOU",
    homeLogo: "⚾",
    homeScore: null,
    awayTeam: "Atlanta Braves",
    awayAbbr: "ATL",
    awayLogo: "⚾",
    awayScore: null,
    status: "scheduled",
    startTime: later(2),
    broadcaster: "ESPN+",
    streamingService: "disney",
  },
  {
    id: "nba-3",
    league: "NBA",
    homeTeam: "Phoenix Suns",
    homeAbbr: "PHX",
    homeLogo: "🏀",
    homeScore: 112,
    awayTeam: "Denver Nuggets",
    awayAbbr: "DEN",
    awayLogo: "🏀",
    awayScore: 108,
    status: "final",
    startTime: ago(3),
    broadcaster: "NBA TV",
    streamingService: "hulu",
  },
];
