import { getApiUrl } from './config';

// One /api/products request per page load, shared by the header menu and the
// homepage sections. A failed request is not cached, so the next caller retries.
let promise = null;

export function loadProducts() {
  if (!promise) {
    promise = fetch(`${getApiUrl()}/api/products`)
      .then((r) => {
        if (!r.ok) throw new Error(`products ${r.status}`);
        return r.json();
      })
      .catch(() => {
        promise = null;
        return [];
      });
  }
  return promise;
}

export const isInStock = (p) => p.stock !== 0;

export function parseList(v) {
  if (Array.isArray(v)) return v;
  try {
    const x = JSON.parse(v || '[]');
    return Array.isArray(x) ? x : [];
  } catch {
    return [];
  }
}

export const formatINR = (n) => `₹${Math.round(Number(n)).toLocaleString('en-IN')}`;
