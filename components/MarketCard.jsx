import Link from 'next/link';
import Image from 'next/image';
import { Heart, Minus, Plus, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { parseList, formatINR } from '../lib/products';

// Product card used on /shop and the homepage rows: photo (second photo on
// hover), price with MRP, low-stock note, and Add to cart that turns into a
// quantity stepper once the piece is in the cart.
export default function MarketCard({ product }) {
  const { addToCart, cartItems, updateQuantity } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const sku = `${product.id}-default`;
  const inCart = cartItems.find((i) => i.variant?.sku === sku || i.productId === product.id);
  const second = parseList(product.additional_images)[0];
  const showMrp = product.mrp && product.mrp > product.price;
  const offPct = showMrp ? Math.round((1 - product.price / product.mrp) * 100) : 0;
  const lowStock = product.stock > 0 && product.stock <= 5;
  const maxQty = product.stock > 0 ? product.stock : 10;
  const href = `/product/${product.slug || product.id}`;

  const add = () => addToCart(product, { sku, price: product.price, name: 'Standard', image: product.image }, 1);

  return (
    <article className="group flex flex-col w-full min-w-0">
      <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-ivory-smoke">
        <Link href={href} prefetch={false} aria-label={product.name} className="absolute inset-0">
          <Image src={product.image || '/varaha-assets/logo.png'} alt={product.name} fill sizes="(max-width: 768px) 50vw, 25vw" className="object-cover" />
          {second && (
            <Image src={second} alt="" fill sizes="(max-width: 768px) 50vw, 25vw" className="object-cover opacity-0 transition-opacity duration-500 [@media(hover:hover)]:group-hover:opacity-100" />
          )}
        </Link>
        {offPct > 0 && (
          <span className="absolute top-2.5 left-2.5 px-2 py-1 rounded-full bg-white/95 text-heritage text-[11px] font-bold">{offPct}% off</span>
        )}
        <button
          onClick={() => toggleWishlist(product.id, product.name)}
          className="absolute top-2 right-2 w-9 h-9 rounded-full bg-white/95 flex items-center justify-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-copper"
          aria-label={isInWishlist(product.id) ? 'Remove from wishlist' : 'Save to wishlist'}
          aria-pressed={isInWishlist(product.id)}
        >
          <Heart size={16} className={isInWishlist(product.id) ? 'fill-red-500 text-red-500' : 'text-heritage/70'} />
        </button>
      </div>

      <Link href={href} prefetch={false} className="mt-3 font-royal font-semibold text-[17px] md:text-lg leading-snug text-heritage line-clamp-2 hover:text-copper">
        {product.name}
      </Link>
      {product.colourCount > 1 && (
        <p className="mt-1 text-xs text-heritage/55">{product.colourCount} colours</p>
      )}

      <div className="mt-1.5 flex items-baseline flex-wrap gap-x-2">
        <span className="font-semibold text-heritage tabular-nums">{product.price ? formatINR(product.price) : 'Price on request'}</span>
        {showMrp && <span className="text-sm text-heritage/40 line-through tabular-nums">{formatINR(product.mrp)}</span>}
      </div>
      {lowStock && <p className="mt-1 text-xs font-medium text-royal-orange">Only {product.stock} left</p>}

      <div className="mt-auto pt-3">
        {!product.price ? (
          <Link href={href} prefetch={false} className="flex h-10 items-center justify-center rounded-full border border-heritage/25 text-sm font-semibold text-heritage hover:border-heritage">
            View details
          </Link>
        ) : inCart ? (
          <div className="flex h-10 items-center justify-between rounded-full bg-heritage text-warm-sand">
            <button onClick={() => updateQuantity(sku, inCart.quantity - 1, inCart.id)} className="w-10 h-10 flex items-center justify-center rounded-l-full hover:bg-white/10" aria-label="Remove one">
              <Minus size={15} />
            </button>
            <span className="text-sm font-semibold tabular-nums" aria-live="polite">{inCart.quantity} in cart</span>
            <button
              onClick={() => updateQuantity(sku, inCart.quantity + 1, inCart.id)}
              disabled={inCart.quantity >= maxQty}
              className="w-10 h-10 flex items-center justify-center rounded-r-full hover:bg-white/10 disabled:opacity-35"
              aria-label="Add one more"
            >
              <Plus size={15} />
            </button>
          </div>
        ) : (
          <button onClick={add} className="w-full h-10 inline-flex items-center justify-center gap-2 rounded-full border border-heritage/25 text-sm font-semibold text-heritage hover:bg-heritage hover:text-warm-sand hover:border-heritage transition-colors">
            <ShoppingBag size={15} /> Add to cart
          </button>
        )}
      </div>
    </article>
  );
}

export function CardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="aspect-[4/5] rounded-2xl bg-heritage/10" />
      <div className="mt-3 h-4 w-4/5 rounded bg-heritage/10" />
      <div className="mt-2 h-4 w-1/3 rounded bg-heritage/10" />
      <div className="mt-4 h-10 rounded-full bg-heritage/10" />
    </div>
  );
}
