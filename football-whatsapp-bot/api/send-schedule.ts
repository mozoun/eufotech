import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getActiveSubscribers, hasSentReportToday, logSentReport } from '../lib/db';
import { getFixturesForDate } from '../lib/football';
import { formatScheduleMessage, formatScheduleTemplateVars } from '../lib/format';
import { sendMessage } from '../lib/twilio';
import { getTodayDateString } from '../lib/commands';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Allow GET or POST for cron triggers
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // 1. Security Check
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.authorization;
  const querySecret = req.query.secret;
  const providedSecret = authHeader ? authHeader.replace('Bearer ', '') : querySecret;

  if (cronSecret && providedSecret !== cronSecret) {
    console.error('Unauthorized cron trigger attempt.');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // 2. Determine local date string
    const dateStr = getTodayDateString();
    console.log(`Starting daily schedule push for date: ${dateStr}`);

    // 3. Idempotency Check
    const alreadySent = await hasSentReportToday('schedule', dateStr);
    if (alreadySent) {
      console.log(`Daily schedule already sent for ${dateStr}. Skipping.`);
      return res.status(200).json({
        status: 'ignored',
        message: `Schedule was already sent for ${dateStr}`,
      });
    }

    // 4. Fetch Fixtures
    const fixtures = await getFixturesForDate(dateStr);
    console.log(`Fetched ${fixtures.length} fixtures for ${dateStr}`);

    // 5. Fetch Subscribers
    const subscribers = await getActiveSubscribers();
    if (subscribers.length === 0) {
      console.log('No active subscribers found.');
      return res.status(200).json({
        status: 'success',
        message: 'No active subscribers to send schedule to.',
        count: 0,
      });
    }

    // 6. Format Content
    const templateSid = process.env.TEMPLATE_SCHEDULE_SID;
    const templateVars = formatScheduleTemplateVars(fixtures, dateStr);
    const freeformBody = formatScheduleMessage(fixtures, dateStr);

    console.log(`Sending to ${subscribers.length} subscribers. Template configured: ${!!templateSid}`);

    // 7. Dispatch messages to subscribers
    const results = await Promise.allSettled(
      subscribers.map(async (sub) => {
        return sendMessage(sub.phone, freeformBody, templateSid, templateVars);
      })
    );

    const successCount = results.filter((r) => r.status === 'fulfilled').length;
    const failureCount = results.filter((r) => r.status === 'rejected').length;

    console.log(`Schedule distribution completed. Successes: ${successCount}, Failures: ${failureCount}`);

    // 8. Log the successful run to db (log even if some deliveries failed, to avoid endless loops on partial error)
    await logSentReport('schedule', dateStr);

    return res.status(200).json({
      status: 'success',
      date: dateStr,
      matchesCount: fixtures.length,
      successCount,
      failureCount,
    });
  } catch (error: any) {
    console.error('Error executing send-schedule cron:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Internal Server Error',
    });
  }
}
