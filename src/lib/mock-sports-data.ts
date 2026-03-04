export type GameStatus = "scheduled" | "live" | "final";
export type League = "NFL" | "NBA" | "MLB" | "NHL" | "NCAAF" | "WNBA" | "NCAAM" | "NCAAW" | "F1" | "NASCAR" | "Golf";

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
  isEvent?: boolean; // true for F1, NASCAR, Golf (no head-to-head)
  eventName?: string; // e.g. "Monaco Grand Prix"
  eventRound?: string; // e.g. "Race", "Round 2", "Final Round"
  position?: string; // leader position for events
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
};

export const MOCK_GAMES: GameData[] = [
  // ── NBA ──
  {
    id: "nba-1", league: "NBA",
    homeTeam: "Los Angeles Lakers", homeAbbr: "LAL", homeLogo: "🏀", homeScore: 87,
    awayTeam: "Boston Celtics", awayAbbr: "BOS", awayLogo: "🏀", awayScore: 91,
    status: "live", startTime: ago(1.5), period: "3rd", clock: "4:32",
    broadcaster: "ESPN", streamingService: "hulu",
  },
  {
    id: "nba-2", league: "NBA",
    homeTeam: "Golden State Warriors", homeAbbr: "GSW", homeLogo: "🏀", homeScore: null,
    awayTeam: "Milwaukee Bucks", awayAbbr: "MIL", awayLogo: "🏀", awayScore: null,
    status: "scheduled", startTime: later(3),
    broadcaster: "TNT", streamingService: "hbomax",
  },
  {
    id: "nba-3", league: "NBA",
    homeTeam: "Phoenix Suns", homeAbbr: "PHX", homeLogo: "🏀", homeScore: 112,
    awayTeam: "Denver Nuggets", awayAbbr: "DEN", awayLogo: "🏀", awayScore: 108,
    status: "final", startTime: ago(3),
    broadcaster: "NBA TV", streamingService: "hulu",
  },
  // ── NFL ──
  {
    id: "nfl-1", league: "NFL",
    homeTeam: "Kansas City Chiefs", homeAbbr: "KC", homeLogo: "🏈", homeScore: 21,
    awayTeam: "San Francisco 49ers", awayAbbr: "SF", awayLogo: "🏈", awayScore: 17,
    status: "live", startTime: ago(2), period: "3rd", clock: "8:15",
    broadcaster: "FOX", streamingService: "hulu",
  },
  {
    id: "nfl-2", league: "NFL",
    homeTeam: "Dallas Cowboys", homeAbbr: "DAL", homeLogo: "🏈", homeScore: null,
    awayTeam: "Philadelphia Eagles", awayAbbr: "PHI", awayLogo: "🏈", awayScore: null,
    status: "scheduled", startTime: later(5),
    broadcaster: "CBS", streamingService: "paramount",
  },
  // ── MLB ──
  {
    id: "mlb-1", league: "MLB",
    homeTeam: "New York Yankees", homeAbbr: "NYY", homeLogo: "⚾", homeScore: 3,
    awayTeam: "Los Angeles Dodgers", awayAbbr: "LAD", awayLogo: "⚾", awayScore: 5,
    status: "final", startTime: ago(4),
    broadcaster: "Apple TV+", streamingService: "appletv",
  },
  {
    id: "mlb-2", league: "MLB",
    homeTeam: "Houston Astros", homeAbbr: "HOU", homeLogo: "⚾", homeScore: null,
    awayTeam: "Atlanta Braves", awayAbbr: "ATL", awayLogo: "⚾", awayScore: null,
    status: "scheduled", startTime: later(2),
    broadcaster: "ESPN+", streamingService: "disney",
  },
  // ── NHL ──
  {
    id: "nhl-1", league: "NHL",
    homeTeam: "Edmonton Oilers", homeAbbr: "EDM", homeLogo: "🏒", homeScore: 3,
    awayTeam: "Florida Panthers", awayAbbr: "FLA", awayLogo: "🏒", awayScore: 2,
    status: "live", startTime: ago(1), period: "2nd", clock: "12:44",
    broadcaster: "ESPN", streamingService: "hulu",
  },
  {
    id: "nhl-2", league: "NHL",
    homeTeam: "New York Rangers", homeAbbr: "NYR", homeLogo: "🏒", homeScore: null,
    awayTeam: "Toronto Maple Leafs", awayAbbr: "TOR", awayLogo: "🏒", awayScore: null,
    status: "scheduled", startTime: later(4),
    broadcaster: "TNT", streamingService: "hbomax",
  },
  // ── NCAAF ──
  {
    id: "ncaaf-1", league: "NCAAF",
    homeTeam: "Alabama Crimson Tide", homeAbbr: "ALA", homeLogo: "🏈", homeScore: 28,
    awayTeam: "Georgia Bulldogs", awayAbbr: "UGA", awayLogo: "🏈", awayScore: 24,
    status: "final", startTime: ago(5),
    broadcaster: "ABC", streamingService: "hulu",
  },
  {
    id: "ncaaf-2", league: "NCAAF",
    homeTeam: "Ohio State Buckeyes", homeAbbr: "OSU", homeLogo: "🏈", homeScore: null,
    awayTeam: "Michigan Wolverines", awayAbbr: "MICH", awayLogo: "🏈", awayScore: null,
    status: "scheduled", startTime: later(6),
    broadcaster: "FOX", streamingService: "hulu",
  },
  // ── WNBA ──
  {
    id: "wnba-1", league: "WNBA",
    homeTeam: "Las Vegas Aces", homeAbbr: "LVA", homeLogo: "🏀", homeScore: 68,
    awayTeam: "New York Liberty", awayAbbr: "NYL", awayLogo: "🏀", awayScore: 72,
    status: "live", startTime: ago(1), period: "3rd", clock: "6:10",
    broadcaster: "CBS", streamingService: "paramount",
  },
  // ── NCAAM ──
  {
    id: "ncaam-1", league: "NCAAM",
    homeTeam: "Duke Blue Devils", homeAbbr: "DUKE", homeLogo: "🏀", homeScore: 74,
    awayTeam: "UNC Tar Heels", awayAbbr: "UNC", awayLogo: "🏀", awayScore: 71,
    status: "final", startTime: ago(3),
    broadcaster: "ESPN", streamingService: "hulu",
  },
  {
    id: "ncaam-2", league: "NCAAM",
    homeTeam: "Kansas Jayhawks", homeAbbr: "KU", homeLogo: "🏀", homeScore: null,
    awayTeam: "Kentucky Wildcats", awayAbbr: "UK", awayLogo: "🏀", awayScore: null,
    status: "scheduled", startTime: later(4.5),
    broadcaster: "CBS", streamingService: "paramount",
  },
  // ── NCAAW ──
  {
    id: "ncaaw-1", league: "NCAAW",
    homeTeam: "South Carolina Gamecocks", homeAbbr: "SC", homeLogo: "🏀", homeScore: null,
    awayTeam: "Iowa Hawkeyes", awayAbbr: "IOWA", awayLogo: "🏀", awayScore: null,
    status: "scheduled", startTime: later(2.5),
    broadcaster: "ESPN2", streamingService: "hulu",
  },
  // ── F1 ──
  {
    id: "f1-1", league: "F1",
    homeTeam: "Max Verstappen", homeAbbr: "VER", homeLogo: "🏎️", homeScore: null,
    awayTeam: "Lewis Hamilton", awayAbbr: "HAM", awayLogo: "🏎️", awayScore: null,
    status: "live", startTime: ago(0.5), period: "Lap 42/57", clock: "",
    broadcaster: "ESPN", streamingService: "hulu",
    isEvent: true, eventName: "Monaco Grand Prix", eventRound: "Race", position: "P1: VER",
  },
  {
    id: "f1-2", league: "F1",
    homeTeam: "Lando Norris", homeAbbr: "NOR", homeLogo: "🏎️", homeScore: null,
    awayTeam: "Charles Leclerc", awayAbbr: "LEC", awayLogo: "🏎️", awayScore: null,
    status: "scheduled", startTime: later(24),
    broadcaster: "ESPN", streamingService: "hulu",
    isEvent: true, eventName: "Canadian Grand Prix", eventRound: "Qualifying",
  },
  // ── NASCAR ──
  {
    id: "nascar-1", league: "NASCAR",
    homeTeam: "Kyle Larson", homeAbbr: "LAR", homeLogo: "🏁", homeScore: null,
    awayTeam: "Denny Hamlin", awayAbbr: "HAM", awayLogo: "🏁", awayScore: null,
    status: "scheduled", startTime: later(7),
    broadcaster: "NBC", streamingService: "peacock",
    isEvent: true, eventName: "Daytona 500", eventRound: "Race",
  },
  {
    id: "nascar-2", league: "NASCAR",
    homeTeam: "Chase Elliott", homeAbbr: "ELL", homeLogo: "🏁", homeScore: null,
    awayTeam: "William Byron", awayAbbr: "BYR", awayLogo: "🏁", awayScore: null,
    status: "final", startTime: ago(6),
    broadcaster: "FOX", streamingService: "hulu",
    isEvent: true, eventName: "Coca-Cola 600", eventRound: "Race", position: "Winner: ELL",
  },
  // ── Golf ──
  {
    id: "golf-1", league: "Golf",
    homeTeam: "Scottie Scheffler", homeAbbr: "SCH", homeLogo: "⛳", homeScore: null,
    awayTeam: "Rory McIlroy", awayAbbr: "McI", awayLogo: "⛳", awayScore: null,
    status: "live", startTime: ago(3), period: "Round 3", clock: "Hole 14",
    broadcaster: "CBS", streamingService: "paramount",
    isEvent: true, eventName: "The Masters", eventRound: "Round 3", position: "Leader: SCH (-12)",
  },
  {
    id: "golf-2", league: "Golf",
    homeTeam: "Jon Rahm", homeAbbr: "RAH", homeLogo: "⛳", homeScore: null,
    awayTeam: "Xander Schauffele", awayAbbr: "XAN", awayLogo: "⛳", awayScore: null,
    status: "scheduled", startTime: later(20),
    broadcaster: "NBC", streamingService: "peacock",
    isEvent: true, eventName: "U.S. Open", eventRound: "Round 1",
  },
];
