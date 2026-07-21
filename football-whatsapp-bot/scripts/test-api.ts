import fs from 'fs';
import path from 'path';
import { Fixture, FixtureWithScorers, getFixturesForDate, getFinishedFixturesWithScorers } from '../lib/football';
import {
  formatScheduleMessage,
  formatResultsMessage,
  formatScheduleTemplateVars,
  formatResultsTemplateVars,
  toPersianDigits,
} from '../lib/format';

// Manual .env loader for local testing without external libraries
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  console.log('Loading configuration from .env file...');
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const firstEq = trimmed.indexOf('=');
    if (firstEq === -1) return;
    const key = trimmed.substring(0, firstEq).trim();
    const val = trimmed.substring(firstEq + 1).trim();
    if (key) {
      process.env[key] = val;
    }
  });
}

// -----------------------------------------------------------------------------
// Mock Data for World Cup 2026 Formatting Verification
// -----------------------------------------------------------------------------
const mockDate = '2026-06-15';

const mockFixtures: Fixture[] = [
  {
    id: 9001,
    date: '2026-06-15T18:00:00Z',
    status: { long: 'Not Started', short: 'NS', elapsed: null },
    round: 'Group Stage - Group A',
    venue: 'MetLife Stadium, East Rutherford',
    teams: {
      home: { id: 10, name: 'USA' },
      away: { id: 11, name: 'Morocco' },
    },
    goals: { home: null, away: null },
  },
  {
    id: 9002,
    date: '2026-06-15T21:00:00Z',
    status: { long: 'Not Started', short: 'NS', elapsed: null },
    round: 'Group Stage - Group B',
    venue: 'SoFi Stadium, Los Angeles',
    teams: {
      home: { id: 12, name: 'Argentina' },
      away: { id: 13, name: 'Canada' },
    },
    goals: { home: null, away: null },
  },
];

const mockFinishedFixtures: FixtureWithScorers[] = [
  {
    id: 9001,
    date: '2026-06-15T18:00:00Z',
    status: { long: 'Match Finished', short: 'FT', elapsed: 90 },
    round: 'Group Stage - Group A',
    venue: 'MetLife Stadium, East Rutherford',
    teams: {
      home: { id: 10, name: 'USA' },
      away: { id: 11, name: 'Morocco' },
    },
    goals: { home: 2, away: 1 },
    goalsEvents: [
      { scorer: 'Christian Pulisic', minute: 28, extraMinute: null, isOwnGoal: false, isPenalty: false, teamId: 10 },
      { scorer: 'Youssef En-Nesyri', minute: 42, extraMinute: null, isOwnGoal: false, isPenalty: false, teamId: 11 },
      { scorer: 'Folarin Balogun', minute: 78, extraMinute: null, isOwnGoal: false, isPenalty: true, teamId: 10 },
    ],
  },
  {
    id: 9002,
    date: '2026-06-15T21:00:00Z',
    status: { long: 'Match Finished', short: 'FT', elapsed: 90 },
    round: 'Group Stage - Group B',
    venue: 'SoFi Stadium, Los Angeles',
    teams: {
      home: { id: 12, name: 'Argentina' },
      away: { id: 13, name: 'Canada' },
    },
    goals: { home: 3, away: 0 },
    goalsEvents: [
      { scorer: 'Lionel Messi', minute: 15, extraMinute: null, isOwnGoal: false, isPenalty: false, teamId: 12 },
      { scorer: 'Julián Álvarez', minute: 45, extraMinute: 2, isOwnGoal: false, isPenalty: false, teamId: 12 },
      { scorer: 'Alphonso Davies', minute: 88, extraMinute: null, isOwnGoal: true, isPenalty: false, teamId: 12 }, // OG scored for Argentina
    ],
  },
];

async function runTests() {
  console.log('\n=== TEST 1: Schedule Formatting (Freeform) ===\n');
  const scheduleMsg = formatScheduleMessage(mockFixtures, mockDate);
  console.log(scheduleMsg);

  console.log('\n=== TEST 2: Results Formatting (Freeform) ===\n');
  const resultsMsg = formatResultsMessage(mockFinishedFixtures, mockDate);
  console.log(resultsMsg);

  console.log('\n=== TEST 3: Schedule Template Variables ===\n');
  const scheduleTemplate = formatScheduleTemplateVars(mockFixtures, mockDate);
  console.log('Var 1 (Header):', scheduleTemplate[0]);
  console.log('Var 2 (Matches):\n', scheduleTemplate[1]);

  console.log('\n=== TEST 4: Results Template Variables ===\n');
  const resultsTemplate = formatResultsTemplateVars(mockFinishedFixtures, mockDate);
  console.log('Var 1 (Header):', resultsTemplate[0]);
  console.log('Var 2 (Results):\n', resultsTemplate[1]);

  // Try real API-Football integration if configured
  if (process.env.FOOTBALL_API_KEY && process.env.FOOTBALL_API_KEY !== 'your_football_api_key') {
    console.log('\n=== TEST 5: Real API-Football Integration ===\n');
    console.log('Fetching live/scheduled fixtures for today from API-Football...');
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const realFixtures = await getFixturesForDate(todayStr);
      console.log(`Successfully fetched ${realFixtures.length} real fixtures for today (${todayStr})`);
      if (realFixtures.length > 0) {
        console.log('Sample Match:', JSON.stringify(realFixtures[0], null, 2));
      } else {
        console.log('No matches are scheduled for today in the target league.');
      }
    } catch (e: any) {
      console.error('API-Football test failed:', e.message || e);
    }
  } else {
    console.log('\n=== TEST 5: Real API-Football Integration (SKIPPED) ===\n');
    console.log('To run real API calls, configure FOOTBALL_API_KEY in a .env file.');
  }

  console.log('\n=== All Tests Completed ===\n');
}

runTests().catch((err) => {
  console.error('Test run failed:', err);
  process.exit(1);
});
