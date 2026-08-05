/**
 * /api/meta/track.js — Next.js API Route: Meta CAPI Proxy
 * Varaha Jewels | Production-ready | 2026
 *
 * Accepts POST from browser → hashes PII → forwards to Meta CAPI.
 * The Access Token NEVER leaves this server file.
 *
 * Request body:
 * {
 *   eventName:      string  (required)
 *   eventId:        string  (required — UUID for deduplication)
 *   userData:       object  (raw PII: email, phone, firstName, lastName, city, state, zip)
 *   customData:     object  (value, currency, content_ids, etc.)
 *   eventSourceUrl: string  (full page URL)
 *   fbc:            string? (cookie: _fbc)
 *   fbp:            string? (cookie: _fbp)
 * }
 */

import { sendCapiEvent } from '../../../lib/metaCapi';

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const {
    eventName,
    eventId,
    userData = {},
    customData = {},
    eventSourceUrl,
    fbc,
    fbp,
  } = req.body;

  // Validate required fields
  if (!eventName || typeof eventName !== 'string') {
    return res.status(400).json({ error: 'Missing required field: eventName' });
  }
  if (!eventId || typeof eventId !== 'string') {
    return res.status(400).json({ error: 'Missing required field: eventId' });
  }

  // Extract real IP (Vercel forwards via x-forwarded-for)
  const rawIp = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '';
  const clientIp = rawIp.split(',')[0].trim();

  // User Agent
  const clientUserAgent = req.headers['user-agent'] || '';

  // Get fbc/fbp from request headers (cookies) if not passed in body
  const cookieHeader = req.headers['cookie'] || '';
  const cookieFbc = fbc || cookieHeader.match(/(?:^|;\s*)_fbc=([^;]+)/)?.[1];
  const cookieFbp = fbp || cookieHeader.match(/(?:^|;\s*)_fbp=([^;]+)/)?.[1];

  // Merge server-side signals into userData
  const enrichedUserData = {
    ...userData,
    clientIpAddress: clientIp || undefined,
    clientUserAgent: clientUserAgent || undefined,
    fbc: cookieFbc || undefined,
    fbp: cookieFbp || undefined,
  };

  // Test event code for debugging (set META_TEST_EVENT_CODE in env when testing)
  const testEventCode = process.env.META_TEST_EVENT_CODE || undefined;

  try {
    const result = await sendCapiEvent({
      eventName,
      eventId,
      userData: enrichedUserData,
      customData,
      eventSourceUrl: eventSourceUrl || 'https://varahajewels.in',
      testEventCode,
    });

    if (!result.success) {
      // Log but don't crash — tracking failures should never break checkout
      console.warn(`[Meta CAPI Route] Event ${eventName} failed:`, result.error);
      return res.status(200).json({ success: false, error: result.error });
    }

    return res.status(200).json({
      success: true,
      eventName,
      eventId,
      fbtrace_id: result.fbtrace_id,
    });
  } catch (error) {
    console.error('[Meta CAPI Route] Unexpected error:', error);
    // Return 200 to client — never let tracking break the user flow
    return res.status(200).json({ success: false, error: 'Internal error' });
  }
}
