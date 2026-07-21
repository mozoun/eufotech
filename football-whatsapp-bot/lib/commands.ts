import { subscribeUser, unsubscribeUser } from './db';
import { getFixturesForDate, getFinishedFixturesWithScorers } from './football';
import { formatScheduleMessage, formatResultsMessage } from './format';

/**
 * Gets the current date string (YYYY-MM-DD) in the user's configured timezone.
 */
export function getTodayDateString(): string {
  const timezone = process.env.TIMEZONE || 'America/New_York';
  const now = new Date();
  
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(now); // 'en-CA' outputs precisely YYYY-MM-DD
  } catch (error) {
    console.error(`Error formatting date for timezone ${timezone}:`, error);
    // Fallback to UTC date
    return now.toISOString().split('T')[0];
  }
}

/**
 * Processes a command from a subscriber and returns the formatted response.
 */
export async function handleCommand(body: string, fromPhone: string, waId: string): Promise<string> {
  const normalized = body.trim().toLowerCase();

  // 1. Subscribe / Welcome Commands
  if (['start', 'subscribe', 'join', 'عضویت', 'شروع'].includes(normalized)) {
    await subscribeUser(fromPhone, waId, 'both');
    return getWelcomeMessage();
  }

  // 2. Unsubscribe / Stop Commands
  if (['stop', 'unsubscribe', 'لغو', 'خروج'].includes(normalized)) {
    await unsubscribeUser(fromPhone);
    return getGoodbyeMessage();
  }

  // 3. Today's Matches Schedule
  if (['today', 'schedule', 'امروز', 'برنامه', 'بازیها', 'بازی‌ها'].includes(normalized)) {
    const dateStr = getTodayDateString();
    const fixtures = await getFixturesForDate(dateStr);
    return formatScheduleMessage(fixtures, dateStr);
  }

  // 4. Today's Results
  if (['results', 'result', 'نتایج', 'نتیجه'].includes(normalized)) {
    const dateStr = getTodayDateString();
    const fixtures = await getFinishedFixturesWithScorers(dateStr);
    return formatResultsMessage(fixtures, dateStr);
  }

  // 5. Help Commands
  if (['help', 'info', 'راهنما', 'کمک', '?'].includes(normalized)) {
    return getHelpMessage();
  }

  // Default: Reply with help message
  return getHelpMessage();
}

function getWelcomeMessage(): string {
  return `🎉 به ربات جام جهانی ۲۰۲۶ خوش آمدید!
عضویت شما با موفقیت فعال شد. برنامه بازی‌ها را صبح و نتایج مسابقات را شب دریافت خواهید کرد.

دستورات پیامکی:
• امروز : نمایش برنامه بازی‌های امروز
• نتایج : نمایش نتایج بازی‌های امروز
• لغو : غیرفعال‌سازی عضویت
• راهنما : نمایش پیام راهنما

----------------------------------------

🎉 Welcome to the FIFA World Cup 2026 Bot!
Your subscription is active. You will receive daily match schedules in the morning and results in the evening.

Available Commands:
• today : Show today's match schedule
• results : Show today's match results
• stop : Unsubscribe from updates
• help : Show this help message`;
}

function getGoodbyeMessage(): string {
  return `👋 عضویت شما لغو شد. دیگر پیام‌های خودکار روزانه را دریافت نخواهید کرد. برای فعال‌سازی مجدد، هر زمان خواستید کلمه "عضویت" یا "start" را ارسال کنید.

----------------------------------------

👋 You have unsubscribed. You will no longer receive automatic updates. Send "start" or "subscribe" anytime to subscribe again.`;
}

function getHelpMessage(): string {
  return `ℹ️ راهنمای ربات جام جهانی ۲۰۲۶:

دستورات موجود:
• عضویت / start : عضویت در سیستم پیام‌رسانی
• امروز / today : برنامه بازی‌های امروز
• نتایج / results : نتایج بازی‌های امروز
• لغو / stop : لغو عضویت
• راهنما / help : نمایش این راهنما

----------------------------------------

ℹ️ FIFA World Cup 2026 Bot Help:

Commands you can send:
• start / subscribe : Subscribe to daily updates
• today / schedule : Today's match schedule
• results : Today's match results
• stop / unsubscribe : Unsubscribe from updates
• help : Show this help message`;
}
