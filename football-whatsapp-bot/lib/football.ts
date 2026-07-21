export interface Fixture {
  id: number;
  date: string; // ISO string
  status: {
    long: string;
    short: string;
    elapsed: number | null;
  };
  round: string; // e.g. "Group Stage - Group A", "Round of 16"
  venue: string;
  teams: {
    home: { id: number; name: string };
    away: { id: number; name: string };
  };
  goals: {
    home: number | null;
    away: number | null;
  };
}

export interface GoalEvent {
  scorer: string;
  minute: number;
  extraMinute: number | null;
  isOwnGoal: boolean;
  isPenalty: boolean;
  teamId: number;
}

export interface FixtureWithScorers extends Fixture {
  goalsEvents: GoalEvent[];
}

const API_URL = 'https://v3.football.api-sports.io';

/**
 * Generic helper to fetch from API-Football.
 */
async function apiFetch(endpoint: string) {
  const apiKey = process.env.FOOTBALL_API_KEY;
  if (!apiKey) {
    console.warn('Warning: FOOTBALL_API_KEY is not configured.');
    return { response: [] };
  }

  const url = `${API_URL}/${endpoint}`;
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-apisports-key': apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`API-Football request failed: ${response.statusText} (${response.status})`);
    }

    const data = await response.json();
    if (data.errors && Object.keys(data.errors).length > 0) {
      console.error('API-Football returned errors:', data.errors);
      throw new Error(`API-Football error: ${JSON.stringify(data.errors)}`);
    }

    return data;
  } catch (error) {
    console.error(`Error fetching from API-Football (${endpoint}):`, error);
    throw error;
  }
}

/**
 * Get all fixtures for World Cup 2026 on a specific date (YYYY-MM-DD)
 */
export async function getFixturesForDate(dateStr: string): Promise<Fixture[]> {
  const leagueId = process.env.WC_LEAGUE_ID || '1'; // Default to World Cup league ID (1)
  const season = process.env.WC_SEASON || '2026';

  const data = await apiFetch(`fixtures?league=${leagueId}&season=${season}&date=${dateStr}`);
  
  if (!data || !data.response) {
    return [];
  }

  return data.response.map((item: any) => ({
    id: item.fixture.id,
    date: item.fixture.date,
    status: {
      long: item.fixture.status.long,
      short: item.fixture.status.short,
      elapsed: item.fixture.status.elapsed,
    },
    round: item.league.round,
    venue: `${item.fixture.venue.name}, ${item.fixture.venue.city}`,
    teams: {
      home: { id: item.teams.home.id, name: item.teams.home.name },
      away: { id: item.teams.away.id, name: item.teams.away.name },
    },
    goals: {
      home: item.goals.home,
      away: item.goals.away,
    },
  }));
}

/**
 * Fetches goal events for a given fixture ID and parses them into a structured format.
 */
export async function getFixtureGoals(fixtureId: number): Promise<GoalEvent[]> {
  const data = await apiFetch(`fixtures/events?fixture=${fixtureId}&type=Goal`);

  if (!data || !data.response) {
    return [];
  }

  return data.response.map((event: any) => ({
    scorer: event.player.name || 'Unknown Player',
    minute: event.time.elapsed,
    extraMinute: event.time.extra,
    isOwnGoal: event.detail === 'Own Goal',
    isPenalty: event.detail === 'Penalty',
    teamId: event.team.id,
  }));
}

/**
 * Get finished fixtures for a date and fetch scorer events for each.
 */
export async function getFinishedFixturesWithScorers(dateStr: string): Promise<FixtureWithScorers[]> {
  const fixtures = await getFixturesForDate(dateStr);
  const finished = fixtures.filter(f => f.status.short === 'FT' || f.status.short === 'AET' || f.status.short === 'PEN');

  const result: FixtureWithScorers[] = [];

  for (const fixture of finished) {
    try {
      const goalsEvents = await getFixtureGoals(fixture.id);
      result.push({
        ...fixture,
        goalsEvents,
      });
    } catch (error) {
      console.error(`Error fetching goals for fixture ${fixture.id}:`, error);
      // fallback with empty events if event fetch fails
      result.push({
        ...fixture,
        goalsEvents: [],
      });
    }
  }

  return result;
}
