/**
 * Varaha Jewels — Mobile Product Page (redesign)
 * ------------------------------------------------
 * A premium, editorial take on the mobile PDP — moving away from the
 * generic "Myntra-clone" grid toward something closer to a fine-jewelry
 * catalog: full-bleed imagery, a sheet that slides up over the hero, a
 * small gold "temple threshold" ornament used as the one repeating
 * signature motif, and a serif display face for price/title only.
 *
 * This file is a self-contained DEMO with mock data so it can be
 * previewed on its own. To wire it into your Next.js app:
 *   1. Replace the PRODUCT constant with your real `product` prop
 *      (same shape your existing ProductPage.jsx already builds).
 *   2. Replace handleAddToCart / handleBuyNow bodies with calls to
 *      your existing onAddToCart(variant, quantity) / onBuyNow(...).
 *   3. Replace checkPincode's setTimeout mock with your real
 *      POST /api/serviceability call.
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  ChevronLeft, ChevronRight, Share2, Heart, Star, Truck, RotateCcw, ShieldCheck,
  ChevronDown, ChevronUp, MapPin, Check, Percent, Sparkles,
  ShoppingBag, Zap, X, Gift, Landmark, Gem,
} from 'lucide-react';

// ---------------------------------------------------------------------
// Mock data — swap for the real product object in production
// ---------------------------------------------------------------------

// ---------------------------------------------------------------------
// Small shared pieces
// ---------------------------------------------------------------------
function OrnamentDivider({ className = '' }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="h-px flex-1 bg-amber-200" />
      <div className="h-1.5 w-1.5 rotate-45 bg-amber-500" />
      <div className="h-px flex-1 bg-amber-200" />
    </div>
  );
}

function StarRow({ rating, size = 14 }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={size}
          className={n <= Math.round(rating) ? 'fill-amber-500 text-amber-500' : 'text-stone-200'}
        />
      ))}
    </div>
  );
}


const OFFER_ICONS = {
  percent: { bg: 'bg-amber-50', el: <Percent size={17} className="text-amber-600" /> },
  gift: { bg: 'bg-rose-50', el: <Gift size={17} className="text-rose-500" /> },
  bank: { bg: 'bg-stone-100', el: <Landmark size={17} className="text-stone-600" /> },
};

// ---------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------
export default function VarahaMobileProductPage({
  product,
  offers = [],
  similarProducts = [],
  settings,
  onAddToCart,
  onBuyNow,
  onWishlistToggle,
  isWishlisted,
  onCheckPincode,
}) {
  const router = useRouter();
  const [shareNote, setShareNote] = useState('');
  const [activeImage, setActiveImage] = useState(0);

  // Back: previous page if the shopper came from inside the site, else the shop
  const goBack = () => {
    const fromSite = typeof document !== 'undefined' && document.referrer && new URL(document.referrer).origin === window.location.origin;
    if (fromSite && window.history.length > 1) router.back();
    else router.push('/shop');
  };

  // Share: phone share sheet when available, otherwise copy the link
  const shareProduct = async () => {
    const url = window.location.href.split('#')[0];
    const data = { title: product?.name || 'Varaha Jewels', text: product?.name ? `${product.name} on Varaha Jewels` : 'Varaha Jewels', url };
    try {
      if (navigator.share) { await navigator.share(data); return; }
    } catch (e) {
      if (e?.name === 'AbortError') return; // shopper closed the share sheet
    }
    let copied = false;
    try { await navigator.clipboard.writeText(url); copied = true; } catch {}
    if (!copied) {
      // Older phones: copy through a temporary text box
      const box = document.createElement('textarea');
      box.value = url; box.setAttribute('readonly', ''); box.style.cssText = 'position:fixed;opacity:0';
      document.body.appendChild(box); box.select();
      try { copied = document.execCommand('copy'); } catch {}
      box.remove();
    }
    setShareNote(copied ? 'Link copied' : url);
    setTimeout(() => setShareNote(''), 1800);
  };
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(product?.variants?.[0] || null);
  useEffect(() => { if (product?.variants?.length) setSelectedVariant(product.variants[0]); }, [product]);
  
  const [showOffers, setShowOffers] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const [pincode, setPincode] = useState('');
  const [deliveryInfo, setDeliveryInfo] = useState(null);
  const [deliveryLoading, setDeliveryLoading] = useState(false);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [touchMoved, setTouchMoved] = useState(false);
  const [pincodeError, setPincodeError] = useState('');
  const [reducedMotion, setReducedMotion] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [addedToast, setAddedToast] = useState('');
  const [toastKey, setToastKey] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(t);
  }, []);

  // Bug fix: respect prefers-reduced-motion instead of always animating
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const onChange = (e) => setReducedMotion(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // Bug fix: keyboard navigation + Escape for the lightbox (was present in the
  // original ProductCarousel.jsx but missing from the first draft of this page)
  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setLightboxOpen(false);
      if (e.key === 'ArrowRight') setActiveImage((p) => Math.min(p + 1, product.images.length - 1));
      if (e.key === 'ArrowLeft') setActiveImage((p) => Math.max(p - 1, 0));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxOpen]);

  useEffect(() => {
    if (!addedToast) return;
    const t = setTimeout(() => setAddedToast(''), 1800);
    return () => clearTimeout(t);
  }, [toastKey]);

  const discountPercent = Math.round(((product.mrp - (selectedVariant?.price || 0)) / product.mrp) * 100);

  const stockTone =
    product.stock === 0 ? 'out'
    : product.stock <= 2 ? 'urgent'
    : product.stock <= 5 ? 'low'
    : 'in';

  const stockCopy = {
    out: { wrap: 'bg-red-50 border-red-200', dot: 'bg-red-500', text: 'text-red-600', label: 'Out of stock' },
    urgent: { wrap: 'bg-orange-50 border-orange-200 animate-pulse', dot: 'bg-orange-500', text: 'text-orange-700', label: `Only ${product.stock} left — order soon` },
    low: { wrap: 'bg-amber-50 border-amber-200', dot: 'bg-amber-500', text: 'text-amber-700', label: `Only ${product.stock} left in stock` },
    in: { wrap: 'bg-emerald-50 border-emerald-200', dot: 'bg-emerald-500', text: 'text-emerald-700', label: 'In stock, ships in 24 hrs' },
  }[stockTone];

  const deliveryDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', weekday: 'short',
  });

  const handleTouchStart = (e) => {
    const x = e.targetTouches[0].clientX;
    setTouchStart(x);
    setTouchEnd(x); // fix: was leaving the previous gesture's touchEnd in place
    setTouchMoved(false);
  };
  const handleTouchMove = (e) => {
    const x = e.targetTouches[0].clientX;
    setTouchEnd(x);
    if (Math.abs(x - touchStart) > 10) setTouchMoved(true);
  };
  const handleTouchEnd = () => {
    if (touchStart - touchEnd > 60) setActiveImage((p) => Math.min(p + 1, product.images.length - 1));
    if (touchStart - touchEnd < -60) setActiveImage((p) => Math.max(p - 1, 0));
  };

  const checkPincode = async () => {
    if (pincode.length !== 6) {
      setPincodeError('Enter a valid 6-digit pincode');
      return;
    }
    setPincodeError('');
    setDeliveryLoading(true);
    if (onCheckPincode) {
      const data = await onCheckPincode(pincode);
      setDeliveryInfo(data.available ? { flash: data.is_flash, date: data.date, cod: data.cod } : null);
    }
    setDeliveryLoading(false);
  };

  const handleAddToCart = () => {
    if (!selectedVariant || !(selectedVariant?.inStock)) return;
    setAddedToast('Added to bag');
    setToastKey((k) => k + 1); // fix: forces the auto-dismiss timer to restart on repeat taps
    if (onAddToCart) onAddToCart(selectedVariant, 1);
  };

  const handleBuyNow = () => {
    if (!selectedVariant || !(selectedVariant?.inStock)) return;
    if (onBuyNow) onBuyNow(selectedVariant, 1);
  };

  return (
    <div className="mx-auto min-h-screen max-w-md bg-stone-50 font-sans">
      {/* ---------------- Hero image carousel ---------------- */}
      <div className="relative">
        <div
          className="relative aspect-square w-full overflow-hidden"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div
            className="flex h-full transition-transform duration-300 ease-out"
            style={{ transform: `translateX(-${activeImage * 100}%)` }}
          >
            {product.images.map((img) => (
              <button
                key={img.id}
                onClick={() => { if (!touchMoved) setLightboxOpen(true); }}
                aria-label="View full-size image"
                className="h-full w-full shrink-0"
                style={{ minWidth: '100%' }}
              >
                <img src={img.url || img} alt={img.alt || product?.name || 'Product Image'} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>

          {/* Floating header */}
          <div className="absolute inset-x-0 top-0 flex items-center justify-between px-4 pt-4">
            <button onClick={goBack} aria-label="Go back" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-stone-900 shadow-sm backdrop-blur">
              <ChevronLeft size={20} />
            </button>
            <div className="flex items-center gap-2">
              <span className="relative">
                <button onClick={shareProduct} aria-label="Share this product" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-stone-900 shadow-sm backdrop-blur">
                  <Share2 size={17} />
                </button>
                {shareNote && (
                  <span role="status" className="absolute right-0 top-12 whitespace-nowrap rounded-full bg-stone-900 px-3 py-1.5 text-xs font-semibold text-white shadow">{shareNote}</span>
                )}
              </span>
              <button
                onClick={() => { if (onWishlistToggle) onWishlistToggle(product.id); }}
                aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur"
              >
                <Heart size={17} className={isWishlisted ? 'fill-amber-600 text-amber-600' : 'text-stone-900'} />
              </button>
            </div>
          </div>

          {/* Discount ribbon */}
          <div className="absolute left-4 top-16 rounded-full bg-stone-900 px-3 py-1 text-xs font-semibold tracking-wide text-amber-300">
            {discountPercent}% OFF
          </div>

          {/* Dots */}
          <div className="absolute inset-x-0 bottom-4 flex justify-center gap-1.5">
            {product.images.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === activeImage ? 'w-5 bg-white' : 'w-1.5 bg-white/60'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ---------------- Overlapping info sheet ---------------- */}
      <div
        className={`relative -mt-6 rounded-t-3xl bg-white px-5 pb-6 shadow-md ${
          reducedMotion
            ? ''
            : `transition-all duration-700 ease-out ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'}`
        }`}
      >
        {/* threshold handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="flex items-center gap-2">
            <span className="h-px w-6 bg-amber-300" />
            <span className="h-1.5 w-1.5 rotate-45 bg-amber-500" />
            <span className="h-px w-6 bg-amber-300" />
          </div>
        </div>

        <p className="text-xs font-semibold uppercase tracking-widest text-amber-600">{(product.brand || 'Varaha Jewels')}</p>
        <h1 className="mt-1 font-serif text-xl font-semibold leading-snug text-stone-900">{(product.title || product.name)}</h1>

        <div className="mt-2 flex items-center gap-2">
          <StarRow rating={product.averageRating} />
          <span className="text-xs text-stone-500">{product.averageRating} · {product.reviewCount} ratings</span>
        </div>

        <div className="mt-4 flex items-baseline gap-2">
          <span className="font-serif text-3xl font-semibold text-stone-900">
            ₹{(selectedVariant?.price || 0).toLocaleString('en-IN')}
          </span>
          <span className="text-sm text-stone-400 line-through">₹{product.mrp.toLocaleString('en-IN')}</span>
          <span className="text-sm font-semibold text-emerald-700">{discountPercent}% off</span>
        </div>
        <p className="mt-0.5 text-xs text-stone-400">Inclusive of all taxes</p>

        <div className={`mt-3 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 ${stockCopy.wrap}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${stockCopy.dot}`} />
          <span className={`text-xs font-semibold ${stockCopy.text}`}>{stockCopy.label}</span>
        </div>

        {/* Variant selector */}
        <div className="mt-6">
          <p className="mb-2 text-sm font-medium text-stone-900">Select variant</p>
          <div className="flex flex-wrap gap-2">
            {product.variants.map((v) => (
              <button
                key={v.id}
                disabled={!v.inStock}
                onClick={() => setSelectedVariant(v)}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                  (selectedVariant?.id) === v.id
                    ? 'border-stone-900 bg-stone-900 text-white'
                    : v.inStock
                    ? 'border-stone-200 text-stone-700 hover:border-stone-400'
                    : 'border-stone-100 text-stone-300 line-through'
                }`}
              >
                {v.name}
              </button>
            ))}
          </div>
        </div>

        <OrnamentDivider className="my-6" />

        {/* Delivery check */}
        <div>
          <p className="mb-2 text-sm font-medium text-stone-900">Check delivery</p>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <MapPin size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-300" />
              <input
                value={pincode}
                onChange={(e) => {
                  setPincode(e.target.value.replace(/\D/g, '').slice(0, 6));
                  setDeliveryInfo(null);
                  setPincodeError('');
                }}
                placeholder="Enter pincode"
                aria-invalid={Boolean(pincodeError)}
                className={`w-full rounded-xl border bg-stone-50 py-3 pl-9 pr-3 text-sm text-stone-900 outline-none focus:border-amber-500 ${
                  pincodeError ? 'border-red-300' : 'border-stone-200'
                }`}
              />
            </div>
            <button
              onClick={checkPincode}
              className="shrink-0 rounded-xl bg-stone-900 px-5 text-sm font-semibold text-white transition active:scale-95"
            >
              {deliveryLoading ? '···' : 'Check'}
            </button>
          </div>
          {pincodeError && <p className="mt-1.5 text-xs text-red-600">{pincodeError}</p>}

          {deliveryInfo && (
            <div className="mt-4 space-y-3 rounded-2xl bg-amber-50/60 p-4">
              {deliveryInfo.flash ? (
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100">
                    <Zap size={16} className="text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-emerald-700">Flash delivery available</p>
                    <p className="text-xs text-emerald-600">Today, in 2–4 hours</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100">
                    <Truck size={16} className="text-amber-700" />
                  </div>
                  <p className="text-sm text-stone-800">
                    Delivery by <span className="font-semibold">{deliveryDate}</span>
                  </p>
                </div>
              )}
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100">
                  <Check size={16} className="text-emerald-600" />
                </div>
                <p className="text-sm text-stone-800">Pay on delivery available</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100">
                  <RotateCcw size={16} className="text-amber-700" />
                </div>
                <p className="text-sm text-stone-800">7-day hassle-free returns</p>
              </div>
            </div>
          )}
        </div>

        <OrnamentDivider className="my-6" />

        {/* Offers */}
        <div className="overflow-hidden rounded-2xl border border-amber-200">
          <button
            onClick={() => setShowOffers((s) => !s)}
            className="flex w-full items-center justify-between bg-amber-50 px-4 py-3"
          >
            <span className="flex items-center gap-2 text-sm font-semibold text-stone-900">
              <Sparkles size={16} className="text-amber-600" /> Exclusive offers
            </span>
            {showOffers ? <ChevronUp size={17} className="text-stone-500" /> : <ChevronDown size={17} className="text-stone-500" />}
          </button>
          {showOffers && (
            <div className="divide-y divide-stone-100 bg-white">
              {offers.map((offer) => {
                const ic = OFFER_ICONS[offer.icon] || OFFER_ICONS.percent;
                return (
                  <div key={offer.id} className="flex items-start gap-3 px-4 py-3">
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${ic.bg}`}>
                      {ic.el}
                    </div>
                    <div>
                      <p className="text-sm text-stone-800">{offer.title}</p>
                      {offer.subtitle && <p className="text-xs text-stone-400">{offer.subtitle}</p>}
                      {offer.code && (
                        <span className="mt-1 inline-block rounded bg-stone-100 px-2 py-0.5 font-mono text-[11px] font-semibold text-stone-600">
                          {offer.code}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Trust badges */}
        <div className="mt-6 grid grid-cols-3 gap-3 rounded-2xl bg-stone-50 py-4">
          <div className="text-center">
            <ShieldCheck size={20} className="mx-auto mb-1 text-amber-600" />
            <p className="text-[11px] text-stone-600">100% Authentic</p>
          </div>
          <div className="text-center">
            <RotateCcw size={20} className="mx-auto mb-1 text-amber-600" />
            <p className="text-[11px] text-stone-600">Easy Returns</p>
          </div>
          <div className="text-center">
            <Truck size={20} className="mx-auto mb-1 text-amber-600" />
            <p className="text-[11px] text-stone-600">Free Shipping</p>
          </div>
        </div>

        <OrnamentDivider className="my-6" />

        {/* Product details */}
        <div>
          <button
            onClick={() => setShowDetails((s) => !s)}
            className="flex w-full items-center justify-between py-1"
          >
            <span className="text-sm font-medium text-stone-900">Product details</span>
            {showDetails ? <ChevronUp size={17} className="text-amber-600" /> : <ChevronDown size={17} className="text-amber-600" />}
          </button>
          {showDetails && (
            <div className="mt-3 space-y-4">
              <p className="text-sm leading-relaxed text-stone-600">{product.description}</p>
              <div className="grid grid-cols-2 gap-y-2 text-sm">
                {product.specs.map(([label, value]) => (
                  <React.Fragment key={label}>
                    <div className="text-stone-400">{label}</div>
                    <div className="text-stone-800">{value}</div>
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}
        </div>

        <OrnamentDivider className="my-6" />

        {/* Reviews */}
        <div>
          <div className="flex items-center gap-4">
            <span className="font-serif text-3xl font-semibold text-stone-900">{product.averageRating}</span>
            <div>
              <StarRow rating={product.averageRating} size={15} />
              <p className="mt-0.5 text-xs text-stone-400">{product.reviewCount} ratings &amp; reviews</p>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            {product.reviews.map((r) => (
              <div key={r.id} className="rounded-xl bg-stone-50 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-stone-900">{r.name}</span>
                  <StarRow rating={r.rating} size={12} />
                </div>
                <p className="mt-1 text-sm text-stone-600">{r.text}</p>
              </div>
            ))}
          </div>
        </div>

        <OrnamentDivider className="my-6" />

        {/* Similar products */}
        <div>
          <p className="mb-3 text-sm font-medium text-stone-900">You may also love</p>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {similarProducts.map((p, i) => (
              <div key={p.id} className="w-28 shrink-0">
                <div className="aspect-square overflow-hidden rounded-xl">
                  <img src={p.image || p.url || "/varaha-assets/og.jpg"} alt={p.name} className="w-full h-full object-cover" />
                </div>
                <p
                  className="mt-1.5 text-xs text-stone-700"
                  style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                >
                  {p.name}
                </p>
                <p className="text-xs font-semibold text-stone-900">₹{p.price.toLocaleString('en-IN')}</p>
              </div>
            ))}
          </div>
        </div>

        {/* spacer so sticky bar never covers content */}
        <div className="h-20" />
      </div>

      {/* ---------------- Sticky buy bar ---------------- */}
      <div className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md border-t border-stone-100 bg-white/95 backdrop-blur">
        <div
          className="flex items-stretch gap-2 px-4 py-3"
          style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0px))' }}
        >
          <button
            onClick={() => { if (onWishlistToggle) onWishlistToggle(product.id); }}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-copper/20 bg-white transition active:scale-95"
          >
            <Heart size={19} className={isWishlisted ? 'fill-copper text-copper' : 'text-copper'} />
          </button>
          <button
            disabled={!selectedVariant || !(selectedVariant?.inStock)}
            onClick={handleBuyNow}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-copper/30 bg-white text-sm font-bold text-copper transition active:scale-95 disabled:opacity-40"
          >
            <Zap size={17} /> {(selectedVariant?.inStock) ? 'Buy Now' : 'Sold Out'}
          </button>
          <button
            disabled={!selectedVariant || !(selectedVariant?.inStock)}
            onClick={handleAddToCart}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-copper text-sm font-bold text-white transition active:scale-95 disabled:opacity-40"
          >
            <ShoppingBag size={17} /> {(selectedVariant?.inStock) ? 'Add to Bag' : 'Sold Out'}
          </button>
        </div>
      </div>

      {/* Added-to-bag toast */}
      {addedToast && (
        <div className="fixed inset-x-4 bottom-24 z-50 mx-auto max-w-sm rounded-xl bg-stone-900 px-4 py-2.5 text-center text-sm font-medium text-amber-200 shadow-lg">
          {addedToast}
        </div>
      )}

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/95"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            onClick={() => setLightboxOpen(false)}
            aria-label="Close image viewer"
            className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white"
          >
            <X size={20} />
          </button>

          {product.images.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); setActiveImage((p) => Math.max(p - 1, 0)); }}
              aria-label="Previous image"
              className="absolute left-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white"
            >
              <ChevronLeft size={22} />
            </button>
          )}

          <div className="h-72 w-72 overflow-hidden rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <img src={product.images[activeImage].url || product.images[activeImage]} alt={product.images[activeImage].alt || product.name} className="w-full h-full object-contain" />
          </div>

          {product.images.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); setActiveImage((p) => Math.min(p + 1, product.images.length - 1)); }}
              aria-label="Next image"
              className="absolute right-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white"
            >
              <ChevronRight size={22} />
            </button>
          )}

          {product.images.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white">
              {activeImage + 1} / {product.images.length}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
