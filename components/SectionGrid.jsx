import { useEffect, useState } from 'react';
import ProductCard from './collections/ProductCard';
import QuickLookModal from './collections/QuickLookModal';
import ProductSkeleton from './ProductSkeleton';
import { getApiUrl } from '../lib/config';
import { collapseColours } from '../lib/products';

// Product grid for one category (Heritage, Silver, Divine...).
// Shows `fallback` when the category has no in-stock products.
export default function SectionGrid({ category, title, subtitle, fallback = null }) {
  const [products, setProducts] = useState(null);
  const [quickLook, setQuickLook] = useState(null);

  useEffect(() => {
    fetch(`${getApiUrl()}/api/products?category=${encodeURIComponent(category)}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) =>
        setProducts(
          collapseColours(data)
            .filter((p) => p.stock !== 0)
            .map((p) => ({ ...p, stones: parseList(p.stones) }))
        )
      )
      .catch(() => setProducts([]));
  }, [category]);

  if (products && products.length === 0 && fallback) return fallback;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10 md:py-14">
      <div className="text-center mb-8 md:mb-12">
        <h1 className="font-royal text-3xl md:text-5xl font-bold text-heritage">{title}</h1>
        {subtitle && <p className="mt-3 text-heritage/70 text-sm md:text-base">{subtitle}</p>}
        <div className="w-24 h-0.5 bg-copper mx-auto mt-5" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
        {products === null
          ? Array.from({ length: 8 }).map((_, i) => <ProductSkeleton key={i} />)
          : products.map((p) => (
              <ProductCard key={p.id} product={p} onQuickLook={setQuickLook} />
            ))}
      </div>

      <QuickLookModal isOpen={!!quickLook} onClose={() => setQuickLook(null)} product={quickLook} />
    </section>
  );
}

function parseList(v) {
  if (Array.isArray(v)) return v;
  try {
    const parsed = JSON.parse(v || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
