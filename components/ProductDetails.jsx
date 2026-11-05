import Link from 'next/link';
import { Truck, RotateCcw, Wallet, ShieldCheck } from 'lucide-react';
import { parseSpecs, careTips } from '../lib/productSpecs';
import { FREE_DELIVERY_MIN, COD_CHARGE } from '../lib/deliveryFees';
import MarketCard from './MarketCard';

// Full-width detail block under the gallery: description, specs table, care,
// delivery & returns, and more pieces from the same section.
export default function ProductDetails({ product, related = [] }) {
  const { specs, features, text } = parseSpecs(product.description);
  const extra = [
    product.metal && !specs.some((s) => s.label === 'Material') && { label: 'Material', value: product.metal },
    product.colour && !specs.some((s) => s.label === 'Colour') && { label: 'Colour', value: product.colour },
    product.polish && !specs.some((s) => s.label === 'Colour') && product.polish !== product.colour && { label: 'Finish', value: product.polish },
    product.carat && product.carat !== 'N/A' && { label: 'Purity', value: product.carat },
    product.category && { label: 'Collection', value: product.category },
  ].filter(Boolean);
  const table = [...specs, ...extra];

  return (
    <section id="details" className="mt-12 scroll-mt-28">
      <div className="grid lg:grid-cols-12 gap-8 lg:gap-12">
        {/* About + specs */}
        <div className="lg:col-span-7">
          <h2 className="font-royal font-bold text-3xl text-heritage">About this piece</h2>
          {text && <p className="mt-4 text-[15px] leading-relaxed text-matte-brown whitespace-pre-line max-w-[70ch]">{text}</p>}
          {features.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-2">
              {features.map((f) => (
                <li key={f} className="px-3 py-1.5 rounded-full bg-warm-sand text-sm text-heritage">{f}</li>
              ))}
            </ul>
          )}

          {table.length > 0 && (
            <dl className="mt-6 rounded-2xl border border-copper/20 overflow-hidden">
              {table.map((s, i) => (
                <div key={`${s.label}-${i}`} className={`grid grid-cols-[minmax(110px,38%)_1fr] gap-4 px-5 py-3.5 text-sm ${i % 2 ? 'bg-white' : 'bg-warm-sand/40'}`}>
                  <dt className="text-matte-brown">{s.label}</dt>
                  <dd className="text-heritage font-medium">{s.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>

        {/* Care + delivery */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-2xl bg-warm-sand/50 p-6">
            <h3 className="font-royal font-bold text-2xl text-heritage">Caring for it</h3>
            <ul className="mt-3 space-y-2.5 text-sm text-matte-brown">
              {careTips(product).map((t) => (
                <li key={t} className="flex gap-2.5"><span className="mt-2 w-1.5 h-1.5 rounded-full bg-copper flex-shrink-0" />{t}</li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-copper/20 p-6">
            <h3 className="font-royal font-bold text-2xl text-heritage">Delivery and returns</h3>
            <ul className="mt-4 space-y-3.5 text-sm text-heritage">
              <li className="flex gap-3"><Truck size={18} className="text-copper flex-shrink-0" /> Free delivery on orders of ₹{FREE_DELIVERY_MIN} and above. Check your date with your pincode above.</li>
              <li className="flex gap-3"><Wallet size={18} className="text-copper flex-shrink-0" /> Cash on delivery available. Orders under ₹{FREE_DELIVERY_MIN} paid by cash have a ₹{COD_CHARGE} fee.</li>
              <li className="flex gap-3"><RotateCcw size={18} className="text-copper flex-shrink-0" /> 7-day returns and exchange. <Link href="/shipping" className="text-copper underline underline-offset-2">Read the policy</Link></li>
              <li className="flex gap-3"><ShieldCheck size={18} className="text-copper flex-shrink-0" /> Secure payment by UPI, card or net banking.</li>
            </ul>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <div className="mt-14">
          <h2 className="font-royal font-bold text-3xl text-heritage mb-6">More like this</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-3 gap-y-8 md:gap-x-6">
            {related.map((p) => <MarketCard key={p.id} product={p} />)}
          </div>
        </div>
      )}
    </section>
  );
}
