/**
 * metaCapi.js — Server-side Meta Conversions API Utility
 * Varaha Jewels | Production-ready | 2026
 *
 * ⚠️  THIS FILE MUST ONLY BE IMPORTED IN /pages/api/* ROUTES
 *     Never import it in browser-facing components.
 *     The META_CAPI_ACCESS_TOKEN env var is server-only (no NEXT_PUBLIC_ prefix).
 */

import crypto from 'crypto';

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || '1677582290073297';
const ACCESS_TOKEN = process.env.META_CAPI_ACCESS_TOKEN; // Server-only — NEVER expose!
const API_VERSION = 'v20.0';
const CAPI_ENDPOINT = `https://graph.facebook.com/${API_VERSION}/${PIXEL_ID}/events`;

// ─────────────────────────────────────────────
// PII Hashing — SHA-256, lowercase-trimmed
// ─────────────────────────────────────────────

/**
 * SHA-256 hash a single PII value.
 * Normalizes: lowercase + trim. Returns undefined if value is falsy.
 */
function hashValue(value) {
  if (!value || value.toString().trim() === '') return undefined;
  const normalized = value.toString().toLowerCase().trim();
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

/**
 * Hash a phone number: strip all non-digits first, then hash.
 * Removes leading country code if present (Meta expects local format or with country code).
 */
function hashPhone(phone) {
  if (!phone) return undefined;
  // Normalize: keep only digits
  const digits = phone.toString().replace(/\D/g, '');
  // If 12 digits and starts with 91 (India), keep as-is; if 10 digits, prepend 91
  const normalized = digits.length === 10 ? `91${digits}` : digits;
  if (!normalized) return undefined;
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

/**
 * Build hashed user_data object from raw PII.
 * All fields are optional — Meta uses whatever is available.
 */
export function hashUserData(userData = {}) {
  const {
    email,
    phone,
    firstName,
    lastName,
    city,
    state,
    zip,
    country = 'in',
    // Pass-through (NOT hashed — Meta requires these raw)
    clientIpAddress,
    clientUserAgent,
    fbc,
    fbp,
  } = userData;

  const hashed = {};

  if (hashValue(email)) hashed.em = hashValue(email);
  if (hashPhone(phone)) hashed.ph = hashPhone(phone);
  if (hashValue(firstName)) hashed.fn = hashValue(firstName);
  if (hashValue(lastName)) hashed.ln = hashValue(lastName);
  if (hashValue(city)) hashed.ct = hashValue(city);
  if (hashValue(state)) hashed.st = hashValue(state);
  if (hashValue(zip)) hashed.zp = hashValue(zip);
  if (hashValue(country)) hashed.country = hashValue(country);

  // These pass raw (not hashed) as per Meta spec
  if (clientIpAddress) hashed.client_ip_address = clientIpAddress;
  if (clientUserAgent) hashed.client_user_agent = clientUserAgent;
  if (fbc) hashed.fbc = fbc;
  if (fbp) hashed.fbp = fbp;

  return hashed;
}

// ─────────────────────────────────────────────
// Main CAPI Sender
// ─────────────────────────────────────────────

/**
 * Send one event to Meta Conversions API.
 *
 * @param {object} params
 * @param {string} params.eventName         — Standard Meta event (e.g. 'Purchase')
 * @param {string} params.eventId           — UUID matching the browser pixel event_id
 * @param {object} params.userData          — Raw (un-hashed) user PII — hashed here server-side
 * @param {object} params.customData        — value, currency, content_ids, etc.
 * @param {string} params.eventSourceUrl    — Full page URL where event occurred
 * @param {string} [params.testEventCode]   — Optional: Meta test event code for debugging
 *
 * @returns {{ success: boolean, fbtrace_id?: string }}
 */
export async function sendCapiEvent({
  eventName,
  eventId,
  userData = {},
  customData = {},
  eventSourceUrl = 'https://varahajewels.in',
  testEventCode,
}) {
  if (!ACCESS_TOKEN) {
    console.error('[Meta CAPI] ❌ META_CAPI_ACCESS_TOKEN is not set. Server-side events will not fire.');
    return { success: false, error: 'ACCESS_TOKEN missing' };
  }

  if (!PIXEL_ID) {
    console.error('[Meta CAPI] ❌ NEXT_PUBLIC_META_PIXEL_ID is not set.');
    return { success: false, error: 'PIXEL_ID missing' };
  }

  const hashedUser = hashUserData(userData);

  const eventPayload = {
    event_name: eventName,
    event_time: Math.floor(Date.now() / 1000),
    event_id: eventId,
    event_source_url: eventSourceUrl,
    action_source: 'website',
    user_data: hashedUser,
    custom_data: customData,
  };

  const body = {
    data: [eventPayload],
  };

  // Only include test_event_code in non-production or when explicitly set
  if (testEventCode) {
    body.test_event_code = testEventCode;
  }

  console.log(`[Meta CAPI] 📡 Sending ${eventName} | event_id: ${eventId}`);

  try {
    const response = await fetch(`${CAPI_ENDPOINT}?access_token=${ACCESS_TOKEN}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      const errMsg = data?.error?.message || `HTTP ${response.status}`;
      console.error(`[Meta CAPI] ❌ ${eventName} failed:`, errMsg, data);
      return { success: false, error: errMsg };
    }

    console.log(`[Meta CAPI] ✅ ${eventName} delivered | fbtrace_id: ${data.fbtrace_id} | events_received: ${data.events_received}`);
    return { success: true, fbtrace_id: data.fbtrace_id, eventsReceived: data.events_received };
  } catch (error) {
    console.error(`[Meta CAPI] ❌ Network error for ${eventName}:`, error.message);
    return { success: false, error: error.message };
  }
}
