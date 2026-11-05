import { useEffect, useState } from 'react';
import Link from 'next/link';
import { loadProducts, colourSiblings } from '../lib/products';

// "Colour" options on the product page for designs sold in several colours
// (products sharing Product.style). Each colour is its own product with its
// own stock, so a choice opens that colour's page.
export default function ColourPicker({ product, compact = false }) {
  const [siblings, setSiblings] = useState([]);

  useEffect(() => {
    let alive = true;
    if (!product?.style) { setSiblings([]); return; }
    loadProducts().then((all) => alive && setSiblings(colourSiblings(product, all)));
    return () => { alive = false; };
  }, [product?.id, product?.style]);

  if (siblings.length < 2) return null;
  const current = siblings.find((p) => p.id === product.id);

  return (
    <div className={compact ? '' : 'pb-4 border-b border-copper/20'}>
      <p className="text-sm text-heritage/70 mb-2.5">
        Colour: <span className="font-semibold text-heritage">{current?.colour || product.colour}</span>
      </p>
      <ul className="flex flex-wrap gap-2.5" aria-label="Available colours">
        {siblings.map((p) => {
          const active = p.id === product.id;
          const soldOut = p.stock === 0;
          return (
            <li key={p.id}>
              <Link
                href={`/product/${p.slug || p.id}`}
                scroll={false}
                aria-current={active ? 'true' : undefined}
                aria-label={`${p.colour}${soldOut ? ', sold out' : ''}`}
                className={`group block w-[68px] focus-visible:outline-none ${active ? 'pointer-events-none' : ''}`}
              >
                <span className={`relative block w-[68px] h-[68px] rounded-xl overflow-hidden bg-warm-sand border-2 transition-colors ${active ? 'border-heritage' : 'border-transparent group-hover:border-copper group-focus-visible:border-copper'}`}>
                  {p.image && <img src={p.image} alt="" className={`w-full h-full object-cover ${soldOut ? 'opacity-40' : ''}`} />}
                  {soldOut && <span className="absolute inset-x-0 bottom-0 bg-white/85 text-[10px] font-semibold text-heritage text-center py-0.5">Sold out</span>}
                </span>
                <span className={`mt-1 block text-[11px] leading-tight text-center ${active ? 'font-semibold text-heritage' : 'text-heritage/60'}`}>{p.colour}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
