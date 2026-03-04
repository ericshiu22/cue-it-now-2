import type { GameData, League } from "./mock-sports-data";
import { ALL_SPORTS_TEAMS, type TeamOption } from "./all-sports-teams";
import { SEASON_DATA } from "./mock-sports-data";

const BROADCASTERS: Record<string, string[]> = {
  NFL: ["ESPN", "FOX", "CBS", "NBC", "Amazon Prime"],
  NBA: ["ESPN", "TNT", "NBA TV", "ABC"],
  MLB: ["ESPN", "FOX", "Apple TV+", "TBS"],
  NHL: ["ESPN", "TNT", "NHL Network"],
  MLS: ["Apple TV+", "FOX", "FS1"],
  EPL: ["NBC", "Peacock", "USA Network"],
  "La Liga": ["ESPN+", "ESPN"],
  "Liga MX": ["Telemundo", "Univision", "FOX Deportes"],
  UCL: ["CBS", "Paramount+"],
  WNBA: ["ESPN", "CBS", "ABC", "ION"],
  NCAAF: ["ESPN", "FOX", "ABC", "CBS"],
  NCAAM: ["ESPN", "CBS", "FOX", "TBS"],
  NCAAW: ["ESPN", "ESPN2", "ABC"],
};

const STREAMING: Record<string, string[]> = {
  NFL: ["hulu", "peacock", "prime video"],
  NBA: ["hulu", "hbomax"],
  MLB: ["appletv", "hulu", "disney"],
  NHL: ["hulu", "hbomax"],
  MLS: ["appletv"],
  EPL: ["peacock"],
  "La Liga": ["hulu"],
  "Liga MX": ["peacock"],
  UCL: ["paramount"],
  WNBA: ["paramount", "hulu"],
  NCAAF: ["hulu"],
  NCAAM: ["paramount", "hulu"],
  NCAAW: ["hulu"],
};

/** Deterministic pseudo-random from a seed string */
function seededRandom(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(31, h) + seed.charCodeAt(i) | 0;
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
    h = Math.imul(h ^ (h >>> 13), 0x45d9f3b);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

/** Generate a 2-week mock schedule for a given team */
export function generateTeamSchedule(team: TeamOption): GameData[] {
  const league = team.league as League;
  const leagueTeams = ALL_SPORTS_TEAMS.filter(
    (t) => t.league === league && t.abbr !== team.abbr
  );
  if (leagueTeams.length === 0) return [];

  const rand = seededRandom(team.abbr + team.league);
  const now = new Date();
  const games: GameData[] = [];

  // Generate 5-8 games over the next 14 days
  const gameCount = Math.floor(rand() * 4) + 5;
  const broadcasters = BROADCASTERS[league] || ["ESPN"];
  const streamingOptions = STREAMING[league] || ["hulu"];

  // Spread games across 14 days
  const slots: number[] = [];
  for (let i = 0; i < gameCount; i++) {
    slots.push(Math.floor(rand() * 14));
  }
  slots.sort((a, b) => a - b);

  // Deduplicate days (max 1 game per day)
  const uniqueDays = [...new Set(slots)];

  for (let i = 0; i < uniqueDays.length; i++) {
    const dayOffset = uniqueDays[i];
    const opponent = leagueTeams[Math.floor(rand() * leagueTeams.length)];
    const isHome = rand() > 0.5;

    // Random time between 12pm and 10pm
    const hour = Math.floor(rand() * 10) + 12;
    const minute = rand() > 0.5 ? 30 : 0;

    const gameDate = new Date(now);
    gameDate.setDate(gameDate.getDate() + dayOffset);
    gameDate.setHours(hour, minute, 0, 0);

    const broadcaster = broadcasters[Math.floor(rand() * broadcasters.length)];
    const streaming = streamingOptions[Math.floor(rand() * streamingOptions.length)];

    games.push({
      id: `sched-${team.abbr}-${i}`,
      league,
      homeTeam: isHome ? team.name : opponent.name,
      homeAbbr: isHome ? team.abbr : opponent.abbr,
      homeLogo: team.emoji,
      homeScore: null,
      awayTeam: isHome ? opponent.name : team.name,
      awayAbbr: isHome ? opponent.abbr : team.abbr,
      awayLogo: opponent.emoji,
      awayScore: null,
      status: "scheduled",
      startTime: gameDate.toISOString(),
      broadcaster,
      streamingService: streaming,
    });
  }

  return games;
}
