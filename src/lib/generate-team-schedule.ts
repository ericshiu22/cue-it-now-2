import type { GameData, League } from "./mock-sports-data";
import { ALL_SPORTS_TEAMS, type TeamOption } from "./all-sports-teams";
import { SEASON_DATA, MOCK_GAMES } from "./mock-sports-data";

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

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const twoWeeksEnd = todayStart + 14 * 24 * 60 * 60 * 1000;

  // 1) Pull real games from MOCK_GAMES that involve this team
  const realGames = MOCK_GAMES.filter((g) => {
    if (g.league !== league) return false;
    if (g.homeAbbr !== team.abbr && g.awayAbbr !== team.abbr) return false;
    const gameTime = new Date(g.startTime).getTime();
    return gameTime >= todayStart - 24 * 60 * 60 * 1000 && gameTime < twoWeeksEnd;
  });

  // Track which day offsets are already covered by real games
  const coveredDays = new Set<number>();
  for (const g of realGames) {
    const gameDate = new Date(g.startTime);
    const dayOffset = Math.floor((gameDate.getTime() - todayStart) / (24 * 60 * 60 * 1000));
    coveredDays.add(dayOffset);
  }

  // 2) Fill remaining days with generated games
  const leagueTeams = ALL_SPORTS_TEAMS.filter(
    (t) => t.league === league && t.abbr !== team.abbr
  );
  if (leagueTeams.length === 0) return realGames;

  const rand = seededRandom(team.abbr + team.league);
  const broadcasters = BROADCASTERS[league] || ["ESPN"];
  const streamingOptions = STREAMING[league] || ["hulu"];

  const gameCount = Math.floor(rand() * 4) + 5;
  const generatedGames: GameData[] = [];

  // Generate day slots, skipping days that have real games
  const slots: number[] = [];
  for (let i = 0; i < gameCount + 5; i++) {
    const day = i === 0 ? 1 : Math.floor(rand() * 13) + 1; // start from day 1+
    if (!coveredDays.has(day)) {
      slots.push(day);
    }
    // consume the random values regardless to keep determinism
    rand(); rand(); rand(); rand();
  }
  const uniqueDays = [...new Set(slots)].sort((a, b) => a - b).slice(0, Math.max(0, gameCount - realGames.length));

  for (let i = 0; i < uniqueDays.length; i++) {
    const dayOffset = uniqueDays[i];
    const opponent = leagueTeams[Math.floor(rand() * leagueTeams.length)];
    const isHome = rand() > 0.5;
    const hour = Math.floor(rand() * 10) + 12;
    const minute = rand() > 0.5 ? 30 : 0;

    const gameDate = new Date(now);
    gameDate.setDate(gameDate.getDate() + dayOffset);

    const broadcaster = broadcasters[Math.floor(rand() * broadcasters.length)];
    const streaming = streamingOptions[Math.floor(rand() * streamingOptions.length)];

    generatedGames.push({
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

  // Combine and sort by start time
  return [...realGames, ...generatedGames].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );
}
