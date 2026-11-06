import { getApiUrl } from './config';

// Products are loaded stale-while-revalidate:
//  - the last list this browser saw (kept in localStorage) is shown at once, so pages are
//    never blank while the server wakes up or the network is slow;
//  - one fresh /api/products request per page load updates the list (and the saved copy);
//    pages subscribe with onProductsUpdate() to swap in the fresh prices and stock.
const KEY = 'vj_products_v1';
const MAX_AGE_MS = 12 * 60 * 60 * 1000;
let promise = null;
let memo = null;
const listeners = new Set();

const save = (list) => {
  try { localStorage.setItem(KEY, JSON.stringify({ t: Date.now(), d: list })); } catch { /* storage full or blocked */ }
};

// Last known list, right now (no network). null when we have none yet.
export function peekProducts() {
  if (memo) return memo;
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const { t, d } = JSON.parse(raw);
      if (Array.isArray(d) && d.length && Date.now() - t < MAX_AGE_MS) { memo = d; return d; }
    }
  } catch { /* corrupt entry: ignore */ }
  return null;
}

// Pages built on the server hand their list to the browser, so a first visit is never blank either.
export function seedProducts(list) {
  if (typeof window === 'undefined' || !Array.isArray(list) || !list.length) return;
  if (!memo) memo = list;
  save(list);
}

export function onProductsUpdate(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function loadProducts() {
  const cached = peekProducts();
  if (!promise) {
    promise = fetch(`${getApiUrl()}/api/products`)
      .then((r) => {
        if (!r.ok) throw new Error(`products ${r.status}`);
        return r.json();
      })
      .then((list) => {
        memo = list;
        save(list);
        listeners.forEach((fn) => { try { fn(list); } catch { /* one bad listener must not stop the rest */ } });
        return list;
      })
      .catch(() => {
        promise = null;
        return cached || [];
      });
  }
  return cached ? Promise.resolve(cached) : promise;
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

// ── Colour options ───────────────────────────────────────────────────────
// Products that are one design in several colours share Product.style
// (the supplier design code, e.g. "CZN198"). Lists show one card per design;
// the product page shows the other colours as options.

// One entry per design: keep the first in-stock colour, note how many colours exist
export function collapseColours(list) {
  const groups = new Map();
  const out = [];
  for (const p of list) {
    if (!p.style) { out.push(p); continue; }
    const g = groups.get(p.style);
    if (!g) {
      const entry = { ...p, colourCount: 1 };
      groups.set(p.style, entry);
      out.push(entry);
    } else {
      g.colourCount += 1;
      // Prefer showing a colour that is in stock
      if (g.stock === 0 && p.stock !== 0) Object.assign(g, { ...p, colourCount: g.colourCount });
    }
  }
  return out;
}

// All colours of a product's design (including itself), in a stable order
export function colourSiblings(product, all) {
  if (!product?.style) return [];
  return all.filter((p) => p.style === product.style).sort((a, b) => String(a.id).localeCompare(String(b.id)));
}
