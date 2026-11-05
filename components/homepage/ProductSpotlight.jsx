import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { Minus, Plus, ShoppingBag, Check, Truck, Wallet, ShieldCheck, ArrowUpRight } from 'lucide-react';
import SpotlightSkeleton from '../SpotlightSkeleton';
import { getApiUrl } from '../../lib/config';
import { useCart } from '../../context/CartContext';
import { FREE_DELIVERY_MIN } from '../../lib/deliveryFees';

// One product, bought right here: gallery + quantity + Add to cart / Buy now.
// The piece shown = first in-stock spotlight product (admin toggle); the
// "More picks" row lets shoppers switch to the other spotlight pieces.

const MAX_PICKS = 6;
const formatINR = (n) => `₹${Math.round(Number(n)).toLocaleString('en-IN')}`;
const inStock = (p) => p.stock === null || p.stock === undefined || p.stock > 0;

function parseList(v) {
  if (Array.isArray(v)) return v;
  try {
    const x = JSON.parse(v || '[]');
    return Array.isArray(x) ? x : [];
  } catch {
    return [];
  }
}

// "Heritage collection", "Silver collection"... ("Artificial" is an internal
// category name, so fall back to the collection for those)
function label(p) {
  const name = p.category && p.category !== 'Artificial' ? p.category : p.collection;
  return name ? `${name} collection` : '';
}

function cleanDescription(text) {
  if (!text) return '';
  return text
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/^\s*product\s+description\s*:?\s*/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export default function ProductSpotlight() {
  const router = useRouter();
  const { addToCart } = useCart();
  const [products, setProducts] = useState(null);
  const [active, setActive] = useState(0);
  const [photo, setPhoto] = useState(0);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    fetch(`${getApiUrl()}/api/products`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        const buyable = data.filter((p) => inStock(p) && p.price);
        const spot = buyable.filter((p) => p.is_spotlight);
        const featured = buyable.filter((p) => !p.is_spotlight && (p.tag === 'Featured' || p.tag === 'Bestseller' || p.premium));
        const rest = buyable.filter((p) => !spot.includes(p) && !featured.includes(p));
        setProducts([...spot, ...featured, ...rest].slice(0, MAX_PICKS));
      })
      .catch(() => setProducts([]));
  }, []);

  const current = products?.[active];
  const photos = useMemo(
    () => (current ? [current.image, ...parseList(current.additional_images)].filter(Boolean) : []),
    [current]
  );

  if (products === null) return <SpotlightSkeleton />;
  if (!current) return null;

  const maxQty = current.stock > 0 ? current.stock : 10;
  const showMrp = current.mrp && current.mrp > current.price;
  const offPct = showMrp ? Math.round((1 - current.price / current.mrp) * 100) : 0;
  const lowStock = current.stock > 0 && current.stock <= 5;
  const href = `/product/${current.slug || current.id}`;
  const description = cleanDescription(current.description);
  const variant = { id: `${current.id}-default`, sku: `${current.id}-default`, price: current.price, name: 'Standard', image: current.image };

  const pick = (i) => {
    setActive(i);
    setPhoto(0);
    setQty(1);
    setAdded(false);
  };

  const handleAdd = async () => {
    await addToCart(current, variant, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 2200);
  };

  const handleBuyNow = () => {
    router.push({
      pathname: '/checkout',
      query: {
        productId: current.id,
        variantId: variant.id,
        quantity: qty,
        amount: current.price * qty,
        productName: current.name,
        image: current.image,
        description: description.substring(0, 100),
      },
    });
  };

  return (
    <section className="spotlight relative bg-[#2a150c] text-[#FBF3EA] py-16 md:py-24" aria-labelledby="spotlight-title">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-8 lg:px-12">
        <div className="flex items-end justify-between gap-6 mb-8 md:mb-12">
          <h2 id="spotlight-title" className="font-royal font-semibold text-4xl sm:text-5xl md:text-6xl leading-[1.05]">
            In the spotlight
          </h2>
          <Link href="/shop" prefetch={false} className="hidden sm:inline-flex items-center gap-1.5 text-sm text-[#F4E6D8]/75 hover:text-[#FBF3EA] underline underline-offset-[6px] decoration-[#F4E6D8]/30 hover:decoration-[#FBF3EA]">
            Browse the shop <ArrowUpRight size={15} />
          </Link>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 lg:gap-14">
          {/* Gallery */}
          <div className="lg:col-span-7 flex flex-col-reverse sm:flex-row gap-3 sm:gap-4">
            {photos.length > 1 && (
              <div className="flex sm:flex-col gap-2.5 sm:w-[76px] flex-shrink-0 overflow-x-auto sm:overflow-visible scrollbar-hide">
                {photos.slice(0, 5).map((src, i) => (
                  <button
                    key={src}
                    onClick={() => setPhoto(i)}
                    className={`relative w-[64px] h-[80px] sm:w-[76px] sm:h-[95px] flex-shrink-0 rounded-xl overflow-hidden transition-opacity focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#E8C9A0] ${i === photo ? 'ring-2 ring-[#E8C9A0] opacity-100' : 'opacity-55 hover:opacity-90'}`}
                    aria-label={`Show photo ${i + 1}`}
                    aria-pressed={i === photo}
                  >
                    <Image src={src} alt="" fill sizes="76px" className="object-cover" />
                  </button>
                ))}
              </div>
            )}
            <Link
              href={href}
              prefetch={false}
              className="relative flex-1 aspect-[4/5] rounded-[28px] overflow-hidden bg-[#3a2014]"
              aria-label={`Open ${current.name}`}
            >
              <Image
                key={photos[photo]}
                src={photos[photo] || '/varaha-assets/logo.png'}
                alt={current.name}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover spotlight-photo"
              />
              {offPct > 0 && (
                <span className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-[#FBF3EA] text-heritage text-xs font-bold">
                  {offPct}% off
                </span>
              )}
            </Link>
          </div>

          {/* Buy panel */}
          <div className="lg:col-span-5 lg:pt-2">
            <div key={current.id} className="spotlight-in">
              {label(current) && <p className="text-sm text-[#E8C9A0]">{label(current)}</p>}
              <h3 className="mt-3 font-royal font-semibold text-3xl md:text-[2.6rem] leading-[1.12]" title={current.name}>
                <Link href={href} prefetch={false} className="hover:text-[#E8C9A0] transition-colors line-clamp-3">
                  {current.name}
                </Link>
              </h3>

              <div className="mt-6 flex items-baseline flex-wrap gap-x-3 gap-y-1">
                <span className="font-royal font-semibold text-5xl text-[#E8C9A0] tabular-nums">{formatINR(current.price)}</span>
                {showMrp && <span className="text-lg text-[#F4E6D8]/45 line-through tabular-nums">{formatINR(current.mrp)}</span>}
              </div>
              <p className="mt-1 text-xs text-[#F4E6D8]/55">Inclusive of all taxes</p>

              {lowStock && (
                <p className="mt-5 inline-flex items-center gap-2 text-sm text-[#FFB27A]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FFB27A]" />
                  Only {current.stock} left
                </p>
              )}

              {description && (
                <p className="mt-5 text-[15px] text-[#F4E6D8]/70 leading-relaxed line-clamp-3 max-w-[60ch]">{description}</p>
              )}

              {/* Quantity + actions */}
              <div className="mt-8 flex flex-wrap items-stretch gap-3">
                <div className="inline-flex items-center rounded-full border border-[#F4E6D8]/25">
                  <button
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    disabled={qty <= 1}
                    className="w-11 h-[52px] flex items-center justify-center rounded-l-full disabled:opacity-35 hover:bg-white/10"
                    aria-label="Decrease quantity"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="w-8 text-center tabular-nums font-semibold" aria-live="polite">{qty}</span>
                  <button
                    onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
                    disabled={qty >= maxQty}
                    className="w-11 h-[52px] flex items-center justify-center rounded-r-full disabled:opacity-35 hover:bg-white/10"
                    aria-label="Increase quantity"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <button
                  onClick={handleAdd}
                  className="flex-1 min-w-[150px] h-[52px] inline-flex items-center justify-center gap-2 rounded-full border border-[#E8C9A0] text-[#E8C9A0] font-semibold text-sm hover:bg-[#E8C9A0] hover:text-[#2a150c] transition-colors"
                >
                  {added ? <><Check size={17} /> Added to cart</> : <><ShoppingBag size={17} /> Add to cart</>}
                </button>
                <button
                  onClick={handleBuyNow}
                  className="w-full sm:w-auto sm:flex-1 min-w-[150px] h-[52px] rounded-full bg-[#E8C9A0] text-[#2a150c] font-bold text-sm hover:bg-[#FBF3EA] transition-colors"
                >
                  Buy now · {formatINR(current.price * qty)}
                </button>
              </div>

              <ul className="mt-8 space-y-3 text-sm text-[#F4E6D8]/75">
                <li className="flex items-center gap-3"><Truck size={17} className="text-[#E8C9A0]" /> Free delivery on orders above {formatINR(FREE_DELIVERY_MIN)}</li>
                <li className="flex items-center gap-3"><Wallet size={17} className="text-[#E8C9A0]" /> Cash on delivery available</li>
                <li className="flex items-center gap-3"><ShieldCheck size={17} className="text-[#E8C9A0]" /> Secure online payment</li>
              </ul>
            </div>
          </div>
        </div>

        {/* More picks */}
        {products.length > 1 && (
          <div className="mt-14 md:mt-16">
            <p className="font-royal text-2xl mb-4">More picks</p>
            <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 pb-1">
              {products.map((p, i) => (
                <button
                  key={p.id}
                  onClick={() => pick(i)}
                  aria-current={i === active}
                  className={`flex-shrink-0 w-[230px] flex items-center gap-3 p-2.5 pr-4 rounded-2xl text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#E8C9A0] ${i === active ? 'bg-white/10 ring-1 ring-[#E8C9A0]/60' : 'bg-white/[0.04] hover:bg-white/[0.08]'}`}
                >
                  <span className="relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-[#3a2014]">
                    <Image src={p.image || '/varaha-assets/logo.png'} alt="" fill sizes="56px" className="object-cover" />
                  </span>
                  <span className="min-w-0">
                    <span className={`block text-sm truncate ${i === active ? 'text-[#FBF3EA]' : 'text-[#F4E6D8]/65'}`}>{p.name}</span>
                    <span className="block text-xs mt-0.5 text-[#E8C9A0]/90 tabular-nums">{formatINR(p.price)}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        .spotlight .spotlight-in { animation: vjSpotIn 0.5s cubic-bezier(0.22, 1, 0.36, 1) both; }
        .spotlight .spotlight-photo { animation: vjSpotFade 0.4s ease-out both; }
        @keyframes vjSpotIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
        @keyframes vjSpotFade { from { opacity: 0.3; } to { opacity: 1; } }
        @media (prefers-reduced-motion: reduce) {
          .spotlight .spotlight-in, .spotlight .spotlight-photo { animation: none; }
        }
      `}</style>
    </section>
  );
}
