/**
 * Maps cities to their local sports teams (by team abbreviation used in mock data).
 * Also defines blackout rules: local games on regional sports networks (RSNs)
 * are blacked out on national streaming if you're in the local market.
 */

export interface LocalMarket {
  city: string;
  aliases: string[]; // alternate city names / suburbs
  teams: string[]; // team abbreviations from mock data
  blackoutBroadcasters: string[]; // regional networks that trigger blackout
}

export const LOCAL_MARKETS: LocalMarket[] = [
  // California
  {
    city: "Los Angeles",
    aliases: ["LA", "Long Beach", "Anaheim", "Pasadena", "Glendale", "Burbank", "Santa Monica", "Inglewood"],
    teams: ["LAL", "LAD", "LAC", "LAR", "LAG", "LAFC"],
    blackoutBroadcasters: ["SportsNet LA", "Spectrum SportsNet", "Bally Sports West"],
  },
  {
    city: "San Francisco",
    aliases: ["SF", "Oakland", "San Jose", "Berkeley", "Bay Area"],
    teams: ["GSW", "SF", "SFG", "OAK"],
    blackoutBroadcasters: ["NBC Sports Bay Area"],
  },
  // Texas
  {
    city: "Dallas",
    aliases: ["Fort Worth", "Arlington", "Plano", "Irving", "Frisco"],
    teams: ["DAL"],
    blackoutBroadcasters: ["Bally Sports Southwest"],
  },
  {
    city: "Houston",
    aliases: ["Sugar Land", "The Woodlands", "Katy"],
    teams: ["HOU"],
    blackoutBroadcasters: ["AT&T SportsNet Southwest", "Space City Home Network"],
  },
  // Northeast
  {
    city: "New York",
    aliases: ["NYC", "Brooklyn", "Queens", "Bronx", "Manhattan", "Staten Island", "Jersey City"],
    teams: ["NYY", "NYR", "NYL", "NYK", "NYM", "NYG", "NYJ"],
    blackoutBroadcasters: ["YES Network", "MSG", "SNY"],
  },
  {
    city: "Boston",
    aliases: ["Cambridge", "Somerville", "Brookline"],
    teams: ["BOS"],
    blackoutBroadcasters: ["NESN"],
  },
  {
    city: "Philadelphia",
    aliases: ["Philly"],
    teams: ["PHI"],
    blackoutBroadcasters: ["NBC Sports Philadelphia"],
  },
  // Midwest
  {
    city: "Chicago",
    aliases: ["Evanston", "Naperville"],
    teams: ["CHI"],
    blackoutBroadcasters: ["NBC Sports Chicago", "Marquee Sports Network"],
  },
  {
    city: "Milwaukee",
    aliases: ["Waukesha"],
    teams: ["MIL"],
    blackoutBroadcasters: ["Bally Sports Wisconsin"],
  },
  // Mountain / West
  {
    city: "Denver",
    aliases: ["Aurora", "Lakewood", "Boulder"],
    teams: ["DEN"],
    blackoutBroadcasters: ["Altitude Sports"],
  },
  {
    city: "Phoenix",
    aliases: ["Scottsdale", "Tempe", "Mesa", "Chandler", "Glendale"],
    teams: ["PHX", "ARI"],
    blackoutBroadcasters: ["Bally Sports Arizona"],
  },
  // South
  {
    city: "Atlanta",
    aliases: ["Marietta", "Decatur"],
    teams: ["ATL"],
    blackoutBroadcasters: ["Bally Sports South"],
  },
  {
    city: "Miami",
    aliases: ["Fort Lauderdale", "Hialeah", "Hollywood"],
    teams: ["MIA", "FLA"],
    blackoutBroadcasters: ["Bally Sports Sun"],
  },
  // Canada
  {
    city: "Toronto",
    aliases: ["Mississauga", "Brampton"],
    teams: ["TOR"],
    blackoutBroadcasters: ["Sportsnet", "TSN"],
  },
  {
    city: "Edmonton",
    aliases: ["St. Albert"],
    teams: ["EDM"],
    blackoutBroadcasters: ["Sportsnet"],
  },
  // Florida
  {
    city: "Kansas City",
    aliases: ["Overland Park", "Independence"],
    teams: ["KC"],
    blackoutBroadcasters: ["Bally Sports Kansas City"],
  },
  {
    city: "Las Vegas",
    aliases: ["Henderson", "North Las Vegas"],
    teams: ["LVA", "LVR", "VGK"],
    blackoutBroadcasters: ["AT&T SportsNet Rocky Mountain"],
  },
  // College towns
  {
    city: "Columbus",
    aliases: ["Dublin"],
    teams: ["OSU"],
    blackoutBroadcasters: ["Big Ten Network"],
  },
  {
    city: "Ann Arbor",
    aliases: ["Ypsilanti"],
    teams: ["MICH"],
    blackoutBroadcasters: ["Big Ten Network"],
  },
  {
    city: "Durham",
    aliases: ["Chapel Hill", "Raleigh"],
    teams: ["DUKE", "UNC"],
    blackoutBroadcasters: ["ACC Network"],
  },
  {
    city: "Tuscaloosa",
    aliases: ["Birmingham"],
    teams: ["ALA"],
    blackoutBroadcasters: ["SEC Network"],
  },
  {
    city: "Athens",
    aliases: [],
    teams: ["UGA"],
    blackoutBroadcasters: ["SEC Network"],
  },
  {
    city: "Columbia",
    aliases: [],
    teams: ["SC"],
    blackoutBroadcasters: ["SEC Network"],
  },
  {
    city: "Iowa City",
    aliases: ["Cedar Rapids"],
    teams: ["IOWA"],
    blackoutBroadcasters: ["Big Ten Network"],
  },
  {
    city: "Lawrence",
    aliases: [],
    teams: ["KU"],
    blackoutBroadcasters: ["Big 12 Network", "ESPN+"],
  },
  {
    city: "Lexington",
    aliases: [],
    teams: ["UK"],
    blackoutBroadcasters: ["SEC Network"],
  },
];

/**
 * Find the user's local market based on their city.
 */
export function findLocalMarket(city: string | null): LocalMarket | null {
  if (!city) return null;
  const normalized = city.toLowerCase().trim();
  return LOCAL_MARKETS.find(
    (m) =>
      m.city.toLowerCase() === normalized ||
      m.aliases.some((a) => a.toLowerCase() === normalized)
  ) || null;
}

/**
 * Check if a game involves a local team.
 */
export function isLocalGame(
  homeAbbr: string,
  awayAbbr: string,
  localTeams: string[]
): boolean {
  return localTeams.includes(homeAbbr) || localTeams.includes(awayAbbr);
}

/**
 * Check if a game is subject to local blackout restrictions.
 * Games on regional sports networks are typically blacked out on streaming
 * in the local market when they air on the RSN.
 */
export function isBlackedOut(
  broadcaster: string,
  status: string,
  localMarket: LocalMarket | null,
  isLocal: boolean
): boolean {
  if (!localMarket || !isLocal) return false;
  if (status === "final") return false;
  // National broadcasts (ESPN, FOX, CBS, NBC, ABC, TNT) are NOT blacked out
  const nationalNetworks = ["ESPN", "ESPN2", "FOX", "CBS", "NBC", "ABC", "TNT", "NBA TV", "NFL Network", "MLB Network", "NHL Network"];
  if (nationalNetworks.includes(broadcaster)) return false;
  // Regional broadcasts in your market = blackout on streaming
  return localMarket.blackoutBroadcasters.some(
    (b) => broadcaster.toLowerCase().includes(b.toLowerCase())
  );
}
