import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingBag, Check, Copy } from 'lucide-react';
import { getApiUrl, getAuthHeaders } from '../../lib/config';
import ShimmerImage from '../ShimmerImage';
import { MENU } from '../CollectionsMenu';
import { useHomeProducts } from './ProductHome';
import { useCart } from '../../context/CartContext';
import { formatINR, parseList } from '../../lib/products';
import { activeOffer, lastDayLabel, OFFER_TERMS } from '../../lib/offers';

// Product-first hero: the CMS banner slides (Admin > CMS) on the left, and two
// live product tiles on the right: the best real deal (Add to cart right
// here) and the newest collection. On phones the tiles sit under the banner.

const defaultSlides = [
  { id: 1, image: '/varaha-assets/heroimage.avif', title: 'Timeless Elegance', subtitle: 'Heritage-inspired pieces crafted with tradition and artistry', link_text: 'Shop now', link_url: '/shop' },
  { id: 2, image: '/varaha-assets/Jimage2.avif', title: 'Royal Heritage', subtitle: "Pieces that celebrate India's rich cultural legacy", link_text: 'Shop now', link_url: '/shop' },
  { id: 3, image: '/varaha-assets/Jimage3.webp', title: 'Artisan Excellence', subtitle: 'Every piece finished by hand', link_text: 'Shop now', link_url: '/shop' },
];

const SLIDE_MS = 6000;
const MAX_SLIDES = 6;
const MIN_DEAL_PRICE = 199; // keep test/placeholder items (e.g. ₹10) out of the deal tile

// Old CMS slides point at /collections/... pages that do not exist
const fixLink = (url) => (!url || url.startsWith('/collections') ? '/shop' : url);

// One slide per collection that has stock, using that collection's best photo
// (the piece with the most photos, newest first). Falls back to the CMS slides.
function collectionSlides(products) {
  return MENU.find((g) => g.key === 'collections').links
    .map((l) => {
      const items = products.filter((p) => l.match(p) && p.image);
      if (!items.length) return null;
      const hero = [...items].sort((a, b) =>
        (parseList(b.additional_images).length - parseList(a.additional_images).length) ||
        String(b.id).localeCompare(String(a.id), undefined, { numeric: true }))[0];
      const priced = items.filter((p) => p.price);
      const from = priced.length ? Math.min(...priced.map((p) => p.price)) : null;
      return {
        id: `c-${l.label}`,
        image: hero.image,
        title: l.label,
        subtitle: `${l.note}${from ? `, from ${formatINR(from)}` : ''}`,
        link_text: `Shop ${l.label.toLowerCase()}`,
        link_url: l.href,
      };
    })
    .filter(Boolean)
    .slice(0, MAX_SLIDES); // Bridal/Minimal repeat pieces from the sections above
}

export default function HeroSection({ initialSlides }) {
  const products = useHomeProducts();
  const [cmsSlides, setSlides] = useState(initialSlides?.length ? initialSlides : defaultSlides);
  const fromProducts = products ? collectionSlides(products) : null;
  // While products load, show the dark banner without text instead of flashing the old photos
  const baseSlides = fromProducts === null ? [] : fromProducts.length ? fromProducts : cmsSlides;
  const offer = useActiveOffer();
  const slides = offer && baseSlides.length ? [offerSlide(offer, products, baseSlides), ...baseSlides] : baseSlides;
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);

  useEffect(() => {
    if (initialSlides?.length) return;
    fetch(`${getApiUrl()}/api/content/hero`, { headers: getAuthHeaders() })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => data?.length && setSlides(data))
      .catch(() => {});
  }, [initialSlides]);

  useEffect(() => {
    if (paused || termsOpen || slides.length <= 1) return;
    const t = setTimeout(() => setCurrent((i) => (i + 1) % slides.length), SLIDE_MS);
    return () => clearTimeout(t);
  }, [current, paused, termsOpen, slides.length]);

  // Swipe on phones
  const touchX = useRef(null);
  const onTouchEnd = (e) => {
    if (touchX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    if (Math.abs(dx) > 50) setCurrent((i) => (i + (dx < 0 ? 1 : -1) + slides.length) % slides.length);
    touchX.current = null;
  };

  const slide = slides[current % (slides.length || 1)];

  const dots = slides.length > 1 && (
    <div className="flex items-center" role="tablist" aria-label="Slides">
      {slides.map((s, i) => (
        // Tap area stays 44px tall (globals.css touch rule); only the inner dot is visible
        <button
          key={s.id ?? i}
          role="tab"
          aria-selected={i === current}
          aria-label={`Slide ${i + 1}: ${s.title || ''}`}
          onClick={() => setCurrent(i)}
          className={`group h-11 !min-w-0 flex items-center justify-center bg-transparent ${i === current ? 'w-9' : 'w-5'}`}
        >
          <span className={`block h-2 rounded-full transition-all duration-300 ${i === current ? 'w-6 bg-[#FBF3EA]' : 'w-2 bg-[#FBF3EA]/50 group-hover:bg-[#FBF3EA]/80'}`} />
        </button>
      ))}
    </div>
  );


  return (
    <section className="hero bg-warm-sand pt-3 md:pt-6" aria-label="Featured">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 grid lg:grid-cols-3 gap-3 md:gap-5">
        {/* Banner slideshow */}
        <div
          className="relative lg:col-span-2 h-[440px] sm:h-[480px] lg:h-[560px] rounded-3xl overflow-hidden bg-[#2a150c]"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onTouchStart={(e) => { touchX.current = e.touches[0].clientX; }}
          onTouchEnd={onTouchEnd}
          aria-roledescription="carousel"
        >
          {slides.map((s, i) => (
            <div key={s.id ?? i} className={`absolute inset-0 transition-opacity duration-700 ${i === current ? 'opacity-100' : 'opacity-0'}`} aria-hidden={i !== current}>
              {(i === current || i === (current + 1) % slides.length) && (
                <>
                  <div className="md:hidden w-full h-full">
                    <ShimmerImage src={s.mobile_image && s.mobile_image !== 'None' ? s.mobile_image : s.image} alt={s.title || ''} className="w-full h-full object-cover object-[50%_30%]" priority={i === 0} quality={65} sizes="100vw" />
                  </div>
                  <div className="hidden md:block w-full h-full">
                    <ShimmerImage src={s.image} alt={s.title || ''} className="w-full h-full object-cover object-[50%_30%]" priority={i === 0} quality={75} sizes="(max-width: 1024px) 100vw, 66vw" />
                  </div>
                </>
              )}
            </div>
          ))}
          <div className={`absolute inset-0 pointer-events-none bg-gradient-to-t ${slide?.offer ? 'from-[#2a150c]/95 via-[#2a150c]/55 to-[#2a150c]/20' : 'from-[#2a150c]/85 via-[#2a150c]/15 to-transparent'}`} />

          {slide?.offer && (
            <OfferSlideContent offer={slide.offer} dots={dots} termsOpen={termsOpen} setTermsOpen={setTermsOpen} />
          )}
          {slide && !slide.offer && (
            <div className="absolute inset-x-0 bottom-0 p-6 sm:p-9 lg:p-11 text-[#FBF3EA]">
              <h1 className="font-royal font-semibold text-[2.6rem] sm:text-6xl lg:text-7xl leading-[0.98] max-w-[14ch]">{slide.title}</h1>
              {slide.subtitle && <p className="mt-3 text-[15px] sm:text-lg text-[#F4E6D8]/85 max-w-md">{slide.subtitle}</p>}
              <div className="mt-6 flex items-center justify-between gap-4">
                <Link
                  href={fixLink(slide.link_url)}
                  className="inline-flex flex-shrink-0 whitespace-nowrap items-center justify-center h-12 px-6 sm:px-7 rounded-full bg-[#FBF3EA] text-heritage font-bold text-sm hover:bg-[#E8C9A0] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FBF3EA]"
                >
                  {slide.link_text && slide.link_text !== 'Explore Collections' ? slide.link_text : 'Shop now'}
                </Link>
                {dots}
              </div>
            </div>
          )}
        </div>

        {/* Live product tiles */}
        <div className="grid grid-cols-2 lg:grid-cols-1 lg:grid-rows-2 gap-3 md:gap-5 lg:h-[560px]">
          <DealTile />
          <NewCollectionTile />
        </div>
      </div>
    </section>
  );
}

function DealTile() {
  const products = useHomeProducts();
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);

  const off = (p) => (p.mrp > p.price ? 1 - p.price / p.mrp : 0);
  const deal = products
    ?.filter((p) => p.price >= MIN_DEAL_PRICE && p.image && off(p) > 0)
    .sort((a, b) => off(b) - off(a))[0];

  if (!products) return <div className="rounded-3xl bg-heritage/10 animate-pulse min-h-[260px]" />;
  if (!deal) return <NewCollectionTile index={1} />;

  const pct = Math.round(off(deal) * 100);
  const href = `/product/${deal.slug || deal.id}`;
  const add = async () => {
    await addToCart(deal, { sku: `${deal.id}-default`, price: deal.price, name: 'Standard', image: deal.image }, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="group relative flex flex-col rounded-3xl overflow-hidden bg-white min-h-[260px]">
      <Link href={href} prefetch={false} aria-label={deal.name} className="relative flex-1 min-h-[150px] block focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-copper">
        <Image src={deal.image} alt={deal.name} fill sizes="(max-width: 1024px) 50vw, 33vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
        <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-royal-orange text-white text-xs font-bold">Deal of the day</span>
      </Link>
      <div className="p-3 sm:p-4 lg:p-5 lg:flex lg:items-end lg:justify-between lg:gap-4">
        <div className="min-w-0">
          <Link href={href} prefetch={false} className="block font-royal font-semibold text-heritage text-[15px] sm:text-lg leading-snug line-clamp-1 hover:text-copper">{deal.name}</Link>
          <p className="mt-0.5 flex items-baseline flex-wrap gap-x-2">
            <span className="font-semibold text-heritage tabular-nums">{formatINR(deal.price)}</span>
            <span className="text-xs sm:text-sm text-heritage/40 line-through tabular-nums">{formatINR(deal.mrp)}</span>
            <span className="text-xs sm:text-sm font-semibold text-emerald-700">{pct}% off</span>
          </p>
        </div>
        <button
          onClick={add}
          className="mt-2 lg:mt-0 w-full lg:w-auto flex-shrink-0 inline-flex items-center justify-center gap-1.5 h-9 sm:h-10 px-4 rounded-full bg-heritage text-warm-sand text-xs sm:text-sm font-semibold hover:bg-copper transition-colors"
        >
          {added ? <><Check size={15} /> Added</> : <><ShoppingBag size={15} /> Add</>}
        </button>
      </div>
    </div>
  );
}

// Newest collection that has stock, with its starting price
function NewCollectionTile({ index = 0 }) {
  const products = useHomeProducts();
  if (!products) return <div className="rounded-3xl bg-heritage/10 animate-pulse min-h-[260px]" />;

  const tiles = MENU.find((g) => g.key === 'collections').links
    .map((l) => {
      const items = products.filter(l.match);
      const newest = items.reduce((a, b) => (String(b.id).localeCompare(String(a?.id || ''), undefined, { numeric: true }) > 0 ? b : a), null);
      return { ...l, items, newest, from: items.length ? Math.min(...items.filter((p) => p.price).map((p) => p.price)) : null };
    })
    .filter((t) => t.items.length && t.newest?.image)
    .sort((a, b) => String(b.newest.id).localeCompare(String(a.newest.id), undefined, { numeric: true }));
  const t = tiles[index] || tiles[0];
  if (!t) return null;

  return (
    <Link href={t.href} prefetch={false} className="group relative rounded-3xl overflow-hidden bg-heritage min-h-[260px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-copper">
      <Image src={t.newest.image} alt="" fill sizes="(max-width: 1024px) 50vw, 33vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
      <span className="absolute inset-0 bg-gradient-to-t from-[#2a150c]/90 via-[#2a150c]/20 to-transparent" />
      <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-[#FBF3EA] text-heritage text-xs font-bold">New in</span>
      <span className="absolute inset-x-0 bottom-0 p-4 lg:p-6 text-[#FBF3EA]">
        <span className="block font-royal font-semibold text-2xl lg:text-4xl leading-none">{t.label}</span>
        <span className="block mt-1.5 text-xs sm:text-sm text-[#F4E6D8]/85">{t.items.length} pieces{t.from ? `, from ${formatINR(t.from)}` : ''}</span>
      </span>
    </Link>
  );
}

// Festival offer (dates in lib/offers.js). Checked after mount and every
// minute, so it uses the visitor's clock and switches at midnight by itself.
function useActiveOffer() {
  const [offer, setOffer] = useState(null);
  useEffect(() => {
    const tick = () => setOffer(activeOffer());
    tick();
    const t = setInterval(tick, 60 * 1000);
    return () => clearInterval(t);
  }, []);
  return offer;
}

// Offer slide photo: a Heritage piece that is not already used by another slide
function offerSlide(offer, products, baseSlides) {
  const used = new Set(baseSlides.map((b) => b.image));
  const heritage = (products || []).filter((p) => p.category === 'Heritage' && p.image);
  const pick = heritage.find((p) => !used.has(p.image)) || heritage[0];
  return { id: `offer-${offer.id}`, offer, title: offer.title, image: pick?.image || baseSlides[0]?.image };
}

function OfferSlideContent({ offer, dots, termsOpen, setTermsOpen }) {
  const [copied, setCopied] = useState(false);
  const { percent, minOrder, maxOff } = OFFER_TERMS;
  const copy = async () => {
    try { await navigator.clipboard.writeText(offer.code); } catch {}
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-9 lg:p-11 text-[#FBF3EA]">
      <p className="inline-flex w-fit items-center px-3 py-1.5 rounded-full bg-royal-orange text-white text-xs sm:text-sm font-bold">{offer.title}</p>
      <h1 className="mt-3 font-royal font-bold leading-[0.9] text-[#E8C9A0]">
        <span className="text-7xl sm:text-8xl lg:text-9xl tabular-nums">{percent}%</span>
        <span className="text-4xl sm:text-5xl lg:text-6xl"> off</span>
      </h1>
      <p className="mt-3 text-[15px] sm:text-lg text-[#F4E6D8]/90 max-w-md">
        On everything. Ends {lastDayLabel(offer)}.{' '}
        <button onClick={() => setTermsOpen((v) => !v)} aria-expanded={termsOpen} className="underline underline-offset-2 text-[#E8C9A0] hover:text-white">T&amp;C apply</button>
      </p>
      {termsOpen && (
        <ul className="mt-2 text-xs sm:text-sm text-[#F4E6D8]/85 space-y-0.5 max-w-md">
          <li>{percent}% off on orders of ₹{minOrder.toLocaleString('en-IN')} or more, up to ₹{maxOff.toLocaleString('en-IN')} off.</li>
          <li>Enter code {offer.code} at checkout. One code per order.</li>
          <li>Valid until {lastDayLabel(offer)}, 11:59 pm.</li>
        </ul>
      )}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <button onClick={copy} className="inline-flex items-center gap-3 h-12 pl-4 pr-3 rounded-full border-2 border-dashed border-[#E8C9A0]/80 bg-[#2a150c]/40 hover:border-[#E8C9A0]" aria-label={`Copy code ${offer.code}`}>
            <span className="font-mono font-bold tracking-[0.12em]">{offer.code}</span>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#E8C9A0]">{copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}</span>
          </button>
          <Link href="/shop" className="inline-flex flex-shrink-0 items-center justify-center h-12 px-6 rounded-full bg-[#FBF3EA] text-heritage font-bold text-sm whitespace-nowrap hover:bg-[#E8C9A0]">Shop now</Link>
        </div>
        {dots}
      </div>
    </div>
  );
}
