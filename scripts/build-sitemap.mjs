// Rebuilds public/sitemap.xml before every `npm run build` (see "prebuild").
// Includes shop/section pages, every blog article in data/blogs, and every
// in-stock product from the live API (skipped, with a warning, if the API is down).
import fs from 'fs';
import path from 'path';

const SITE = 'https://www.varahajewels.in';
const API = process.env.NEXT_PUBLIC_API_URL || 'https://backend.varahajewels.in';
const root = process.cwd();
const today = new Date().toISOString().slice(0, 10);

const pages = [
  ['/', 'daily', '1.0'],
  ['/shop', 'daily', '0.9'],
  ['/heritage', 'weekly', '0.9'],
  ['/silver', 'weekly', '0.9'],
  ['/divine', 'weekly', '0.9'],
  ['/watches', 'weekly', '0.8'],
  ['/potli-bags', 'weekly', '0.8'],
  ['/women', 'weekly', '0.8'],
  ['/women/necklaces', 'weekly', '0.8'],
  ['/women/earrings', 'weekly', '0.8'],
  ['/women/bridal-jewellery', 'weekly', '0.7'],
  ['/women/minimal', 'weekly', '0.7'],
  ['/men', 'weekly', '0.6'],
  ['/new-arrivals', 'daily', '0.7'],
  ['/blogs', 'weekly', '0.8'],
  ['/about', 'monthly', '0.4'],
  ['/contact', 'monthly', '0.4'],
  ['/shipping', 'monthly', '0.3'],
  ['/faq', 'monthly', '0.3'],
];

const blogDir = path.join(root, 'data', 'blogs');
const blogs = fs.existsSync(blogDir)
  ? fs.readdirSync(blogDir).filter((f) => f.endsWith('.json')).flatMap((f) => {
      try {
        const p = JSON.parse(fs.readFileSync(path.join(blogDir, f), 'utf8'));
        return p.slug ? [[`/blogs/${p.slug}`, 'monthly', '0.6', p.date || today]] : [];
      } catch {
        return [];
      }
    })
  : [];

let products = [];
try {
  const res = await fetch(`${API}/api/products`, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  products = (await res.json())
    .filter((p) => p.stock !== 0 && (p.slug || p.id))
    .map((p) => [`/product/${encodeURIComponent(p.slug || p.id)}`, 'weekly', '0.7']);
} catch (e) {
  console.warn(`sitemap: products skipped (${e.message})`);
}

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const urls = [...pages, ...products, ...blogs].map(([loc, freq, prio, mod]) =>
  `  <url><loc>${esc(SITE + loc)}</loc><lastmod>${mod || today}</lastmod><changefreq>${freq}</changefreq><priority>${prio}</priority></url>`);

fs.writeFileSync(
  path.join(root, 'public', 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`
);
console.log(`sitemap: ${pages.length} pages, ${products.length} products, ${blogs.length} blog posts`);
