import type { GameData, League } from "./mock-sports-data";
import { ALL_SPORTS_TEAMS, type TeamOption } from "./all-sports-teams";
import { SEASON_DATA } from "./mock-sports-data";

/**
 * Convert an Eastern Time hour on a given date to a proper UTC ISO string.
 * Handles EST/EDT automatically via Intl.
 */
function etToUtc(date: Date, hour: number, minute = 0): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const h = String(hour).padStart(2, '0');
  const m = String(minute).padStart(2, '0');
  const etString = `${date.getFullYear()}-${month}-${day}T${h}:${m}:00`;
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    timeZoneName: 'shortOffset',
  });
  const parts = formatter.formatToParts(date);
  const tzPart = parts.find(p => p.type === 'timeZoneName');
  const offsetMatch = tzPart?.value?.match(/GMT([+-]\d+)/);
  const offsetHours = offsetMatch ? parseInt(offsetMatch[1]) : -5;
  const utcDate = new Date(etString + "Z");
  utcDate.setHours(utcDate.getHours() - offsetHours);
  return utcDate.toISOString();
}

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

/** Generate a 2-week mock schedule for a given team (only if season is active) */
export function generateTeamSchedule(team: TeamOption): GameData[] {
  const league = team.league as League;

  // Check if the league's season is currently active
  const season = SEASON_DATA[league];
  if (season) {
    const now = new Date();
    const seasonStart = new Date(season.startDate);
    const seasonEnd = new Date(season.endDate);
    if (now < seasonStart || now > seasonEnd) {
      return []; // Season not active
    }
  }

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

  // Always include today (day 0), then spread remaining games across days 1-13
  const slots: number[] = [0];
  for (let i = 1; i < gameCount; i++) {
    slots.push(Math.floor(rand() * 13) + 1);
  }
  slots.sort((a, b) => a - b);

  // Deduplicate days (max 1 game per day)
  const uniqueDays = [...new Set(slots)];

  for (let i = 0; i < uniqueDays.length; i++) {
    const dayOffset = uniqueDays[i];
    const opponent = leagueTeams[Math.floor(rand() * leagueTeams.length)];
    const isHome = rand() > 0.5;

    // Random time between 12pm and 10pm ET
    const hour = Math.floor(rand() * 10) + 12;
    const minute = rand() > 0.5 ? 30 : 0;

    const gameDate = new Date(now);
    gameDate.setDate(gameDate.getDate() + dayOffset);

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
      startTime: etToUtc(gameDate, hour, minute),
      broadcaster,
      streamingService: streaming,
    });
  }

  return games;
}
