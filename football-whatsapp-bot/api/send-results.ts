import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getActiveSubscribers, hasSentReportToday, logSentReport } from '../lib/db';
import { getFinishedFixturesWithScorers, getFixturesForDate } from '../lib/football';
import { formatResultsMessage, formatResultsTemplateVars } from '../lib/format';
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
    console.log(`Starting daily results push for date: ${dateStr}`);

    // 3. Idempotency Check
    const alreadySent = await hasSentReportToday('results', dateStr);
    if (alreadySent) {
      console.log(`Daily results already sent for ${dateStr}. Skipping.`);
      return res.status(200).json({
        status: 'ignored',
        message: `Results were already sent for ${dateStr}`,
      });
    }

    // 4. Check if there are any fixtures scheduled for today at all
    const allFixtures = await getFixturesForDate(dateStr);
    if (allFixtures.length === 0) {
      console.log(`No fixtures scheduled for today (${dateStr}). Skipping results push.`);
      return res.status(200).json({
        status: 'ignored',
        message: `No matches were scheduled for ${dateStr}`,
      });
    }

    // 5. Fetch Finished Fixtures with scorers
    const finishedFixtures = await getFinishedFixturesWithScorers(dateStr);
    console.log(`Fetched ${finishedFixtures.length} finished fixtures out of ${allFixtures.length} today`);

    // If no matches have finished yet, do not send and do not log to sent_log.
    // This allows subsequent cron runs/retries to fetch and send once matches are finished.
    if (finishedFixtures.length === 0) {
      console.log('No matches have finished yet today.');
      return res.status(200).json({
        status: 'pending',
        message: 'No matches have finished yet today. Skipping sent_log write to allow retry.',
      });
    }

    // 6. Fetch Subscribers
    const subscribers = await getActiveSubscribers();
    if (subscribers.length === 0) {
      console.log('No active subscribers found.');
      return res.status(200).json({
        status: 'success',
        message: 'No active subscribers to send results to.',
        count: 0,
      });
    }

    // 7. Format Content
    const templateSid = process.env.TEMPLATE_RESULTS_SID;
    const templateVars = formatResultsTemplateVars(finishedFixtures, dateStr);
    const freeformBody = formatResultsMessage(finishedFixtures, dateStr);

    console.log(`Sending to ${subscribers.length} subscribers. Template configured: ${!!templateSid}`);

    // 8. Dispatch messages to subscribers
    const results = await Promise.allSettled(
      subscribers.map(async (sub) => {
        return sendMessage(sub.phone, freeformBody, templateSid, templateVars);
      })
    );

    const successCount = results.filter((r) => r.status === 'fulfilled').length;
    const failureCount = results.filter((r) => r.status === 'rejected').length;

    console.log(`Results distribution completed. Successes: ${successCount}, Failures: ${failureCount}`);

    // 9. Log the successful run to db (log even if some deliveries failed to avoid spam/retries)
    await logSentReport('results', dateStr);

    return res.status(200).json({
      status: 'success',
      date: dateStr,
      matchesCount: finishedFixtures.length,
      successCount,
      failureCount,
    });
  } catch (error: any) {
    console.error('Error executing send-results cron:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Internal Server Error',
    });
  }
}
