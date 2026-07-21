import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const whatsappFrom = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886'; // Twilio sandbox number default

if (!accountSid || !authToken) {
  console.warn('Warning: TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN environment variables are missing.');
}

const client = twilio(
  accountSid || 'AC00000000000000000000000000000000',
  authToken || 'placeholder_auth_token'
);

/**
 * Sends a standard freeform WhatsApp message (only works inside 24h window).
 */
export async function sendFreeform(to: string, body: string) {
  try {
    const message = await client.messages.create({
      from: whatsappFrom,
      to: to,
      body: body,
    });
    return message;
  } catch (error) {
    console.error(`Failed to send freeform WhatsApp message to ${to}:`, error);
    throw error;
  }
}

/**
 * Sends a WhatsApp message using a pre-approved template (works outside 24h window).
 * Twilio Content API template variables are passed as a JSON string where keys are '1', '2', etc.
 */
export async function sendTemplate(to: string, templateSid: string, variables: string[]) {
  try {
    // Map ['var1', 'var2'] to {"1": "var1", "2": "var2"}
    const contentVariables: Record<string, string> = {};
    variables.forEach((value, index) => {
      contentVariables[String(index + 1)] = value;
    });

    const message = await client.messages.create({
      from: whatsappFrom,
      to: to,
      contentSid: templateSid,
      contentVariables: JSON.stringify(contentVariables),
    });
    return message;
  } catch (error) {
    console.error(`Failed to send template WhatsApp message (${templateSid}) to ${to}:`, error);
    throw error;
  }
}

/**
 * Sends a message, automatically selecting template if configured, otherwise falling back to freeform.
 */
export async function sendMessage(to: string, body: string, templateSid?: string, templateVars?: string[]) {
  if (templateSid && templateVars && templateVars.length > 0) {
    try {
      console.log(`Attempting to send template ${templateSid} to ${to}...`);
      return await sendTemplate(to, templateSid, templateVars);
    } catch (error) {
      console.warn(`Template send failed. Falling back to freeform message...`);
      return await sendFreeform(to, body);
    }
  } else {
    return await sendFreeform(to, body);
  }
}

/**
 * Validates the signature of incoming Twilio webhook requests to ensure authenticity.
 */
export function validateTwilioWebhook(signature: string, url: string, params: Record<string, any>): boolean {
  if (!authToken) {
    console.warn('Webhook validation skipped because TWILIO_AUTH_TOKEN is missing.');
    return true; // Return true in dev/sandbox if token isn't configured
  }

  try {
    return twilio.validateRequest(authToken, signature, url, params);
  } catch (error) {
    console.error('Error validating Twilio signature:', error);
    return false;
  }
}
