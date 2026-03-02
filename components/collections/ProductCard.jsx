import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, Eye, Sparkles, ShoppingBag, Minus, Plus } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';

// Icon components for product features
const MetalIcon = ({ metal }) => {
  const colors = {
    Gold: 'text-yellow-600',
    Silver: 'text-gray-400',
    Platinum: 'text-gray-300'
  };

  return (
    <div className={`flex items-center gap-1 ${colors[metal] || 'text-heritage'}`}>
      <Sparkles className="w-3 h-3" />
      <span className="text-[10px] font-medium">{metal}</span>
    </div>
  );
};

const CaratIcon = ({ carat }) => (
  <div className="flex items-center gap-1 text-heritage">
    <span className="text-[10px] font-semibold bg-heritage/10 px-1.5 py-0.5 rounded">
      {carat}
    </span>
  </div>
);

const StoneIcon = ({ stones }) => {
  if (!stones || stones.length === 0) return null;

  return (
    <div className="flex items-center gap-1 text-copper">
      <div className="w-2 h-2 rounded-full bg-gradient-to-br from-amber-200 to-amber-400 border border-amber-600"></div>
      <span className="text-[10px] font-medium">{stones[0]}</span>
      {stones.length > 1 && (
        <span className="text-[9px] text-heritage/60">+{stones.length - 1}</span>
      )}
    </div>
  );
};

const PolishIcon = ({ polish }) => (
  <div className="flex items-center gap-1 text-heritage/70">
    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
    <span className="text-[10px]">{polish}</span>
  </div>
);

export default function ProductCard({ product, onQuickLook }) {
  const [isHovered, setIsHovered] = useState(false);
  const { addToCart, cartItems, updateQuantity, removeFromCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [addingToCart, setAddingToCart] = useState(false);

  const isWishlisted = isInWishlist(product.id);

  const handleWishlistToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product.id);
  };

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (product.stock !== undefined && product.stock <= 0) return;
    if (addingToCart) return; // Block multiple clicks

    setAddingToCart(true);
    const variant = {
      sku: `${product.id}-default`,
      price: product.price,
      name: 'Standard',
      image: product.image
    };
    await addToCart(product, variant, 1);
    setTimeout(() => setAddingToCart(false), 600);
  };

  const cartItem = cartItems.find(item => item.variant?.sku === product.id || item.productId === product.id || item.product_id === product.id);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price);
  };

  const isOutOfStock = product.stock !== undefined && product.stock <= 0;

  return (
    <Link href={`/product/${product.slug || product.id}`}>
      <div
        className="group relative bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 cursor-pointer border border-heritage/5"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* ... (Tag Badge logic unchanged) ... */}
        {product.tag && (
          <div className="absolute top-3 left-3 z-10">
            <span className={`
              inline-block px-3 py-1 text-[10px] font-semibold rounded-full backdrop-blur-md
              ${product.tag === 'Premium' ? 'bg-gradient-to-r from-yellow-600/90 to-amber-600/90 text-white' : ''}
              ${product.tag === 'New' ? 'bg-gradient-to-r from-emerald-500/90 to-teal-500/90 text-white' : ''}
              ${product.tag === 'Bestseller' ? 'bg-gradient-to-r from-rose-500/90 to-pink-500/90 text-white' : ''}
              ${product.tag === 'Trending' ? 'bg-gradient-to-r from-purple-500/90 to-indigo-500/90 text-white' : ''}
              ${product.tag === 'Limited Edition' ? 'bg-gradient-to-r from-heritage/90 to-copper/90 text-warm-sand' : ''}
              shadow-lg
            `}>
              {product.tag}
            </span>
          </div>
        )}

        {/* Wishlist Button (Top Right) */}
        <button
          onClick={handleWishlistToggle}
          className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm shadow-md flex items-center justify-center hover:scale-110 transition-transform duration-300 group/heart"
          aria-label="Add to wishlist"
        >
          <Heart
            className={`w-4 h-4 transition-all duration-300 ${isWishlisted
              ? 'fill-rose-500 text-rose-500'
              : 'text-heritage group-hover/heart:text-rose-500'
              }`}
          />
        </button>

        {/* Product Image Container */}
        <div className="relative aspect-[3/4] overflow-hidden bg-gradient-to-br from-warm-sand/30 to-ivory/50">
          {/* Primary Image */}
          <Image
            src={product.image}
            alt={product.name}
            fill
            className={`object-cover transition-all duration-700 ${isHovered ? 'scale-110 opacity-0' : 'scale-100 opacity-100'
              }`}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            priority={false}
          />

          {/* Secondary Image (shows on hover) */}
          {product.additional_images && product.additional_images.length > 0 && (
            <Image
              src={typeof product.additional_images === 'string'
                ? JSON.parse(product.additional_images)[0]
                : product.additional_images[0]
              }
              alt={`${product.name} - view 2`}
              fill
              className={`object-cover transition-all duration-700 ${isHovered ? 'scale-100 opacity-100' : 'scale-110 opacity-0'
                }`}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              priority={false}
            />
          )}

          {/* Hover Overlay - Desktop */}
          <div className={`
            absolute inset-0 bg-gradient-to-t from-heritage/60 via-heritage/20 to-transparent
            transition-opacity duration-500
            ${isHovered ? 'opacity-100' : 'opacity-0'}
          `}>
            {/* Desktop Hover Actions */}
            <div className={`
              absolute bottom-4 left-0 right-0 flex gap-2 justify-center px-4
              transition-all duration-500
              ${isHovered ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}
            `}>
              {(() => {
                if (isOutOfStock) {
                  return (
                    <button disabled className="flex-1 max-w-[140px] px-4 py-2.5 rounded-lg font-semibold text-sm bg-gray-200 text-gray-500 cursor-not-allowed flex items-center justify-center gap-2">
                      <ShoppingBag size={16} /> Sold Out
                    </button>
                  );
                }
                if (cartItem && cartItem.quantity > 0) {
                  return (
                    <div className="flex-1 max-w-[160px] flex items-center rounded-lg overflow-hidden bg-white/95 backdrop-blur-sm shadow-lg">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (cartItem.quantity <= 1) {
                            removeFromCart(cartItem.id, cartItem.variant?.sku);
                          } else {
                            updateQuantity(cartItem.variant?.sku, cartItem.quantity - 1, cartItem.id);
                          }
                        }}
                        className="px-3 py-2.5 bg-heritage text-white hover:bg-copper transition-colors"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="flex-1 text-center font-bold text-heritage text-sm bg-white">{cartItem.quantity}</span>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          updateQuantity(cartItem.variant?.sku, cartItem.quantity + 1, cartItem.id);
                        }}
                        className="px-3 py-2.5 bg-heritage text-white hover:bg-copper transition-colors"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  );
                }
                return (
                  <button
                    onClick={handleAddToCart}
                    disabled={addingToCart}
                    className={`flex-1 max-w-[140px] px-4 py-2.5 rounded-lg font-semibold text-sm transition-all duration-300 shadow-lg flex items-center justify-center gap-2
                      ${addingToCart
                        ? 'bg-copper/70 text-white cursor-wait'
                        : 'bg-white/95 backdrop-blur-sm text-heritage hover:bg-copper hover:text-white hover:shadow-xl'
                      }`}
                  >
                    {addingToCart ? (
                      <><span className="animate-spin rounded-full h-3 w-3 border-2 border-heritage border-t-transparent"></span> Adding...</>
                    ) : (
                      <><ShoppingBag size={16} /> Add to Cart</>
                    )}
                  </button>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Product Info */}
        <div className="p-4 space-y-3">
          {/* Product Name */}
          <h3 className="font-cormorant text-lg font-semibold text-heritage leading-tight group-hover:text-copper transition-colors duration-300">
            {product.name}
          </h3>

          {/* Feature Icons Row */}
          <div className="flex flex-wrap items-center gap-2.5 py-2 border-t border-b border-heritage/10">
            <MetalIcon metal={product.metal} />
            <span className="w-px h-3 bg-heritage/20"></span>
            <CaratIcon carat={product.carat} />
            {product.stones && product.stones.length > 0 && (
              <>
                <span className="w-px h-3 bg-heritage/20"></span>
                <StoneIcon stones={product.stones} />
              </>
            )}
            {product.polish && (
              <>
                <span className="w-px h-3 bg-heritage/20"></span>
                <PolishIcon polish={product.polish} />
              </>
            )}
          </div>

          {/* Price */}
          <div className="pt-1">
            {product.premium || !product.price ? (
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-yellow-600" />
                <span className="text-sm font-semibold text-heritage italic">
                  Custom Crafted
                </span>
              </div>
            ) : (
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold text-heritage font-cormorant">
                  {formatPrice(product.price)}
                </span>
                <span className="text-xs text-heritage/50 line-through">
                  {formatPrice(product.price * 1.15)}
                </span>
              </div>
            )}
          </div>

          {/* Mobile-only Actions */}
          <div className="md:hidden pt-2 border-t border-heritage/10 flex gap-2">
            {(() => {
              if (isOutOfStock) {
                return (
                  <button disabled className="flex-1 px-4 py-2.5 rounded-lg font-semibold text-sm bg-gray-200 text-gray-500 cursor-not-allowed flex items-center justify-center gap-2">
                    <ShoppingBag size={16} /> Sold Out
                  </button>
                );
              }
              if (cartItem && cartItem.quantity > 0) {
                return (
                  <div className="flex-1 flex items-center rounded-lg overflow-hidden border-2 border-heritage">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (cartItem.quantity <= 1) {
                          removeFromCart(cartItem.id, cartItem.variant?.sku);
                        } else {
                          updateQuantity(cartItem.variant?.sku, cartItem.quantity - 1, cartItem.id);
                        }
                      }}
                      className="px-4 py-2.5 bg-heritage text-white hover:bg-copper transition-colors"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="flex-1 text-center font-bold text-heritage text-sm bg-white">{cartItem.quantity}</span>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        updateQuantity(cartItem.variant?.sku, cartItem.quantity + 1, cartItem.id);
                      }}
                      className="px-4 py-2.5 bg-heritage text-white hover:bg-copper transition-colors"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                );
              }
              return (
                <button
                  onClick={handleAddToCart}
                  disabled={addingToCart}
                  className={`flex-1 px-4 py-2.5 rounded-lg font-semibold text-sm hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2
                    ${addingToCart
                      ? 'bg-copper/70 text-white cursor-wait'
                      : 'bg-gradient-to-r from-heritage to-copper text-white'
                    }`}
                >
                  {addingToCart ? (
                    <><span className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></span> Adding...</>
                  ) : (
                    <><ShoppingBag size={16} /> Add to Cart</>
                  )}
                </button>
              );
            })()}
            <button
              onClick={handleWishlistToggle}
              className={`px-3 py-2.5 rounded-lg border transition-all duration-300 ${isWishlisted ? 'bg-rose-50 border-rose-200 text-rose-500' : 'border-heritage/20 text-heritage'}`}
            >
              <Heart size={18} fill={isWishlisted ? "currentColor" : "none"} />
            </button>
          </div>
        </div>

        {/* Premium Glow Effect */}
        {product.premium && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/5 via-transparent to-amber-600/5"></div>
          </div>
        )}
      </div>
    </Link>
  );
}
