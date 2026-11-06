import { useState, useEffect } from 'react';
import { COD_CHARGE, FREE_DELIVERY_MIN, codChargeFor } from '../lib/deliveryFees';
import { Star, Heart, ShoppingBag, Truck, RotateCcw, Shield, ChevronDown, ChevronUp, MapPin, Check, Gift, CreditCard, X, Zap, Minus, Percent, Sparkles } from 'lucide-react';
import { formatCurrency } from '../lib/productData';
import WishlistButton from './WishlistButton';
import { parseSpecs } from '../lib/productSpecs';
import ColourPicker from './ColourPicker';

import { getApiUrl } from '../lib/config';

export default function ProductInfo({ product, onAddToCart, onBuyNow, settings }) {
  const [selectedVariant, setSelectedVariant] = useState(product.variants?.[0] || {});
  const [quantity, setQuantity] = useState(1);
  const [pincode, setPincode] = useState('');
  const [deliveryInfo, setDeliveryInfo] = useState(null);
  const [showOffers, setShowOffers] = useState(true);

  // Up to 4 key facts from the description (size, material, stones, weight...)
  const highlights = (() => {
    const { specs } = parseSpecs(product.description);
    const want = ['Material', 'Fabric', 'Stones', 'Colour', 'Weight', 'In the box'];
    const picked = want.map((w) => specs.find((s) => s.label === w)).filter(Boolean);
    const size = specs.find((s) => s.label.endsWith('size'));
    const list = [...(size ? [size] : []), ...picked];
    if (!list.some((s) => s.label === 'Material') && product.metal) list.unshift({ label: 'Material', value: product.metal });
    return list.slice(0, 4);
  })();

  // Calculate discount percentage
  const originalPrice = product.mrp || selectedVariant.compareAt || selectedVariant.price * 1.15;
  const discountPercent = Math.round(((originalPrice - selectedVariant.price) / originalPrice) * 100);

  const handleAddToCart = () => {
    onAddToCart(selectedVariant, quantity);
  };

  const handleBuyNow = () => {
    onBuyNow(selectedVariant, quantity);
  };

  const checkPincode = async () => {
    if (pincode.length === 6) {
      try {
        const API_URL = getApiUrl();
        const response = await fetch(`${API_URL}/api/serviceability`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            pincode: pincode,
            weight: 0.5, // Default weight
            value: selectedVariant.price || 5000
          }),
        });

        const data = await response.json();
        console.log("CheckPincode Response:", data);

        if (data.available) {
          setDeliveryInfo({
            available: true,
            date: data.date,
            cod: data.cod,
            freeDelivery: (selectedVariant.price || 0) > 999,
            isFlash: data.is_flash || false,
            message: data.message || null
          });
        } else {
          setDeliveryInfo(null);
          // alert("Delivery not available used pincode");
        }
      } catch (error) {
        console.error("Error checking delivery:", error);
        setDeliveryInfo(null);
      }
    }
  };

  // Dynamic offers from Promotions API (database-driven)
  const [offers, setOffers] = useState([]);
  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const API_URL = getApiUrl();
        const category = product.category || '';
        const res = await fetch(`${API_URL}/api/offers?active=true${category ? `&category=${category}` : ''}`);
        if (res.ok) {
          const data = await res.json();
          setOffers(data);
        }
      } catch (e) {
        // Fallback: try old settings-based offers
        if (settings?.bank_offers_json) {
          try { setOffers(JSON.parse(settings.bank_offers_json)); } catch (_) {}
        }
      }
    };
    fetchOffers();
  }, [product.category]);

  // Dynamic mega deal settings
  const megaDealEnabled = settings?.mega_deal_enabled ?? true;
  const megaDealDiscount = settings?.mega_deal_discount_percent || 10;
  const megaDealLabel = settings?.mega_deal_label || 'MEGA DEAL';

  // Mock size options with stock
  const sizeOptions = product.variants?.length > 1
    ? product.variants.map(v => ({
      ...v,
      stockLeft: typeof product.stock === 'number' ? product.stock : 99, // real stock (was random)
      disabled: !v.inStock
    }))
    : null;

  return (
    <div className="space-y-4 px-4 lg:px-0 pb-24 lg:pb-0">
      {/* Brand & Title */}
      <div className="border-b border-copper/20 pb-4">
        <p className="text-xs uppercase tracking-[0.2em] text-copper font-semibold">
          Varaha Jewels
        </p>
        <h1 className="mt-1.5 text-2xl md:text-3xl font-royal font-bold text-heritage leading-snug">
          {product.title}
        </h1>

        {/* Rating - only when real reviews exist; hidden on mobile (shown on carousel) */}
        {product.reviewCount > 0 && (
          <div className="hidden lg:flex items-center mt-3 space-x-2">
            <div className="flex items-center bg-royal-orange text-white px-2 py-0.5 rounded text-sm font-semibold">
              <span>{Number(product.averageRating).toFixed(1)}</span>
              <Star size={12} className="ml-1 fill-white text-white" />
            </div>
            <span className="text-matte-brown text-sm border-b border-copper/40 cursor-pointer hover:text-heritage">
              {product.reviewCount} {product.reviewCount === 1 ? 'Rating' : 'Ratings'}
            </span>
          </div>
        )}
      </div>

      {/* Price Section */}
      <div className="pb-4 border-b border-copper/20">
        <div className="flex items-baseline flex-wrap">
          <span className="text-matte-brown/60 text-sm mr-2">MRP</span>
          <span className="text-base text-matte-brown/60 line-through mr-2">
            {formatCurrency(originalPrice)}
          </span>
          <span className="text-2xl font-bold text-heritage font-royal mr-2">
            {formatCurrency(selectedVariant.price)}
          </span>
          <span className="text-base font-semibold text-royal-orange">
            ({discountPercent}% OFF)
          </span>
        </div>
        <p className="text-xs text-heritage/70 mt-1">inclusive of all taxes</p>

        {/* Stock Availability Display */}
        {product.stock !== undefined && (
          <div className="mt-3">
            {product.stock === 0 ? (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-200 rounded-md">
                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                <span className="text-sm font-semibold text-red-600">Out of Stock</span>
              </div>
            ) : product.stock <= 2 ? (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-orange-50 border border-orange-200 rounded-md animate-pulse">
                <span className="text-lg">🔥</span>
                <span className="text-sm font-bold text-orange-600">
                  Hurry! Only {product.stock} left in stock - Order Now!
                </span>
              </div>
            ) : product.stock <= 5 ? (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-md">
                <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
                <span className="text-sm font-medium text-amber-700">Only {product.stock} left in stock</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-md">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span className="text-sm font-medium text-green-700">In Stock</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Colour options (same design in other colours) */}
      <ColourPicker product={product} />

      {/* Bank Offer Banner - Myntra Style (Dynamic from Admin, per-product) */}
      {megaDealEnabled && product.is_mega_deal && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="bg-yellow-400 text-yellow-900 text-[10px] font-bold px-1.5 py-0.5 rounded">{megaDealLabel}</span>
              <span className="text-sm font-semibold text-heritage">Get at {formatCurrency(selectedVariant.price * (1 - megaDealDiscount / 100))}</span>
              <span className="bg-royal-orange text-white text-xs px-2 py-0.5 rounded">Extra ₹{Math.round(selectedVariant.price * megaDealDiscount / 100)} Off</span>
            </div>
          </div>
          <div className="flex items-center justify-between mt-1.5">
            <p className="text-xs text-matte-brown">With 🏦 Bank Offer</p>
            <button className="text-xs font-semibold text-copper">Details &gt;</button>
          </div>
        </div>
      )}

      {/* Size Selector with Stock Info */}
      {sizeOptions && sizeOptions.length > 1 && (
        <div className="pb-4 border-b border-copper/20">
          <div className="flex items-center justify-between mb-3">
            <span className="text-base font-semibold text-heritage">
              Select Size
            </span>
            <button className="text-sm font-semibold text-copper hover:text-heritage flex items-center">
              Size Chart &gt;
            </button>
          </div>
          <div className="flex flex-wrap gap-3">
            {sizeOptions.map((variant) => (
              <div key={variant.id} className="flex flex-col items-center">
                <button
                  onClick={() => setSelectedVariant(variant)}
                  disabled={variant.disabled}
                  className={`w-14 h-14 rounded-full border-2 font-medium text-sm transition-all ${selectedVariant.id === variant.id
                    ? 'border-copper text-copper bg-copper/10'
                    : variant.disabled
                      ? 'border-gray-200 text-gray-300 line-through cursor-not-allowed'
                      : 'border-matte-brown/30 text-heritage hover:border-copper'
                    }`}
                >
                  {variant.name || variant.title}
                </button>
                {/* Stock indicator */}
                {!variant.disabled && variant.stockLeft < 5 && variant.stockLeft > 0 && (
                  <span className="text-[10px] text-royal-orange mt-1 font-medium">{variant.stockLeft} left</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Desktop Action Buttons - Hidden on Mobile */}
      <div className="hidden lg:flex gap-3 pb-4 border-b border-copper/20">
        <button
          onClick={handleAddToCart}
          disabled={product.stock !== undefined && product.stock <= 0}
          className="flex-[3] flex items-center justify-center gap-2 px-5 py-3.5 bg-copper hover:bg-heritage text-white font-semibold text-sm tracking-wider whitespace-nowrap rounded-lg transition-colors disabled:bg-gray-300 disabled:text-gray-600 disabled:shadow-none disabled:cursor-not-allowed shadow-lg shadow-copper/20"
        >
          <ShoppingBag size={20} />
          {product.stock !== undefined && product.stock <= 0 ? 'OUT OF STOCK' : 'ADD TO BAG'}
        </button>
        <button
          onClick={handleBuyNow}
          disabled={product.stock !== undefined && product.stock <= 0}
          className="flex-[3] flex items-center justify-center gap-2 px-5 py-3.5 bg-heritage hover:bg-copper text-white font-semibold text-sm tracking-wider whitespace-nowrap rounded-lg transition-colors disabled:bg-gray-300 disabled:text-gray-600 disabled:cursor-not-allowed"
        >
          BUY NOW
        </button>
        <WishlistButton
          productId={product.id}
          productData={{
            id: product.id,
            name: product.title,
            price: selectedVariant.price,
            image: product.images?.[0],
            title: product.title
          }}
          size="lg"
          className="flex-none w-[52px] flex items-center justify-center border border-copper/50 hover:border-copper hover:bg-copper/5 text-heritage rounded-lg transition-colors"
          showText={false}
        />
      </div>

      {/* Delivery & Services */}
      <div className="pb-4 border-b border-copper/20">
        <h3 className="text-base font-semibold text-heritage mb-3">Delivery & Services</h3>

        <div className="flex gap-2 mb-4">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Enter pincode"
              value={pincode}
              onChange={(e) => {
                setPincode(e.target.value.replace(/\D/g, '').slice(0, 6));
                if (deliveryInfo) setDeliveryInfo(null); // Reset info if user types
              }}
              className="w-full px-4 py-3 border border-copper/30 rounded-md text-sm focus:outline-none focus:border-copper bg-warm-sand/30"
            />
          </div>
          <button
            onClick={() => {
              if (deliveryInfo) {
                setDeliveryInfo(null);
                setPincode('');
              } else {
                checkPincode();
              }
            }}
            className="px-4 py-3 text-copper font-semibold text-sm hover:text-heritage transition"
          >
            {deliveryInfo ? "Change" : "Check"}
          </button>
        </div>

        {deliveryInfo ? (
          <div className="space-y-3">
            {/* Flash Delivery Banner */}
            {deliveryInfo.isFlash && (
              <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg animate-pulse">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <Zap size={18} className="text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-green-700">Flash Delivery Available</p>
                  <p className="text-xs text-green-600">{deliveryInfo.date}</p>
                </div>
              </div>
            )}
            {/* Standard Delivery Info */}
            {!deliveryInfo.isFlash && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-copper/10 rounded-full flex items-center justify-center">
                  <Truck size={16} className="text-copper" />
                </div>
                <div>
                  <p className="text-sm text-heritage">Get it by <span className="font-semibold">{deliveryInfo.date}</span></p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${deliveryInfo.cod === false ? 'bg-red-50' : 'bg-green-50'}`}>
                {deliveryInfo.cod === false ? <X size={16} className="text-red-500" /> : <Check size={16} className="text-green-600" />}
              </div>
              <p className="text-sm text-heritage">
                {deliveryInfo.cod === false
                  ? 'Pay on Delivery is not available for this pincode. You can pay online.'
                  : `Pay on Delivery available${codChargeFor(selectedVariant.price || 0) > 0 ? ` (₹${COD_CHARGE} fee on orders under ₹${FREE_DELIVERY_MIN})` : ''}`}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-copper/10 rounded-full flex items-center justify-center">
                <RotateCcw size={16} className="text-copper" />
              </div>
              <p className="text-sm text-heritage">Hassle free 7 days Return & Exchange</p>
            </div>
          </div>
        ) : (
          <p className="text-xs text-matte-brown">Please enter PIN code to check delivery time & Pay on Delivery Availability</p>
        )}
      </div>

      {/* Exclusive Offers */}
      <div className="rounded-xl border border-orange-300 overflow-hidden shadow-sm">
        {/* Header */}
        <button
          onClick={() => setShowOffers(!showOffers)}
          className="w-full flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-200"
        >
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-gray-900">Exclusive Offers</span>
            <Sparkles size={18} className="text-amber-400" />
          </div>
          {showOffers
            ? <Minus size={18} className="text-gray-500" />
            : <ChevronDown size={18} className="text-gray-500" />
          }
        </button>

        {/* Offers List */}
        {showOffers && (
          <div className="bg-white divide-y divide-gray-100">
            {offers.map((offer, index) => {
              const iconMap = {
                discount: { bg: 'bg-pink-50', el: <Percent size={18} className="text-pink-500" /> },
                upi: { bg: 'bg-green-50', el: <span className="text-base">🏦</span> },
                card: { bg: 'bg-blue-50', el: <CreditCard size={18} className="text-blue-600" /> },
                onecard: { bg: 'bg-gray-900', el: <span className="text-[10px] font-black text-white px-1.5 py-0.5">one</span> },
                mobikwik: { bg: 'bg-purple-50', el: <span className="text-base">💳</span> },
                cashback: { bg: 'bg-amber-50', el: <span className="text-base">🪙</span> },
                emi: { bg: 'bg-sky-50', el: <span className="text-base">📅</span> },
                gift: { bg: 'bg-rose-50', el: <Gift size={18} className="text-rose-500" /> },
                zap: { bg: 'bg-green-50', el: <Zap size={18} className="text-green-600" /> },
                bogo: { bg: 'bg-indigo-50', el: <span className="text-base">🔁</span> },
              };
              const ic = iconMap[offer.icon] || iconMap['discount'];
              return (
                <div key={offer.id || index} className="flex items-center gap-4 px-5 py-4">
                  <div className={`w-10 h-10 rounded-full ${ic.bg} flex items-center justify-center flex-shrink-0`}>
                    {offer.icon_url ? (
                      <img src={offer.icon_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                    ) : ic.el}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-700">
                      {offer.highlight && <span className="font-bold text-red-600">{offer.highlight} </span>}
                      {offer.title}
                      {offer.subtitle && <span className="block text-xs text-gray-500 mt-0.5">{offer.subtitle}</span>}
                    </p>
                    {offer.coupon_code && (
                      <span className="inline-block mt-1 text-[10px] font-mono font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                        Use: {offer.coupon_code}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Prepaid Discount - Auto from settings */}
            {settings?.prepaid_discount_enabled && (
              <div className="flex items-center gap-4 px-5 py-4">
                <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
                  <Zap size={18} className="text-green-600" />
                </div>
                <p className="text-sm text-gray-700">
                  <span className="font-bold text-red-600">Extra {settings.prepaid_discount_percent || 5}%</span>{' '}
                  instant discount on all UPI payments. No code required
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Highlights (full specs are in the "About this piece" section below) */}
      {highlights.length > 0 && (
        <div className="pb-4">
          <h3 className="text-base font-semibold text-heritage mb-3">Highlights</h3>
          <dl className="grid grid-cols-2 gap-3">
            {highlights.map((h) => (
              <div key={h.label} className="rounded-xl bg-warm-sand/50 px-4 py-3">
                <dt className="text-xs text-matte-brown">{h.label}</dt>
                <dd className="mt-0.5 text-sm font-medium text-heritage line-clamp-2">{h.value}</dd>
              </div>
            ))}
          </dl>
          <a href="#details" className="inline-block mt-3 text-sm font-semibold text-copper hover:text-heritage underline underline-offset-4">
            See full details and care
          </a>
        </div>
      )}

      {/* Trust Badges */}
      <div className="grid grid-cols-3 gap-4 py-4 border-t border-copper/20 bg-warm-sand/30 rounded-lg">
        <div className="text-center">
          <Shield size={24} className="mx-auto text-copper mb-1" />
          <p className="text-xs text-heritage">100% Authentic</p>
        </div>
        <div className="text-center">
          <RotateCcw size={24} className="mx-auto text-copper mb-1" />
          <p className="text-xs text-heritage">Easy Returns</p>
        </div>
        <div className="text-center">
          <Truck size={24} className="mx-auto text-copper mb-1" />
          <p className="text-xs text-heritage">Free Delivery ₹499+</p>
        </div>
      </div>
    </div>
  );
}
