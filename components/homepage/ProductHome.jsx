import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import MarketCard, { CardSkeleton } from '../MarketCard';
import { MENU } from '../CollectionsMenu';
import { loadProducts, isInStock } from '../../lib/products';

// Product-first homepage blocks. All share one cached /api/products request.

export function useHomeProducts() {
  const [products, setProducts] = useState(null);
  useEffect(() => {
    let alive = true;
    loadProducts().then((all) => alive && setProducts(all.filter(isInStock)));
    return () => { alive = false; };
  }, []);
  return products;
}

const collectionLinks = () => MENU.find((g) => g.key === 'collections').links;
const linkByLabel = (label) => collectionLinks().find((l) => l.label === label);
const newestFirst = (list) => [...list].sort((a, b) => String(b.id).localeCompare(String(a.id), undefined, { numeric: true }));

/* Round photo per collection, like a jeweller's tray */
export function CategoryCircles() {
  const products = useHomeProducts();
  const men = MENU.find((g) => g.key === 'men').all;
  const items = [...collectionLinks(), { ...men, label: 'Men' }]
    .map((l) => {
      const list = products ? products.filter(l.match) : [];
      return { ...l, count: list.length, image: list.find((p) => p.image)?.image };
    })
    .filter((l) => !products || l.count > 0);

  return (
    <section className="bg-warm-sand pt-8 pb-4 md:pt-12" aria-label="Shop by collection">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ul className="flex gap-4 md:gap-8 overflow-x-auto scrollbar-hide md:justify-center pb-2">
          {items.map((l) => (
            <li key={l.label} className="flex-shrink-0">
              <Link href={l.href} prefetch={false} className="group flex flex-col items-center gap-2 w-[76px] md:w-[104px] focus-visible:outline-none">
                <span className="relative w-[72px] h-[72px] md:w-[100px] md:h-[100px] rounded-full overflow-hidden bg-heritage/10 ring-2 ring-transparent ring-offset-2 ring-offset-warm-sand group-hover:ring-copper group-focus-visible:ring-copper transition-shadow">
                  {l.image && <Image src={l.image} alt="" fill sizes="100px" className="object-cover" />}
                </span>
                <span className="text-[13px] md:text-sm font-medium text-heritage text-center leading-tight">{l.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* Horizontal row of product cards with arrows on desktop */
export function ProductRail({ title, note, href, pick, limit = 12, tone = 'sand' }) {
  const products = useHomeProducts();
  const rail = useRef(null);
  const items = products ? pick(products).slice(0, limit) : null;
  if (items && items.length === 0) return null;

  const scroll = (dir) => rail.current?.scrollBy({ left: dir * rail.current.clientWidth * 0.9, behavior: 'smooth' });

  return (
    <section className={`${tone === 'ivory' ? 'bg-ivory-smoke' : 'bg-warm-sand'} py-10 md:py-14`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-4 mb-5 md:mb-7">
          <div>
            <h2 className="font-royal font-bold text-3xl md:text-[2.6rem] leading-none text-heritage">{title}</h2>
            {note && <p className="mt-2 text-sm md:text-base text-heritage/65">{note}</p>}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {href && (
              <Link href={href} prefetch={false} className="text-sm font-semibold text-copper hover:text-heritage underline underline-offset-4 mr-1 md:mr-3">
                View all
              </Link>
            )}
            <button onClick={() => scroll(-1)} className="hidden md:flex w-10 h-10 rounded-full border border-heritage/20 items-center justify-center text-heritage hover:bg-heritage hover:text-warm-sand transition-colors" aria-label={`Scroll ${title} left`}>
              <ChevronLeft size={18} />
            </button>
            <button onClick={() => scroll(1)} className="hidden md:flex w-10 h-10 rounded-full border border-heritage/20 items-center justify-center text-heritage hover:bg-heritage hover:text-warm-sand transition-colors" aria-label={`Scroll ${title} right`}>
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
        <div ref={rail} className="flex gap-3 md:gap-5 overflow-x-auto scrollbar-hide snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0 pb-2">
          {(items || Array.from({ length: 4 })).map((p, i) => (
            <div key={p?.id || i} className="snap-start flex-shrink-0 w-[46%] sm:w-[31%] lg:w-[calc(25%-15px)] flex">
              {p ? <MarketCard product={p} /> : <div className="w-full"><CardSkeleton /></div>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* Rail for one collection from the shared menu list */
export function CollectionRail({ label, title, tone }) {
  const l = linkByLabel(label);
  if (!l) return null;
  return <ProductRail title={title || l.label} note={l.note} href={l.href} pick={(ps) => newestFirst(ps.filter(l.match))} tone={tone} />;
}

/* Top picks: admin spotlight/featured first, then the biggest discounts */
export function TopPicksRail() {
  const pick = (ps) => {
    const off = (p) => (p.mrp > p.price ? 1 - p.price / p.mrp : 0);
    const flagged = ps.filter((p) => p.is_spotlight || p.premium || p.tag === 'Featured' || p.tag === 'Bestseller');
    const rest = ps.filter((p) => !flagged.includes(p) && p.price).sort((a, b) => off(b) - off(a));
    return [...flagged, ...rest];
  };
  return <ProductRail title="Top picks" note="Our favourites this week, with the best prices first" href="/shop" pick={pick} />;
}

/* Price bands linking to /shop?max= */
const BANDS = [499, 999, 1999, 2999];
export function ShopByPrice() {
  const products = useHomeProducts();
  const bands = BANDS.map((max) => ({ max, count: products ? products.filter((p) => p.price && p.price <= max).length : null }))
    .filter((b) => b.count === null || b.count > 0);
  if (products && bands.length === 0) return null;

  return (
    <section className="bg-heritage py-10 md:py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="font-royal font-bold text-3xl md:text-[2.6rem] leading-none text-warm-sand mb-6 md:mb-8">Shop by price</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
          {bands.map((b) => (
            <Link
              key={b.max}
              href={`/shop?max=${b.max}`}
              prefetch={false}
              className="group rounded-2xl border border-warm-sand/25 px-5 py-6 md:px-7 md:py-8 text-warm-sand hover:bg-warm-sand hover:text-heritage transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-warm-sand"
            >
              <span className="block text-sm opacity-75">Under</span>
              <span className="block font-royal font-bold text-4xl md:text-5xl leading-tight tabular-nums">₹{b.max.toLocaleString('en-IN')}</span>
              {b.count !== null && <span className="block mt-2 text-sm opacity-75">{b.count} pieces</span>}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/* Newest pieces as a grid */
export function JustInGrid({ limit = 12 }) {
  const products = useHomeProducts();
  const items = products ? newestFirst(products).slice(0, limit) : null;
  if (items && items.length === 0) return null;

  return (
    <section className="bg-warm-sand py-10 md:py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-4 mb-6 md:mb-8">
          <h2 className="font-royal font-bold text-3xl md:text-[2.6rem] leading-none text-heritage">Just in</h2>
          <Link href="/shop" prefetch={false} className="text-sm font-semibold text-copper hover:text-heritage underline underline-offset-4">
            See every piece
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-3 gap-y-8 md:gap-x-6 md:gap-y-10">
          {(items || Array.from({ length: 8 })).map((p, i) => (p ? <MarketCard key={p.id} product={p} /> : <CardSkeleton key={i} />))}
        </div>
      </div>
    </section>
  );
}
