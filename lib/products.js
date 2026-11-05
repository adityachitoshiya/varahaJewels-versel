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
