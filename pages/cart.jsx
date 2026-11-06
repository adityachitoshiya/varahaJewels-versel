import { useState } from 'react';
import { calcCouponDiscount, toPriceItems } from '../lib/couponCalc';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { ShoppingBag, ArrowLeft, Plus, Minus, Trash2, Heart, Tag, ArrowRight, X, ShieldCheck, RotateCcw, Truck, BadgeCheck, ChevronDown } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { FREE_DELIVERY_MIN, COD_CHARGE } from '../lib/deliveryFees';

export default function Cart() {
  const { cartItems, removeFromCart, updateQuantity, clearCart, cartCount } = useCart();
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [discount, setDiscount] = useState(0);
  const [showCoupon, setShowCoupon] = useState(false);

  const handleUpdateQuantity = (item, newQuantity) => {
    updateQuantity(item.variant?.sku, newQuantity, item.id);
  };

  const handleRemoveItem = (item) => {
    removeFromCart(item.id, item.variant.sku);
  };

  const handleMoveToWishlist = (item) => {
    // Get existing wishlist
    const savedWishlist = localStorage.getItem('wishlist');
    const wishlist = savedWishlist ? JSON.parse(savedWishlist) : [];

    // Add to wishlist if not already there
    if (!wishlist.find(w => w.id === item.productId || w.id === item.id)) {
      wishlist.push({
        id: item.productId || item.id,
        productName: item.productName || item.name
      });
      localStorage.setItem('wishlist', JSON.stringify(wishlist));
    }

    // Remove from cart
    handleRemoveItem(item);
  };

  const handleApplyCoupon = async () => {
    setCouponError('');
    setAppliedCoupon(null);
    setDiscount(0);

    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code');
      return;
    }

    try {
      const { getApiUrl } = require('../lib/config');
      const API_URL = getApiUrl();
      const res = await fetch(`${API_URL}/api/coupons/param/${couponCode.trim()}`);

      if (res.ok) {
        const data = await res.json();
        setAppliedCoupon(data.code);
        setDiscount(data.discount_value);
        // Note: Logic below needs to handle percentage vs fixed based on data.discount_type
        // For now, let's store the full coupon object
        window.localStorage.setItem('temp_coupon', JSON.stringify(data));
      } else {
        const err = await res.json();
        setCouponError(err.detail || 'Invalid coupon code');
      }
    } catch (error) {
      setCouponError('Failed to apply coupon');
      console.error(error);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setDiscount(0);
    setCouponCode('');
    setCouponError('');
  };

  const handleClearCart = () => {
    if (confirm('Are you sure you want to clear your cart?')) {
      clearCart();
      handleRemoveCoupon();
    }
  };

  // Calculate totals
  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => sum + ((item.element?.price || item.variant?.price || 0) * item.quantity), 0);

  let discountAmount = 0;
  if (appliedCoupon) {
    // Check localStorage for coupon details since we only stored code in state
    // ideal refactor: store full coupon object in state
    const savedCoupon = typeof window !== 'undefined' ? JSON.parse(window.localStorage.getItem('temp_coupon') || '{}') : {};

    if (savedCoupon.code === appliedCoupon) {
      // Same formula as the server (incl. BOGO + max cap)
      discountAmount = calcCouponDiscount(savedCoupon, toPriceItems(cartItems), subtotal);
    }
  }

  const total = subtotal - discountAmount;

  const inr = (n) => `₹${Math.round(n).toLocaleString('en-IN')}`;
  const itemCount = cartItems.reduce((n, i) => n + i.quantity, 0);
  const toFree = Math.max(0, FREE_DELIVERY_MIN - total);
  const hasSoldOut = cartItems.some((i) => i.stock !== undefined && i.stock <= 0);

  return (
    <>
      <Head>
        <title>Shopping Cart - Varaha Jewels™</title>
        <meta name="description" content="Review your shopping cart and proceed to checkout" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <Header cartCount={cartCount} />

      <main className="min-h-screen bg-warm-sand/40 pt-6 pb-44 lg:pb-16 lg:pt-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <Link href="/shop" className="inline-flex items-center gap-2 text-sm font-semibold text-heritage hover:text-copper">
            <ArrowLeft size={16} /> Continue shopping
          </Link>
          <div className="mt-3 flex items-end justify-between gap-4">
            <h1 className="font-royal font-bold text-4xl sm:text-5xl text-heritage leading-none">Your cart</h1>
            {cartItems.length > 0 && (
              <button onClick={handleClearCart} className="text-sm font-medium text-heritage/55 hover:text-red-600 underline underline-offset-4">Clear cart</button>
            )}
          </div>
          {cartItems.length > 0 && (
            <p className="mt-2 text-heritage/60">{itemCount} {itemCount === 1 ? 'piece' : 'pieces'} waiting for you</p>
          )}

          {!cartItems || cartItems.length === 0 ? (
            <div className="mt-8 rounded-3xl bg-white border border-heritage/10 px-6 py-14 sm:py-20 text-center">
              <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-warm-sand text-copper"><ShoppingBag size={34} /></span>
              <h2 className="mt-6 font-royal font-bold text-3xl text-heritage">Your cart is empty</h2>
              <p className="mt-2 text-heritage/65 max-w-md mx-auto">Pieces you add will wait here. Start with our Heritage sets, made for weddings and festivals.</p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/heritage" className="inline-flex items-center justify-center gap-2 h-12 px-8 rounded-full bg-heritage text-white font-semibold hover:bg-copper transition-colors">See Heritage</Link>
                <Link href="/shop" className="inline-flex items-center justify-center gap-2 h-12 px-8 rounded-full border border-heritage/25 text-heritage font-semibold hover:bg-heritage hover:text-white transition-colors">Browse everything</Link>
              </div>
              <Link href="/wishlist" className="mt-6 inline-flex items-center gap-2 text-sm text-copper font-semibold"><Heart size={16} /> View your wishlist</Link>
            </div>
          ) : (
            <div className="mt-6 grid lg:grid-cols-12 gap-6 lg:gap-8 items-start">
              {/* Items */}
              <div className="lg:col-span-7 space-y-4">
                {/* Delivery nudge */}
                <div className="rounded-2xl bg-white border border-heritage/10 px-4 py-3.5">
                  <div className="flex items-center gap-3 text-sm text-heritage">
                    <Truck size={18} className="text-copper flex-shrink-0" />
                    {toFree > 0
                      ? <p>Add <b>{inr(toFree)}</b> more to skip the {inr(COD_CHARGE)} Cash on Delivery fee. Delivery is free on every order.</p>
                      : <p><b>Free delivery</b> and no Cash on Delivery fee on this order.</p>}
                  </div>
                  <div className="mt-2.5 h-1.5 rounded-full bg-heritage/10 overflow-hidden" aria-hidden="true">
                    <div className="h-full rounded-full bg-copper transition-all duration-500" style={{ width: `${Math.min(100, (total / FREE_DELIVERY_MIN) * 100)}%` }} />
                  </div>
                </div>

                {cartItems.map((item) => {
                  const isOutOfStock = item.stock !== undefined && item.stock <= 0;
                  const unit = item.variant?.price || 0;
                  return (
                    <article
                      key={item.variant?.sku || item.id}
                      className={`rounded-2xl bg-white border p-3.5 sm:p-5 ${isOutOfStock ? 'border-red-200' : 'border-heritage/10'}`}
                    >
                      <div className="flex gap-3.5 sm:gap-5">
                        <div className="relative flex-shrink-0">
                          <Image
                            src={item.variant?.image || item.image || '/varaha-assets/dp1.avif'}
                            alt={item.productName || item.name}
                            width={140}
                            height={140}
                            className={`h-24 w-24 sm:h-32 sm:w-32 object-cover rounded-xl bg-warm-sand ${isOutOfStock ? 'opacity-50' : ''}`}
                          />
                          {isOutOfStock && (
                            <span className="absolute inset-x-1 bottom-1 rounded-md bg-red-600 py-0.5 text-center text-[10px] font-bold uppercase tracking-wide text-white">Sold out</span>
                          )}
                        </div>

                        <div className="flex-1 min-w-0 flex flex-col">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <h3 className="font-royal font-bold text-lg sm:text-xl leading-snug text-heritage line-clamp-2">{item.productName || item.name}</h3>
                              {item.variant?.name && <p className="mt-0.5 text-sm text-heritage/55">{item.variant.name}</p>}
                              {isOutOfStock && <p className="mt-1 text-sm font-semibold text-red-600">No longer available</p>}
                            </div>
                            <button onClick={() => handleRemoveItem(item)} className="-m-1 p-2 text-heritage/40 hover:text-red-600" aria-label="Remove item"><X size={18} /></button>
                          </div>

                          <div className="mt-auto pt-3 flex flex-wrap items-end justify-between gap-3">
                            <div className={`inline-flex items-center rounded-full border ${isOutOfStock ? 'border-gray-200 bg-gray-50' : 'border-heritage/20'}`}>
                              <button onClick={() => handleUpdateQuantity(item, item.quantity - 1)} disabled={isOutOfStock} className="h-9 w-9 flex items-center justify-center text-copper disabled:opacity-40" aria-label="Decrease quantity"><Minus size={15} /></button>
                              <span className="min-w-[28px] text-center text-sm font-semibold tabular-nums text-heritage" aria-live="polite">{item.quantity}</span>
                              <button onClick={() => handleUpdateQuantity(item, item.quantity + 1)} disabled={isOutOfStock} className="h-9 w-9 flex items-center justify-center text-copper disabled:opacity-40" aria-label="Increase quantity"><Plus size={15} /></button>
                            </div>
                            <div className="text-right">
                              <p className={`font-royal font-bold text-2xl tabular-nums leading-none ${isOutOfStock ? 'text-gray-400 line-through' : 'text-heritage'}`}>{inr(unit * item.quantity)}</p>
                              {item.quantity > 1 && <p className="mt-1 text-xs text-heritage/50">{inr(unit)} each</p>}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="mt-3.5 pt-3 border-t border-heritage/10 flex items-center gap-5 text-sm">
                        <button onClick={() => handleMoveToWishlist(item)} className="inline-flex items-center gap-1.5 font-medium text-copper hover:text-heritage"><Heart size={15} /> Save for later</button>
                        {isOutOfStock && (
                          <button onClick={() => handleRemoveItem(item)} className="inline-flex items-center gap-1.5 font-medium text-red-600"><Trash2 size={15} /> Remove</button>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>

              {/* Summary */}
              <aside className="lg:col-span-5 lg:sticky lg:top-24">
                <div className="rounded-2xl bg-white border border-heritage/10 p-5 sm:p-6">
                  <h2 className="font-royal font-bold text-2xl text-heritage">Order summary</h2>

                  {/* Coupon */}
                  <div className="mt-4 rounded-xl border border-heritage/12 bg-warm-sand/40">
                    {appliedCoupon ? (
                      <div className="flex items-center justify-between gap-3 px-4 py-3">
                        <span className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700"><BadgeCheck size={18} /> {appliedCoupon} applied</span>
                        <button onClick={handleRemoveCoupon} className="text-sm text-heritage/60 underline underline-offset-4" aria-label="Remove coupon">Remove</button>
                      </div>
                    ) : (
                      <>
                        <button type="button" onClick={() => setShowCoupon((v) => !v)} className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-heritage" aria-expanded={showCoupon}>
                          <span className="inline-flex items-center gap-2"><Tag size={16} className="text-copper" /> Have a coupon?</span>
                          <ChevronDown size={16} className={`transition-transform ${showCoupon ? 'rotate-180' : ''}`} />
                        </button>
                        {showCoupon && (
                          <div className="px-4 pb-4">
                            <div className="flex gap-2">
                              <input
                                type="text" value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleApplyCoupon(); }}
                                placeholder="Enter code" autoCapitalize="characters"
                                className="flex-1 min-w-0 h-11 px-4 rounded-full bg-white border border-heritage/20 text-sm focus:outline-none focus:border-copper focus:ring-2 focus:ring-copper/20"
                              />
                              <button type="button" onClick={handleApplyCoupon} className="h-11 px-5 rounded-full bg-heritage text-white text-sm font-semibold hover:bg-copper transition-colors">Apply</button>
                            </div>
                            {couponError && <p role="alert" className="mt-2 text-xs text-red-600">{couponError}</p>}
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  <dl className="mt-5 space-y-3 text-[15px]">
                    <div className="flex justify-between"><dt className="text-heritage/65">Subtotal</dt><dd className="font-semibold tabular-nums text-heritage">{inr(subtotal)}</dd></div>
                    {appliedCoupon && discountAmount > 0 && (
                      <div className="flex justify-between text-emerald-700"><dt>Coupon ({appliedCoupon})</dt><dd className="font-semibold tabular-nums">-{inr(discountAmount)}</dd></div>
                    )}
                    <div className="flex justify-between"><dt className="text-heritage/65">Delivery</dt><dd className="font-semibold text-emerald-700">Free</dd></div>
                  </dl>

                  <div className="mt-5 pt-5 border-t border-heritage/10 flex items-end justify-between">
                    <div>
                      <p className="text-sm text-heritage/60">Total</p>
                      <p className="text-xs text-heritage/45">Inclusive of all taxes</p>
                    </div>
                    <p className="font-royal font-bold text-4xl tabular-nums leading-none text-heritage">{inr(total)}</p>
                  </div>

                  <Link
                    href="/checkout?fromCart=true"
                    aria-disabled={hasSoldOut}
                    className={`mt-6 hidden lg:flex h-14 items-center justify-center gap-2 rounded-full bg-heritage text-white text-lg font-bold shadow-lg hover:bg-copper transition-colors ${hasSoldOut ? 'pointer-events-none opacity-50' : ''}`}
                  >
                    Proceed to checkout <ArrowRight size={20} />
                  </Link>
                  {hasSoldOut && <p className="mt-2 text-xs text-red-600">Remove the sold out item to continue.</p>}

                  <ul className="mt-6 grid gap-2.5 text-sm text-heritage/75">
                    <li className="flex items-center gap-2.5"><ShieldCheck size={17} className="text-copper" /> Secure payment by UPI, card or net banking</li>
                    <li className="flex items-center gap-2.5"><RotateCcw size={17} className="text-copper" /> 7-day easy returns and exchange</li>
                    <li className="flex items-center gap-2.5"><BadgeCheck size={17} className="text-copper" /> 100% authentic, quality checked</li>
                  </ul>
                </div>
              </aside>
            </div>
          )}
        </div>
      </main>

      {/* Phone: checkout bar above the bottom tabs */}
      {cartItems.length > 0 && (
        <div className="lg:hidden fixed inset-x-0 z-40 bg-white border-t border-heritage/10 px-4 py-3 shadow-[0_-8px_24px_-12px_rgba(42,21,12,0.25)] bottom-[calc(3.5rem+env(safe-area-inset-bottom))] sm:bottom-[calc(4rem+env(safe-area-inset-bottom))]">
          <div className="flex items-center gap-4">
            <div className="min-w-0">
              <p className="text-xs text-heritage/55">{itemCount} {itemCount === 1 ? 'piece' : 'pieces'}</p>
              <p className="font-royal font-bold text-2xl leading-none tabular-nums text-heritage">{inr(total)}</p>
            </div>
            <Link
              href="/checkout?fromCart=true" aria-disabled={hasSoldOut}
              className={`flex-1 h-12 inline-flex items-center justify-center gap-2 rounded-full bg-heritage text-white font-bold ${hasSoldOut ? 'pointer-events-none opacity-50' : ''}`}
            >
              Checkout <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}
