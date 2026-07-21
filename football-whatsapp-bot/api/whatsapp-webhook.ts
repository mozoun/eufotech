import type { VercelRequest, VercelResponse } from '@vercel/node';
import twilio from 'twilio';
import { handleCommand } from '../lib/commands';
import { validateTwilioWebhook } from '../lib/twilio';
import { updateLastInbound } from '../lib/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Twilio sends webhooks via POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const signature = req.headers['x-twilio-signature'] as string;
  const protocol = (req.headers['x-forwarded-proto'] as string) || 'https';
  const host = req.headers['host'];
  const fullUrl = `${protocol}://${host}${req.url || ''}`;

  // Twilio POST request contains body parsed as URL-encoded key-value pairs
  const params = req.body || {};

  // Request Signature Validation (Optional if credentials are not fully set in testing)
  if (signature) {
    const isValid = validateTwilioWebhook(signature, fullUrl, params);
    if (!isValid) {
      console.warn('Unauthorized request: Twilio signature verification failed.');
      return res.status(403).send('Invalid Twilio Signature');
    }
  }

  const body = params.Body;
  const from = params.From; // format: 'whatsapp:+1234567890'
  const waId = params.WaId;

  if (!body || !from) {
    console.error('Inbound request missing body or sender phone number.', params);
    return res.status(400).send('Missing Body or From fields');
  }

  try {
    // Record inbound message activity to update last_inbound_at
    try {
      await updateLastInbound(from);
    } catch (dbError) {
      console.warn(`Could not update last_inbound_at for ${from} (user may not be subscribed yet):`, dbError);
    }

    // Process commands and get the response text
    const responseText = await handleCommand(body, from, waId);

    // Create the TwiML XML response
    const messagingResponse = new twilio.twiml.MessagingResponse();
    messagingResponse.message(responseText);

    res.setHeader('Content-Type', 'text/xml');
    return res.status(200).send(messagingResponse.toString());
  } catch (error) {
    console.error('Error handling Twilio webhook:', error);
    
    // TwiML fallback message
    const messagingResponse = new twilio.twiml.MessagingResponse();
    messagingResponse.message(
      `Sorry, there was an error processing your command. Please try again later.\n\n` +
      `متأسفانه مشکلی در پردازش درخواست شما پیش آمد. لطفاً بعداً تلاش کنید.`
    );
    res.setHeader('Content-Type', 'text/xml');
    return res.status(200).send(messagingResponse.toString());
  }
}
