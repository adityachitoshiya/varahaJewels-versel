export const initTracking = () => {
  if (typeof window === 'undefined') return {};

  // 1. Session ID Management
  let sessionId = localStorage.getItem('vj_session_id');
  if (!sessionId) {
    sessionId = 'sess_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('vj_session_id', sessionId);
  }

  // 2. UTM and Referrer Extraction
  const urlParams = new URLSearchParams(window.location.search);
  
  const getParamOrStorage = (key) => {
    // If URL has it, update storage
    if (urlParams.has(key)) {
      const val = urlParams.get(key);
      sessionStorage.setItem(`vj_${key}`, val);
      return val;
    }
    // Otherwise fallback to what's in storage for this session
    return sessionStorage.getItem(`vj_${key}`) || null;
  };

  const utm_source = getParamOrStorage('utm_source');
  const utm_medium = getParamOrStorage('utm_medium');
  const utm_campaign = getParamOrStorage('utm_campaign');

  // Referrer logic: Only capture referrer on the FIRST page load of the session
  let referrer = sessionStorage.getItem('vj_referrer');
  if (!referrer && document.referrer) {
    // Exclude self-referrals (e.g. navigating from our own site)
    if (!document.referrer.includes(window.location.hostname)) {
      referrer = document.referrer;
      sessionStorage.setItem('vj_referrer', referrer);
    }
  }

  return {
    session_id: sessionId,
    utm_source,
    utm_medium,
    utm_campaign,
    referrer
  };
};

export const getSessionId = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('vj_session_id');
};
