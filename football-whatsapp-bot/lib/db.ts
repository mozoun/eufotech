import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

// Fail fast in production or if variables are missing
if (!supabaseUrl || !supabaseServiceKey) {
  // We log a warning but don't crash immediately to allow building or testing non-db files
  console.warn('Warning: SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables are missing.');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder-project.supabase.co',
  supabaseServiceKey || 'placeholder-key'
);

export interface Subscriber {
  id: string;
  phone: string;
  wa_id: string | null;
  language: 'fa' | 'en' | 'both';
  active: boolean;
  created_at: string;
  last_inbound_at: string;
}

/**
 * Subscribes a user by phone. If they already exist, it reactivates them and updates language.
 */
export async function subscribeUser(phone: string, waId: string, language: 'fa' | 'en' | 'both' = 'both') {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('subscribers')
    .upsert(
      {
        phone,
        wa_id: waId,
        language,
        active: true,
        last_inbound_at: now,
      },
      { onConflict: 'phone' }
    )
    .select();

  if (error) {
    console.error('Error subscribing user:', error);
    throw error;
  }
  return data;
}

/**
 * Deactivates a subscriber by setting active = false.
 */
export async function unsubscribeUser(phone: string) {
  const { data, error } = await supabase
    .from('subscribers')
    .update({ active: false })
    .eq('phone', phone)
    .select();

  if (error) {
    console.error('Error unsubscribing user:', error);
    throw error;
  }
  return data;
}

/**
 * Fetches all currently active subscribers.
 */
export async function getActiveSubscribers(): Promise<Subscriber[]> {
  const { data, error } = await supabase
    .from('subscribers')
    .select('*')
    .eq('active', true);

  if (error) {
    console.error('Error fetching active subscribers:', error);
    throw error;
  }
  return data || [];
}

/**
 * Fetches a subscriber's profile by phone.
 */
export async function getSubscriber(phone: string): Promise<Subscriber | null> {
  const { data, error } = await supabase
    .from('subscribers')
    .select('*')
    .eq('phone', phone)
    .maybeSingle();

  if (error) {
    console.error('Error fetching subscriber:', error);
    throw error;
  }
  return data;
}

/**
 * Checks if a specific report type (schedule / results) was already sent for a date.
 */
export async function hasSentReportToday(type: 'schedule' | 'results', dateStr: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('sent_log')
    .select('id')
    .eq('type', type)
    .eq('match_date', dateStr)
    .maybeSingle();

  if (error) {
    console.error('Error checking sent log:', error);
    throw error;
  }
  return !!data;
}

/**
 * Logs a sent report to prevent double-sends.
 */
export async function logSentReport(type: 'schedule' | 'results', dateStr: string) {
  const { data, error } = await supabase
    .from('sent_log')
    .insert({ type, match_date: dateStr })
    .select();

  if (error) {
    console.error('Error logging sent report:', error);
    throw error;
  }
  return data;
}

/**
 * Updates the last_inbound_at timestamp.
 */
export async function updateLastInbound(phone: string) {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('subscribers')
    .update({ last_inbound_at: now })
    .eq('phone', phone)
    .select();

  if (error) {
    console.error('Error updating last inbound timestamp:', error);
    throw error;
  }
  return data;
}
