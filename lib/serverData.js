// Used inside getStaticProps / getStaticPaths (runs on the server, not in the browser).
import { getApiUrl } from './config';

// GET a JSON endpoint of our API; null when it is slow or down, so a build never fails because of it.
export async function serverGet(path, ms = 8000) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), ms);
  try {
    const res = await fetch(`${getApiUrl()}${path}`, { signal: ctl.signal });
    if (!res.ok) return res.status === 404 ? { __notFound: true } : null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
