import type { GameData, League } from "./mock-sports-data";
import { ALL_SPORTS_TEAMS, type TeamOption } from "./all-sports-teams";
import { SEASON_DATA, MOCK_GAMES } from "./mock-sports-data";

/**
 * Convert an Eastern Time hour on a given date to a proper UTC ISO string.
 * Handles EST/EDT automatically via Intl.
 */
function etToUtc(date: Date, hour: number, minute = 0): string {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    timeZoneName: "shortOffset",
    hour12: false,
  });

  // Resolve ET offset for the target calendar day (handles DST transitions)
  const reference = new Date(Date.UTC(year, month, day, 12, 0, 0));
  const parts = formatter.formatToParts(reference);
  const tzPart = parts.find((p) => p.type === "timeZoneName")?.value ?? "GMT-5";
  const offsetMatch = tzPart.match(/GMT([+-]\d{1,2})(?::?(\d{2}))?/);

  const offsetHours = offsetMatch ? parseInt(offsetMatch[1], 10) : -5;
  const offsetMinutesOnly = offsetMatch?.[2] ? parseInt(offsetMatch[2], 10) : 0;
  const signedOffsetMinutes = offsetHours * 60 + (offsetHours >= 0 ? offsetMinutesOnly : -offsetMinutesOnly);

  // ET wall-clock => UTC by subtracting the ET offset from wall-clock time
  const etWallClockAsUtc = Date.UTC(year, month, day, hour, minute, 0);
  const utcMs = etWallClockAsUtc - signedOffsetMinutes * 60_000;
  return new Date(utcMs).toISOString();
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

const TEAM_EMOJI_BY_KEY = new Map(
  ALL_SPORTS_TEAMS.map((t) => [`${t.league}:${t.abbr}`, t.emoji])
);

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
  const season = SEASON_DATA[league];
  const now = new Date();

  let seasonStartMs: number | null = null;
  let seasonEndMs: number | null = null;

  if (season) {
    const seasonStart = new Date(season.startDate);
    const seasonEnd = new Date(season.endDate);
    seasonEnd.setHours(23, 59, 59, 999);

    seasonStartMs = seasonStart.getTime();
    seasonEndMs = seasonEnd.getTime();

    const nowMs = now.getTime();
    if (nowMs < seasonStartMs || nowMs > seasonEndMs) {
      return []; // Season not active
    }
  }

  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const twoWeeksEndRaw = todayStart + 14 * 24 * 60 * 60 * 1000;
  const twoWeeksEnd = seasonEndMs ? Math.min(twoWeeksEndRaw, seasonEndMs + 1) : twoWeeksEndRaw;

  // 1) Pull real games from MOCK_GAMES that involve this team
  const realGames = MOCK_GAMES.filter((g) => {
    if (g.league !== league) return false;
    if (g.homeAbbr !== team.abbr && g.awayAbbr !== team.abbr) return false;

    const gameTime = new Date(g.startTime).getTime();
    if (gameTime < todayStart - 24 * 60 * 60 * 1000 || gameTime >= twoWeeksEnd) return false;
    if (seasonStartMs && gameTime < seasonStartMs) return false;
    if (seasonEndMs && gameTime > seasonEndMs) return false;

    return true;
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

  const rand = seededRandom(`${team.abbr}-${team.league}`);
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

  const uniqueDays = [...new Set(slots)]
    .sort((a, b) => a - b)
    .slice(0, Math.max(0, gameCount - realGames.length));

  for (let i = 0; i < uniqueDays.length; i++) {
    const dayOffset = uniqueDays[i];
    const opponent = leagueTeams[Math.floor(rand() * leagueTeams.length)];
    const isHome = rand() > 0.5;
    const hour = Math.floor(rand() * 10) + 12;
    const minute = rand() > 0.5 ? 30 : 0;

    const gameDate = new Date(now);
    gameDate.setDate(gameDate.getDate() + dayOffset);

    const gameDateMs = gameDate.getTime();
    if (seasonStartMs && gameDateMs < seasonStartMs) continue;
    if (seasonEndMs && gameDateMs > seasonEndMs) continue;

    const broadcaster = broadcasters[Math.floor(rand() * broadcasters.length)];
    const streaming = streamingOptions[Math.floor(rand() * streamingOptions.length)];
    const opponentEmoji = TEAM_EMOJI_BY_KEY.get(`${league}:${opponent.abbr}`) ?? opponent.emoji;

    generatedGames.push({
      id: `sched-${league}-${team.abbr}-${dayOffset}-${opponent.abbr}-${i}`,
      league,
      homeTeam: isHome ? team.name : opponent.name,
      homeAbbr: isHome ? team.abbr : opponent.abbr,
      homeLogo: isHome ? team.emoji : opponentEmoji,
      homeScore: null,
      awayTeam: isHome ? opponent.name : team.name,
      awayAbbr: isHome ? opponent.abbr : team.abbr,
      awayLogo: isHome ? opponentEmoji : team.emoji,
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
