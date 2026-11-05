import { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { Search, X } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { getApiUrl, getAuthHeaders } from '../lib/config';
import MarketCard, { CardSkeleton } from '../components/MarketCard';
import { collapseColours } from '../lib/products';

// Marketplace: every in-stock piece, filtered by section (chips), who it's for,
// search and price sort. "All" shows each section as a short shelf.

// Shopper-facing names and order for the stored category values
const SECTION_LABELS = {
  Heritage: 'Heritage',
  Necklace: 'Necklaces',
  Silver: 'Silver',
  Divine: 'Divine',
  Earrings: 'Earrings',
  Watches: 'Watches',
  'Potli Bags': 'Potli bags',
  Bridal: 'Bridal',
  Artificial: 'Everyday',
  Men: 'Men',
};
const SECTION_ORDER = Object.keys(SECTION_LABELS);
const SHELF_SIZE = 4;
const sectionOf = (p) => p.category || 'Other';
const labelOf = (s) => SECTION_LABELS[s] || s;

export default function Shop() {
  const router = useRouter();
  const [products, setProducts] = useState(null);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('featured');
  const section = typeof router.query.section === 'string' ? router.query.section : 'All';
  const audience = typeof router.query.for === 'string' ? router.query.for : 'All';
  const maxPrice = Number(router.query.max) > 0 ? Number(router.query.max) : null;

  useEffect(() => {
    fetch(`${getApiUrl()}/api/products`, { headers: getAuthHeaders() })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setProducts(collapseColours(data.filter((p) => p.stock !== 0))))
      .catch(() => setProducts([]));
  }, []);

  // Keep filters in the URL so links like /shop?section=Silver work and Back restores them
  const setFilter = (key, value) => {
    const q = { ...router.query, [key]: value };
    if (value === 'All') delete q[key];
    router.replace({ pathname: '/shop', query: q }, undefined, { shallow: true, scroll: false });
  };

  const byAudience = useMemo(() => {
    if (!products) return [];
    // Products without a gender (e.g. Divine) are for everyone
    let list = audience === 'All' ? products : products.filter((p) => !p.gender || p.gender === audience);
    if (maxPrice) list = list.filter((p) => p.price && p.price <= maxPrice);
    return list;
  }, [products, audience, maxPrice]);

  const sections = useMemo(() => {
    const counts = {};
    byAudience.forEach((p) => {
      const s = sectionOf(p);
      (counts[s] ||= []).push(p);
    });
    return Object.keys(counts)
      .sort((a, b) => (SECTION_ORDER.indexOf(a) + 1 || 99) - (SECTION_ORDER.indexOf(b) + 1 || 99))
      .map((s) => ({ key: s, items: counts[s] }));
  }, [byAudience]);

  const visible = useMemo(() => {
    let list = section === 'All' ? byAudience : byAudience.filter((p) => sectionOf(p) === section);
    const term = query.trim().toLowerCase();
    if (term) list = list.filter((p) => `${p.name} ${p.description || ''} ${p.category || ''}`.toLowerCase().includes(term));
    if (sort === 'low') list = [...list].sort((a, b) => (a.price || 0) - (b.price || 0));
    if (sort === 'high') list = [...list].sort((a, b) => (b.price || 0) - (a.price || 0));
    return list;
  }, [byAudience, section, query, sort]);

  const showShelves = section === 'All' && !query.trim() && sort === 'featured';

  return (
    <>
      <Head>
        <title>Shop Jewellery Online | Varaha Jewels™</title>
        <meta name="description" content="Shop Heritage necklace sets, Kundan, 925 silver and Divine Rudraksha malas from Varaha Jewels. Cash on delivery available." />
      </Head>
      <Header />

      <main className="min-h-screen bg-warm-sand pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Title + search */}
          <div className="pt-8 md:pt-12 flex flex-col md:flex-row md:items-end justify-between gap-5">
            <div>
              <h1 className="font-royal font-bold text-5xl md:text-6xl text-heritage leading-none">Shop</h1>
              <p className="mt-3 text-heritage/70">
                {products ? `${byAudience.length} pieces ready to ship${maxPrice ? ` under ₹${maxPrice.toLocaleString('en-IN')}` : ''}` : 'Loading pieces…'}
                {maxPrice && (
                  <button onClick={() => setFilter('max', 'All')} className="ml-3 text-sm font-semibold text-copper underline underline-offset-4">
                    Any price
                  </button>
                )}
              </p>
            </div>
            <label className="relative w-full md:w-80">
              <span className="sr-only">Search jewellery</span>
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-heritage/45" size={18} />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search kundan, pendant, mala…"
                className="w-full h-12 pl-11 pr-10 rounded-full bg-white border border-heritage/15 text-heritage placeholder:text-heritage/40 focus:outline-none focus:border-copper focus:ring-2 focus:ring-copper/20"
              />
              {query && (
                <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-heritage/50 hover:text-heritage" aria-label="Clear search">
                  <X size={16} />
                </button>
              )}
            </label>
          </div>

          {/* Section chips */}
          <div className="-mx-4 px-4 sm:mx-0 sm:px-0 mt-8 py-3 border-b border-heritage/10">
            <div className="flex gap-2.5 overflow-x-auto scrollbar-hide" role="tablist" aria-label="Sections">
              <Chip active={section === 'All'} onClick={() => setFilter('section', 'All')} label="All" count={byAudience.length} />
              {sections.map((s) => (
                <Chip
                  key={s.key}
                  active={section === s.key}
                  onClick={() => setFilter('section', s.key)}
                  label={labelOf(s.key)}
                  count={s.items.length}
                  image={s.items[0]?.image}
                />
              ))}
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex p-1 rounded-full bg-white border border-heritage/10 text-sm" role="group" aria-label="Shop for">
                {['All', 'Women', 'Men'].map((a) => (
                  <button
                    key={a}
                    onClick={() => setFilter('for', a)}
                    aria-pressed={audience === a}
                    className={`px-3 sm:px-4 py-1.5 rounded-full font-medium transition-colors ${audience === a ? 'bg-heritage text-warm-sand' : 'text-heritage/75 hover:text-heritage'}`}
                  >
                    {a === 'All' ? 'Everyone' : a}
                  </button>
                ))}
              </div>
              <label className="text-sm text-heritage/70 flex items-center gap-2">
                <span className="hidden sm:inline">Sort</span>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="h-9 pl-3 pr-8 rounded-full bg-white border border-heritage/15 text-heritage focus:outline-none focus:border-copper"
                >
                  <option value="featured">Featured</option>
                  <option value="low">Price: low first</option>
                  <option value="high">Price: high first</option>
                </select>
              </label>
            </div>
          </div>

          {/* Results */}
          <div className="mt-8">
            {products === null ? (
              <Grid>{Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)}</Grid>
            ) : visible.length === 0 ? (
              <div className="py-20 text-center">
                <p className="font-royal text-3xl text-heritage">Nothing matches “{query || labelOf(section)}”</p>
                <p className="mt-2 text-heritage/70">Try a shorter word, or look through every section.</p>
                <button onClick={() => { setQuery(''); setFilter('section', 'All'); }} className="mt-6 px-6 py-3 rounded-full bg-heritage text-warm-sand font-semibold hover:bg-copper transition-colors">
                  Show all pieces
                </button>
              </div>
            ) : showShelves ? (
              <div className="space-y-14">
                {sections.map((s) => (
                  <section key={s.key} aria-labelledby={`shelf-${s.key}`}>
                    <div className="flex items-baseline justify-between gap-4 mb-5">
                      <h2 id={`shelf-${s.key}`} className="font-royal font-bold text-3xl md:text-4xl text-heritage">
                        {labelOf(s.key)} <span className="font-sans font-normal text-base text-heritage/50">{s.items.length}</span>
                      </h2>
                      {s.items.length > SHELF_SIZE && (
                        <button onClick={() => { setFilter('section', s.key); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="text-sm font-semibold text-copper hover:text-heritage underline underline-offset-4">
                          See all {s.items.length}
                        </button>
                      )}
                    </div>
                    <Grid>{s.items.slice(0, SHELF_SIZE).map((p) => <MarketCard key={p.id} product={p} />)}</Grid>
                  </section>
                ))}
              </div>
            ) : (
              <Grid>{visible.map((p) => <MarketCard key={p.id} product={p} />)}</Grid>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

function Grid({ children }) {
  return <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-3 gap-y-8 md:gap-x-6 md:gap-y-10">{children}</div>;
}

function Chip({ active, onClick, label, count, image }) {
  return (
    <button
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`flex-shrink-0 inline-flex items-center gap-2 h-11 rounded-full border transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-copper ${image ? 'pl-1 pr-4' : 'px-4'} ${active ? 'bg-heritage border-heritage text-warm-sand' : 'bg-white border-heritage/15 text-heritage hover:border-copper'}`}
    >
      {image && (
        <span className="relative w-9 h-9 rounded-full overflow-hidden bg-ivory-smoke">
          <Image src={image} alt="" fill sizes="36px" className="object-cover" />
        </span>
      )}
      <span className="font-medium text-sm whitespace-nowrap">{label}</span>
      <span className={`text-xs tabular-nums ${active ? 'text-warm-sand/70' : 'text-heritage/45'}`}>{count}</span>
    </button>
  );
}
