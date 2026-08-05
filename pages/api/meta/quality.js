/**
 * /api/meta/quality.js — Meta Dataset Quality API
 * Varaha Jewels | Production-ready | 2026
 *
 * Queries Meta's Dataset Quality API to get real-time Event Match Quality (EMQ)
 * scores for all tracked events. Use this to monitor tracking health without
 * opening Events Manager.
 *
 * Meta Dataset Quality API:
 * https://developers.facebook.com/docs/marketing-api/conversions-api/dataset-quality
 *
 * Correct endpoint: GET /v20.0/dataset_quality?dataset_id={pixelId}
 * Dataset ID = Pixel ID = 1677582290073297
 *
 * Usage (GET requests only):
 *   /api/meta/quality                  → EMQ for all events
 *   /api/meta/quality?event=Purchase   → EMQ for a specific event only
 *
 * ⚠️  Protect this route in production — add admin auth check before deploying.
 */

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || '1677582290073297';
const ACCESS_TOKEN = process.env.META_CAPI_ACCESS_TOKEN;
const API_VERSION = 'v20.0';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (!ACCESS_TOKEN || ACCESS_TOKEN.includes('REPLACE_WITH')) {
    return res.status(500).json({
      error: 'META_CAPI_ACCESS_TOKEN is not configured',
      hint: 'Add META_CAPI_ACCESS_TOKEN to your .env.local or Vercel environment variables',
    });
  }

  const { event: filterEvent } = req.query;

  try {
    // ─── 1. Dataset Quality API — Event Match Quality Scores ─────────────────
    // Official endpoint: /dataset_quality?dataset_id={pixelId}
    const qualityUrl = new URL(`https://graph.facebook.com/${API_VERSION}/dataset_quality`);
    qualityUrl.searchParams.set('access_token', ACCESS_TOKEN);
    qualityUrl.searchParams.set('dataset_id', PIXEL_ID);
    qualityUrl.searchParams.set('fields', [
      'event_name',
      'event_match_quality_score',
      'matched_events_count',
      'unmatched_events_count',
      'matched_events_with_value_count',
      'data_sources',
    ].join(','));

    const qualityRes = await fetch(qualityUrl.toString());
    const qualityData = await qualityRes.json();

    if (!qualityRes.ok || qualityData.error) {
      const errMsg = qualityData?.error?.message || `HTTP ${qualityRes.status}`;
      console.error('[Meta Quality API] Error:', errMsg, qualityData?.error);
      return res.status(502).json({
        error: 'Meta Dataset Quality API error',
        message: errMsg,
        code: qualityData?.error?.code,
        type: qualityData?.error?.type,
      });
    }

    // ─── 2. Send a test CAPI event to validate the pipeline is live ──────────
    // (Only called when ?ping=1 is passed — useful for CI/health-check)
    if (req.query.ping === '1') {
      const crypto = await import('crypto');
      const { sendCapiEvent } = await import('../../../lib/metaCapi');
      const pingResult = await sendCapiEvent({
        eventName: 'PageView',
        eventId: crypto.default.randomUUID(),
        userData: {},
        customData: {},
        eventSourceUrl: 'https://varahajewels.in',
      });
      return res.status(200).json({
        ping: pingResult,
        note: 'PageView test event sent to CAPI',
      });
    }

    // ─── 3. Build normalised response ─────────────────────────────────────────
    // qualityData can be: {} (no events yet) or { data: [...] }
    let events = qualityData.data || [];

    // Filter by specific event name if ?event= is passed
    if (filterEvent) {
      events = events.filter(e =>
        (e.event_name || '').toLowerCase() === filterEvent.toLowerCase()
      );
    }

    // Compute summary stats
    const scored = events.filter(e => e.event_match_quality_score != null);
    const avgScore = scored.length > 0
      ? (scored.reduce((s, e) => s + e.event_match_quality_score, 0) / scored.length)
      : null;

    const summary = {
      pixel_id: PIXEL_ID,
      total_events_tracked: events.length,
      average_emq_score: avgScore !== null ? parseFloat(avgScore.toFixed(2)) : null,
      quality_grade: getQualityGrade(avgScore),
      note: events.length === 0
        ? 'No EMQ data yet — events must reach sufficient volume first (usually 24–48h after going live)'
        : null,
    };

    // Per-event breakdown with human-readable grades
    const breakdown = events.map(e => ({
      event_name: e.event_name,
      emq_score: e.event_match_quality_score ?? null,
      quality_grade: getQualityGrade(e.event_match_quality_score),
      matched_events: e.matched_events_count ?? null,
      unmatched_events: e.unmatched_events_count ?? null,
      events_with_value: e.matched_events_with_value_count ?? null,
      data_sources: e.data_sources || [],   // e.g. ["SERVER", "BROWSER_PIXEL"]
    }));

    breakdown.sort((a, b) => {
      // Sort: Purchase first, then by name
      if (a.event_name === 'Purchase') return -1;
      if (b.event_name === 'Purchase') return 1;
      return (a.event_name || '').localeCompare(b.event_name || '');
    });

    return res.status(200).json({
      ok: true,
      summary,
      events: breakdown,
      fetched_at: new Date().toISOString(),
      // Thresholds for reference
      thresholds: {
        excellent: '9.0 – 10.0 🟢',
        good: '7.0 – 8.9  🟡',
        fair: '5.0 – 6.9  🟠',
        poor: '< 5.0      🔴',
      },
    });

  } catch (error) {
    console.error('[Meta Quality API] Unexpected error:', error);
    return res.status(500).json({
      error: 'Internal server error querying Meta Dataset Quality API',
      message: error.message,
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: Convert numeric EMQ score to human-readable grade
// ─────────────────────────────────────────────────────────────────────────────
function getQualityGrade(score) {
  const s = parseFloat(score);
  if (isNaN(s) || score == null) return 'Pending data';
  if (s >= 9.0) return '🟢 Excellent';
  if (s >= 7.0) return '🟡 Good';
  if (s >= 5.0) return '🟠 Fair — consider adding more PII fields';
  return '🔴 Poor — urgently add email, phone, name, address fields';
}
