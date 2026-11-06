import { useEffect, useState } from 'react';
import { cld } from '../../lib/img';
import { ChevronDown, Truck, Wallet, RotateCcw, ShieldCheck, Tag } from 'lucide-react';
import { activeOffer } from '../../lib/offers';
import { FREE_DELIVERY_MIN } from '../../lib/deliveryFees';

const inr = (n) => `₹${Math.round(Number(n) || 0).toLocaleString('en-IN')}`;

// Items + subtotal for the shipping step. On phones it folds into a bar at the top.
export default function OrderSummary({ items = [], subtotal = 0, collapsible = false }) {
  const [open, setOpen] = useState(!collapsible);
  const [offer, setOffer] = useState(null);
  useEffect(() => setOffer(activeOffer()), []);
  const count = items.reduce((s, i) => s + (i.quantity || 1), 0);

  return (
    <section className="rounded-2xl bg-white border border-heritage/10 overflow-hidden" aria-label="Order summary">
      <button
        type="button"
        onClick={() => collapsible && setOpen((v) => !v)}
        className={`w-full flex items-center justify-between gap-3 px-5 py-4 text-left ${collapsible ? '' : 'cursor-default'}`}
        aria-expanded={open}
      >
        <span className="font-royal font-bold text-xl text-heritage">
          Order summary <span className="font-sans font-normal text-sm text-heritage/50">{count} {count === 1 ? 'item' : 'items'}</span>
        </span>
        <span className="flex items-center gap-2">
          <span className="font-semibold text-heritage tabular-nums">{inr(subtotal)}</span>
          {collapsible && <ChevronDown size={18} className={`text-heritage/60 transition-transform ${open ? 'rotate-180' : ''}`} />}
        </span>
      </button>

      {open && (
        <div className="px-5 pb-5">
          <ul className="divide-y divide-heritage/5 border-t border-heritage/10">
            {items.map((item, idx) => (
              <li key={idx} className="flex gap-3 py-3">
                <span className="relative w-16 h-16 rounded-xl overflow-hidden bg-warm-sand flex-shrink-0">
                  {item.image && <img src={cld(item.image, 160)} loading="lazy" decoding="async" alt="" className="w-full h-full object-cover" />}
                  <span className="absolute top-0 right-0 min-w-[20px] h-5 px-1 rounded-bl-lg bg-heritage text-white text-[11px] font-bold flex items-center justify-center">{item.quantity}</span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm text-heritage line-clamp-2">{item.name}</span>
                  <span className="block text-xs text-heritage/50 mt-0.5">{inr(item.price)} each</span>
                </span>
                <span className="text-sm font-semibold text-heritage tabular-nums whitespace-nowrap">{inr(item.price * item.quantity)}</span>
              </li>
            ))}
          </ul>

          <div className="pt-3 border-t border-heritage/10 flex justify-between text-sm">
            <span className="text-heritage/70">Subtotal</span>
            <span className="font-semibold text-heritage tabular-nums">{inr(subtotal)}</span>
          </div>
          <p className="mt-1 text-xs text-heritage/50">Delivery, coupons and prepaid savings are added on the payment step.</p>

          {offer && (
            <p className="mt-4 flex items-start gap-2 rounded-xl bg-[#FBF3EA] border border-dashed border-copper/50 px-3 py-2.5 text-xs text-heritage">
              <Tag size={15} className="text-copper flex-shrink-0 mt-px" />
              <span><span className="font-semibold">{offer.title}:</span> use code <span className="font-mono font-bold">{offer.code}</span> on the next step for 25% off orders of ₹999+.</span>
            </p>
          )}

          <ul className="mt-4 space-y-2 text-xs text-heritage/70">
            <li className="flex items-center gap-2"><Truck size={15} className="text-copper" /> Free delivery on orders of {inr(FREE_DELIVERY_MIN)} and above</li>
            <li className="flex items-center gap-2"><Wallet size={15} className="text-copper" /> Cash on delivery available</li>
            <li className="flex items-center gap-2"><RotateCcw size={15} className="text-copper" /> 7-day returns and exchange</li>
            <li className="flex items-center gap-2"><ShieldCheck size={15} className="text-copper" /> Secure payment by UPI, card or net banking</li>
          </ul>
        </div>
      )}
    </section>
  );
}
