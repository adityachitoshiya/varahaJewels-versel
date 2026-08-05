/**
 * metaPixel.js — Browser-side Meta Pixel Utility
 * Varaha Jewels | Production-ready | 2026
 *
 * - Fires fbq() events with unique event_id for deduplication
 * - Mirrors every event to /api/meta/track (server-side CAPI)
 * - Reads Advanced Matching data from localStorage / order data
 * - All functions are SSR-safe
 */

export const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || '1677582290073297';

// ─────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────

/** Generate a UUID for event deduplication. */
export function generateEventId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Build Advanced Matching user_data object from known info.
 * Pass raw (unhashed) values — the browser pixel hashes them automatically.
 * CAPI hashing is done server-side in metaCapi.js.
 *
 * @param {object} overrides — any known fields to merge in
 */
export function getUserData(overrides = {}) {
  if (typeof window === 'undefined') return {};

  let stored = {};
  try {
    stored = {
      email: localStorage.getItem('meta_user_email') || '',
      phone: localStorage.getItem('meta_user_phone') || '',
      firstName: localStorage.getItem('meta_user_fn') || '',
      lastName: localStorage.getItem('meta_user_ln') || '',
      city: localStorage.getItem('meta_user_city') || '',
      state: localStorage.getItem('meta_user_state') || '',
      zip: localStorage.getItem('meta_user_zip') || '',
      country: 'in',
    };
  } catch (_) {
    // localStorage blocked
  }

  return { ...stored, ...overrides };
}

/**
 * Persist user data to localStorage so it's available on later pages
 * (e.g., checkout fills in email/phone/address → payment-success can read it).
 */
export function storeUserData({ email, phone, name, city, state, zip } = {}) {
  if (typeof window === 'undefined') return;
  try {
    if (email) localStorage.setItem('meta_user_email', email.toLowerCase().trim());
    if (phone) localStorage.setItem('meta_user_phone', phone.replace(/\D/g, ''));
    if (name) {
      const parts = name.trim().split(' ');
      localStorage.setItem('meta_user_fn', parts[0] || '');
      localStorage.setItem('meta_user_ln', parts.slice(1).join(' ') || '');
    }
    if (city) localStorage.setItem('meta_user_city', city.toLowerCase().trim());
    if (state) localStorage.setItem('meta_user_state', state.toLowerCase().trim());
    if (zip) localStorage.setItem('meta_user_zip', zip.trim());
  } catch (_) {}
}

// ─────────────────────────────────────────────
// Browser Pixel Firing
// ─────────────────────────────────────────────

/**
 * Fire a Meta Pixel browser event.
 * Returns the eventId used so you can send the same ID to CAPI.
 *
 * @param {string} eventName    — e.g. 'ViewContent', 'Purchase'
 * @param {object} eventData    — custom_data payload
 * @param {string} [eventId]    — pre-generated event_id (for deduplication)
 */
export function trackPixelEvent(eventName, eventData = {}, eventId = null) {
  if (typeof window === 'undefined' || typeof window.fbq !== 'function') return null;
  const id = eventId || generateEventId();
  window.fbq('track', eventName, eventData, { eventID: id });
  return id;
}

// ─────────────────────────────────────────────
// CAPI Mirror (via Next.js API Route)
// ─────────────────────────────────────────────

/**
 * Send the same event to our server-side CAPI proxy at /api/meta/track.
 * The proxy hashes PII and forwards to Meta's Graph API.
 * Never call Meta directly from browser (Access Token must stay server-side).
 *
 * @param {object} params
 */
export async function sendCapiEvent({ eventName, eventId, userData = {}, customData = {}, eventSourceUrl }) {
  if (typeof window === 'undefined') return;

  try {
    const url = eventSourceUrl || window.location.href;
    const res = await fetch('/api/meta/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventName,
        eventId,
        userData,
        customData,
        eventSourceUrl: url,
        // Pass fbc / fbp cookies for better match quality
        fbc: getCookie('_fbc'),
        fbp: getCookie('_fbp'),
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.warn('[Meta CAPI] Non-OK response:', err);
    }
  } catch (e) {
    // Never block the UI for tracking failures
    console.warn('[Meta CAPI] Failed to send event:', e.message);
  }
}

// ─────────────────────────────────────────────
// Combined: Browser Pixel + CAPI in one call
// ─────────────────────────────────────────────

/**
 * Track an event on both browser pixel AND CAPI with the same event_id.
 * This is the main function you should call from pages.
 *
 * @param {string} eventName      — Meta standard event name
 * @param {object} eventData      — custom_data / pixel payload
 * @param {object} [userData]     — Advanced Matching fields (raw, un-hashed)
 * @returns {string}              — the event_id used for deduplication
 */
export async function trackEvent(eventName, eventData = {}, userData = {}) {
  const eventId = generateEventId();
  const mergedUser = { ...getUserData(), ...userData };

  // 1. Browser pixel (async-friendly — non-blocking)
  trackPixelEvent(eventName, eventData, eventId);

  // 2. CAPI mirror (fire-and-forget)
  sendCapiEvent({ eventName, eventId, userData: mergedUser, customData: eventData });

  return eventId;
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function getCookie(name) {
  if (typeof document === 'undefined') return undefined;
  const match = document.cookie.match(new RegExp('(?:^|;\\s*)' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : undefined;
}
