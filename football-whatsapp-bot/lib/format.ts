import { Fixture, FixtureWithScorers, GoalEvent } from './football';

// Team name translation dictionary (top World Cup teams & hosts)
const teamTranslations: Record<string, string> = {
  'USA': 'آمریکا',
  'Mexico': 'مکزیک',
  'Canada': 'کانادا',
  'Iran': 'ایران',
  'Argentina': 'آرژانتین',
  'Brazil': 'برزیل',
  'France': 'فرانسه',
  'England': 'انگلستان',
  'Germany': 'آلمان',
  'Spain': 'اسپانیا',
  'Portugal': 'پرتغال',
  'Italy': 'ایتالیا',
  'Netherlands': 'هلند',
  'Belgium': 'بلژیک',
  'Croatia': 'کرواسی',
  'Morocco': 'مراکش',
  'Japan': 'ژاپن',
  'South Korea': 'کره جنوبی',
  'Saudi Arabia': 'عربستان سعودی',
  'Senegal': 'سنگال',
  'Uruguay': 'اروگوئه',
  'Switzerland': 'سوئیس',
  'Denmark': 'دانمارک',
  'Australia': 'استرالیا',
  'Ecuador': 'اکوادور',
  'Qatar': 'قطر',
  'Poland': 'لهستان',
  'Wales': 'ولز',
  'Tunisia': 'تونس',
  'Cameroon': 'کامرون',
  'Ghana': 'غنا',
  'Costa Rica': 'کاستاریکا',
  'Ukraine': 'اوکراین',
  'Scotland': 'اسکاتلند',
  'Sweden': 'سوئد',
  'Peru': 'پرو',
  'Colombia': 'کلمبیا',
  'Chile': 'شیلی',
  'Turkey': 'ترکیه',
  'Egypt': 'مصر',
  'Algeria': 'الجزایر',
  'Nigeria': 'نیجریه',
};

// Round / Stage translations
const roundTranslations: Record<string, string> = {
  'Group Stage': 'مرحله گروهی',
  'Round of 16': 'یک‌هشتم نهایی',
  'Quarter-finals': 'یک‌چهارم نهایی',
  'Semi-finals': 'نیمه‌نهایی',
  'Match for 3rd Place': 'رده‌بندی',
  'Final': 'فینال',
  'Group A': 'گروه A',
  'Group B': 'گروه B',
  'Group C': 'گروه C',
  'Group D': 'گروه D',
  'Group E': 'گروه E',
  'Group F': 'گروه F',
  'Group G': 'گروه G',
  'Group H': 'گروه H',
  'Group I': 'گروه I',
  'Group J': 'گروه J',
  'Group K': 'گروه K',
  'Group L': 'گروه L',
};

// English and Persian month names
const monthsFA = ['ژانویه', 'فوریه', 'مارس', 'آوریل', 'مه', 'ژوئن', 'ژوئیه', 'اوت', 'سپتامبر', 'اکتبر', 'نوامبر', 'دسامبر'];
const monthsEN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/**
 * Converts English digits (0-9) to Persian digits (۰-۹).
 */
export function toPersianDigits(str: string | number): string {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return String(str).replace(/[0-9]/g, (w) => persianDigits[parseInt(w)]);
}

/**
 * Translates a team name to Persian. Falls back to original English name if not found.
 */
export function translateTeam(name: string): string {
  return teamTranslations[name] || name;
}

/**
 * Translates the match round to Persian.
 */
export function translateRound(round: string): string {
  let translated = round;
  for (const [en, fa] of Object.entries(roundTranslations)) {
    translated = translated.replace(en, fa);
  }
  return translated;
}

/**
 * Formats a Date object into a readable date string in Persian and English.
 */
export function formatDateStrings(dateStr: string): { fa: string; en: string } {
  const date = new Date(dateStr + 'T00:00:00'); // Ensure local date creation
  if (isNaN(date.getTime())) {
    const today = new Date();
    return {
      fa: `${toPersianDigits(today.getDate())} ${monthsFA[today.getMonth()]} ${toPersianDigits(today.getFullYear())}`,
      en: `${today.getDate()} ${monthsEN[today.getMonth()]} ${today.getFullYear()}`,
    };
  }

  const day = date.getDate();
  const monthIdx = date.getMonth();
  const year = date.getFullYear();

  return {
    fa: `${toPersianDigits(day)} ${monthsFA[monthIdx]} ${toPersianDigits(year)}`,
    en: `${day} ${monthsEN[monthIdx]} ${year}`,
  };
}

/**
 * Extracts and formats the kickoff time in the configured timezone.
 */
export function formatKickoffTime(isoDate: string): string {
  const date = new Date(isoDate);
  const timezone = process.env.TIMEZONE || 'America/New_York';
  
  try {
    const options: Intl.DateTimeFormatOptions = {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    };
    return new Intl.DateTimeFormat('en-US', options).format(date);
  } catch (e) {
    // Fallback to UTC slice if timezone is invalid
    return isoDate.substring(11, 16);
  }
}

/**
 * Formats the match list schedule.
 */
export function formatScheduleMessage(fixtures: Fixture[], dateStr: string): string {
  const { fa: dateFA, en: dateEN } = formatDateStrings(dateStr);

  // --- Persian Block ---
  let faBlock = `📅 برنامه بازی‌های امروز (${dateFA}):\n\n`;
  if (fixtures.length === 0) {
    faBlock += '⚽ امروز هیچ مسابقه‌ای برنامه‌ریزی نشده است.\n';
  } else {
    fixtures.forEach((match) => {
      const homeFA = translateTeam(match.teams.home.name);
      const awayFA = translateTeam(match.teams.away.name);
      const timeFA = toPersianDigits(formatKickoffTime(match.date));
      const roundFA = translateRound(match.round);

      faBlock += `⚽ ${homeFA} - ${awayFA}\n`;
      faBlock += `⏰ ساعت ${timeFA} | ${roundFA}\n`;
      if (match.venue) {
        faBlock += `🏟️ ${match.venue}\n`;
      }
      faBlock += '\n';
    });
  }

  // --- English Block ---
  let enBlock = `📅 Today's Match Schedule (${dateEN}):\n\n`;
  if (fixtures.length === 0) {
    enBlock += '⚽ There are no matches scheduled for today.\n';
  } else {
    fixtures.forEach((match) => {
      const timeEN = formatKickoffTime(match.date);
      enBlock += `⚽ ${match.teams.home.name} vs ${match.teams.away.name}\n`;
      enBlock += `⏰ ${timeEN} | ${match.round}\n`;
      if (match.venue) {
        enBlock += `🏟️ ${match.venue}\n`;
      }
      enBlock += '\n';
    });
  }

  return `${faBlock.trim()}\n\n----------------------------------------\n\n${enBlock.trim()}`;
}

/**
 * Helper to build lists of goal scorers for a team.
 */
function formatGoalsList(goals: GoalEvent[], teamId: number, lang: 'fa' | 'en'): string {
  const teamGoals = goals.filter(g => g.teamId === teamId);
  if (teamGoals.length === 0) return lang === 'fa' ? 'بدون گل' : 'No goals';

  return teamGoals
    .map((g) => {
      const min = lang === 'fa' ? toPersianDigits(g.minute) : String(g.minute);
      const extra = g.extraMinute 
        ? (lang === 'fa' ? `+${toPersianDigits(g.extraMinute)}` : `+${g.extraMinute}`) 
        : '';
      
      let suffix = '';
      if (g.isOwnGoal) suffix = lang === 'fa' ? ' (گل‌به‌خودی)' : ' (OG)';
      if (g.isPenalty) suffix = lang === 'fa' ? ' (پنالتی)' : ' (P)';

      return `${g.scorer} '${min}${extra}${suffix}`;
    })
    .join(lang === 'fa' ? '، ' : ', ');
}

/**
 * Formats the match results with score and scorers.
 */
export function formatResultsMessage(fixtures: FixtureWithScorers[], dateStr: string): string {
  const { fa: dateFA, en: dateEN } = formatDateStrings(dateStr);

  // --- Persian Block ---
  let faBlock = `🏆 نتایج بازی‌های امروز (${dateFA}):\n\n`;
  if (fixtures.length === 0) {
    faBlock += '🏁 بازی‌های امروز هنوز به پایان نرسیده‌اند یا مسابقه‌ای برگزار نشده است.\n';
  } else {
    fixtures.forEach((match) => {
      const homeFA = translateTeam(match.teams.home.name);
      const awayFA = translateTeam(match.teams.away.name);
      
      const homeGoals = match.goals.home !== null ? toPersianDigits(match.goals.home) : '۰';
      const awayGoals = match.goals.away !== null ? toPersianDigits(match.goals.away) : '۰';
      
      faBlock += `🏁 ${homeFA} ${homeGoals} - ${awayGoals} ${awayFA}\n`;

      if (match.goalsEvents.length > 0) {
        const homeScorers = formatGoalsList(match.goalsEvents, match.teams.home.id, 'fa');
        const awayScorers = formatGoalsList(match.goalsEvents, match.teams.away.id, 'fa');
        
        faBlock += `⚽ گل‌ها:\n`;
        faBlock += `  - ${homeFA}: ${homeScorers}\n`;
        faBlock += `  - ${awayFA}: ${awayScorers}\n`;
      }
      faBlock += '\n';
    });
  }

  // --- English Block ---
  let enBlock = `🏆 Today's Match Results (${dateEN}):\n\n`;
  if (fixtures.length === 0) {
    enBlock += '🏁 Today\'s matches have not finished yet or no matches were held.\n';
  } else {
    fixtures.forEach((match) => {
      const homeGoals = match.goals.home !== null ? match.goals.home : 0;
      const awayGoals = match.goals.away !== null ? match.goals.away : 0;

      enBlock += `🏁 ${match.teams.home.name} ${homeGoals} - ${awayGoals} ${match.teams.away.name}\n`;

      if (match.goalsEvents.length > 0) {
        const homeScorers = formatGoalsList(match.goalsEvents, match.teams.home.id, 'en');
        const awayScorers = formatGoalsList(match.goalsEvents, match.teams.away.id, 'en');

        enBlock += `⚽ Goals:\n`;
        enBlock += `  - ${match.teams.home.name}: ${homeScorers}\n`;
        enBlock += `  - ${match.teams.away.name}: ${awayScorers}\n`;
      }
      enBlock += '\n';
    });
  }

  return `${faBlock.trim()}\n\n----------------------------------------\n\n${enBlock.trim()}`;
}

/**
 * Formats variables for the Twilio Schedule Template.
 * Returns [DateHeader, MatchList]
 */
export function formatScheduleTemplateVars(fixtures: Fixture[], dateStr: string): string[] {
  const { fa: dateFA, en: dateEN } = formatDateStrings(dateStr);
  const header = `${dateEN} / ${dateFA}`;

  if (fixtures.length === 0) {
    return [
      header,
      `No matches scheduled for today.\nامروز مسابقه‌ای برنامه‌ریزی نشده است.`
    ];
  }

  const matchList = fixtures.map((match) => {
    const homeFA = translateTeam(match.teams.home.name);
    const awayFA = translateTeam(match.teams.away.name);
    const timeEN = formatKickoffTime(match.date);
    const timeFA = toPersianDigits(timeEN);
    const roundFA = translateRound(match.round);

    let matchStr = `⚽ ${homeFA} (${match.teams.home.name}) - ${awayFA} (${match.teams.away.name})\n`;
    matchStr += `⏰ ${timeFA} (${timeEN}) | ${roundFA}`;
    if (match.venue) {
      matchStr += `\n🏟️ ${match.venue}`;
    }
    return matchStr;
  }).join('\n\n');

  return [header, matchList];
}

/**
 * Formats variables for the Twilio Results Template.
 * Returns [DateHeader, MatchResultsList]
 */
export function formatResultsTemplateVars(fixtures: FixtureWithScorers[], dateStr: string): string[] {
  const { fa: dateFA, en: dateEN } = formatDateStrings(dateStr);
  const header = `${dateEN} / ${dateFA}`;

  if (fixtures.length === 0) {
    return [
      header,
      `Today's matches have not finished yet or no matches were held.\nبازی‌های امروز هنوز به پایان نرسیده‌اند.`
    ];
  }

  const resultsList = fixtures.map((match) => {
    const homeFA = translateTeam(match.teams.home.name);
    const awayFA = translateTeam(match.teams.away.name);
    const homeGoals = match.goals.home !== null ? match.goals.home : 0;
    const awayGoals = match.goals.away !== null ? match.goals.away : 0;

    let matchStr = `🏁 ${homeFA} ${toPersianDigits(homeGoals)} - ${toPersianDigits(awayGoals)} ${awayFA}\n`;
    matchStr += `(${match.teams.home.name} ${homeGoals} - ${awayGoals} ${match.teams.away.name})`;

    if (match.goalsEvents.length > 0) {
      const homeScorersFA = formatGoalsList(match.goalsEvents, match.teams.home.id, 'fa');
      const awayScorersFA = formatGoalsList(match.goalsEvents, match.teams.away.id, 'fa');
      const homeScorersEN = formatGoalsList(match.goalsEvents, match.teams.home.id, 'en');
      const awayScorersEN = formatGoalsList(match.goalsEvents, match.teams.away.id, 'en');

      matchStr += `\n⚽ Goals / گل‌ها:\n`;
      matchStr += `  - ${homeFA} (${match.teams.home.name}):\n    ${homeScorersFA} / ${homeScorersEN}\n`;
      matchStr += `  - ${awayFA} (${match.teams.away.name}):\n    ${awayScorersFA} / ${awayScorersEN}`;
    }
    return matchStr;
  }).join('\n\n');

  return [header, resultsList];
}

