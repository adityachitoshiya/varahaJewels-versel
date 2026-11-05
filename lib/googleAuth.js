import { useGoogleLogin } from '@react-oauth/google';

// Public OAuth client ID (safe to ship; it is visible to every visitor).
// The env var wins when it is set in Vercel.
export const GOOGLE_CLIENT_ID =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '390681375827-jt3d2qcr9bo0geboirt03ii5m0tqfiij.apps.googleusercontent.com';

// Google's hook throws (and blanks the page) without a client ID, so fall
// back to a harmless stand-in that reports the problem instead.
export const useSafeGoogleLogin = GOOGLE_CLIENT_ID
  ? useGoogleLogin
  : ({ onError }) => () => onError?.({ error: 'Google sign-in is not configured' });
