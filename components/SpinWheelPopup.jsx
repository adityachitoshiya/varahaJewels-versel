import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { X, Copy, Check, Gift } from 'lucide-react';

// Spin to Win (homepage). Every prize is a real coupon on the store:
// SPIN5 / SPIN10 / SPIN15 / SPIN20, percentage off, min order ₹999, max ₹1,000 off.
// Odds are weighted; the wheel shows 8 slices.

const PRIZES = {
  SPIN5: { pct: 5, weight: 40 },
  SPIN10: { pct: 10, weight: 35 },
  SPIN15: { pct: 15, weight: 20 },
  SPIN20: { pct: 20, weight: 5 },
};
const SLICES = ['SPIN10', 'SPIN5', 'SPIN15', 'SPIN5', 'SPIN20', 'SPIN10', 'SPIN5', 'SPIN10'];
const SLICE = 360 / SLICES.length;
const MIN_ORDER = 999;
const MAX_OFF = 1000;
const SPIN_MS = 4200;
const SHOW_AFTER_MS = 60000; // 1 minute after landing on the homepage
const KEY_WON = 'spin-wheel-code';
const KEY_PLAYED = 'spin-wheel-played';
const KEY_DISMISS = 'spin-wheel-dismiss-count';
const KEY_CHIP_HIDDEN = 'spin-wheel-chip-hidden';

const COLOURS = ['#2a150c', '#A3562A', '#7A3B23', '#C8894F'];

const store = {
  get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch {} },
};

function pickPrize() {
  const total = Object.values(PRIZES).reduce((s, p) => s + p.weight, 0);
  let r = Math.random() * total;
  for (const [code, p] of Object.entries(PRIZES)) {
    if ((r -= p.weight) < 0) return code;
  }
  return 'SPIN5';
}

// SVG path for slice i of a wheel of radius r centred at (r, r), starting at the top
function slicePath(i, r) {
  const a0 = ((i * SLICE - 90) * Math.PI) / 180;
  const a1 = (((i + 1) * SLICE - 90) * Math.PI) / 180;
  const p = (a) => `${r + r * Math.cos(a)} ${r + r * Math.sin(a)}`;
  return `M ${r} ${r} L ${p(a0)} A ${r} ${r} 0 0 1 ${p(a1)} Z`;
}

export default function SpinWheelPopup({ isHomepage = false }) {
  const [open, setOpen] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [won, setWon] = useState(null);       // code won in this or an earlier visit
  const [copied, setCopied] = useState(false);
  const [chip, setChip] = useState(false);
  const dialogRef = useRef(null);

  useEffect(() => {
    if (!isHomepage) return;
    const saved = store.get(KEY_WON);
    if (saved && PRIZES[saved]) {
      setWon(saved);
      setChip(store.get(KEY_CHIP_HIDDEN) !== '1');
      return;
    }
    if (store.get(KEY_PLAYED) || parseInt(store.get(KEY_DISMISS) || '0', 10) >= 2) return;
    const t = setTimeout(() => setOpen(true), SHOW_AFTER_MS);
    return () => clearTimeout(t);
  }, [isHomepage]);

  // Esc closes; focus the dialog when it opens
  useEffect(() => {
    if (!open) return;
    dialogRef.current?.focus();
    const onKey = (e) => e.key === 'Escape' && close();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const close = () => {
    if (spinning) return;
    setOpen(false);
    if (won) {
      setChip(true);
      return;
    }
    const n = parseInt(store.get(KEY_DISMISS) || '0', 10) + 1;
    store.set(KEY_DISMISS, String(n));
  };

  const spin = () => {
    if (spinning || won) return;
    const code = pickPrize();
    const options = SLICES.map((c, i) => (c === code ? i : -1)).filter((i) => i >= 0);
    const i = options[Math.floor(Math.random() * options.length)];
    // Land somewhere inside the slice (not on a line), pointer is at the top
    const inSlice = SLICE * (0.25 + Math.random() * 0.5);
    const target = 360 * 6 + (360 - (i * SLICE + inSlice));
    const reduce = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    setSpinning(true);
    setRotation(target);
    setTimeout(() => {
      setSpinning(false);
      setWon(code);
      store.set(KEY_WON, code);
      store.set(KEY_PLAYED, 'true');
    }, reduce ? 50 : SPIN_MS);
  };

  const copy = async () => {
    try { await navigator.clipboard.writeText(won); } catch {}
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const hideChip = () => {
    setChip(false);
    store.set(KEY_CHIP_HIDDEN, '1');
  };

  if (!isHomepage) return null;

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center sm:p-4">
          <div className="absolute inset-0 bg-[#1a0d07]/70" onClick={close} aria-hidden />
          <div
            ref={dialogRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby="spin-title"
            className="relative w-full sm:max-w-[440px] bg-[#FBF3EA] rounded-t-3xl sm:rounded-3xl shadow-2xl px-6 pt-7 pb-7 sm:px-8 focus:outline-none"
          >
            <button onClick={close} disabled={spinning} className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center text-heritage/60 hover:bg-heritage/10 disabled:opacity-30" aria-label="Close">
              <X size={18} />
            </button>

            {!won ? (
              <>
                <h2 id="spin-title" className="font-royal font-bold text-4xl text-heritage leading-none text-center">Spin for a discount</h2>
                <p className="mt-2 text-center text-sm text-heritage/70">One spin. Every slice wins up to 20% off your order.</p>

                <div className="relative mx-auto mt-6 w-[260px] h-[260px] sm:w-[290px] sm:h-[290px]">
                  {/* Pointer */}
                  <svg className="absolute left-1/2 -top-2 -translate-x-1/2 z-10 drop-shadow" width="28" height="34" viewBox="0 0 28 34" aria-hidden>
                    <path d="M14 34 L2 6 A14 14 0 0 1 26 6 Z" fill="#E07A24" stroke="#FBF3EA" strokeWidth="2" />
                  </svg>
                  <div className="absolute inset-0 rounded-full p-2 bg-[#2a150c] shadow-[0_18px_40px_-12px_rgba(42,21,12,0.6)]">
                    <svg
                      viewBox="0 0 200 200"
                      className="w-full h-full"
                      style={{ transform: `rotate(${rotation}deg)`, transition: spinning ? `transform ${SPIN_MS}ms cubic-bezier(0.12, 0.8, 0.12, 1)` : 'none' }}
                      aria-hidden
                    >
                      {SLICES.map((code, i) => {
                        const mid = i * SLICE + SLICE / 2;
                        const light = i % 2 === 1;
                        return (
                          <g key={i}>
                            <path d={slicePath(i, 100)} fill={COLOURS[i % COLOURS.length]} stroke="#E8C9A0" strokeWidth="0.8" />
                            <g transform={`rotate(${mid} 100 100)`}>
                              <text x="100" y="34" textAnchor="middle" fill={light ? '#FBF3EA' : '#E8C9A0'} style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 700, fontSize: 19 }}>
                                {PRIZES[code].pct}%
                              </text>
                              <text x="100" y="47" textAnchor="middle" fill={light ? '#FBF3EA' : '#E8C9A0'} style={{ fontSize: 7.5, letterSpacing: 0.5 }} opacity="0.85">off</text>
                            </g>
                          </g>
                        );
                      })}
                      <circle cx="100" cy="100" r="18" fill="#FBF3EA" stroke="#E8C9A0" strokeWidth="2" />
                      <circle cx="100" cy="100" r="6" fill="#A3562A" />
                    </svg>
                  </div>
                </div>

                <button
                  onClick={spin}
                  disabled={spinning}
                  className="mt-7 w-full h-13 py-3.5 rounded-full bg-heritage text-warm-sand font-bold text-base hover:bg-copper disabled:opacity-70 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-copper"
                >
                  {spinning ? 'Spinning…' : 'Spin the wheel'}
                </button>
                <p className="mt-3 text-center text-xs text-heritage/55">On orders of ₹{MIN_ORDER.toLocaleString('en-IN')} or more, up to ₹{MAX_OFF.toLocaleString('en-IN')} off.</p>
              </>
            ) : (
              <div className="text-center" aria-live="polite">
                <span className="mx-auto w-14 h-14 rounded-full bg-heritage text-[#E8C9A0] flex items-center justify-center"><Gift size={26} /></span>
                <h2 id="spin-title" className="mt-4 font-royal font-bold text-5xl text-heritage leading-none">{PRIZES[won].pct}% off</h2>
                <p className="mt-2 text-heritage/70">is yours. Use this code at checkout.</p>

                <button onClick={copy} className="mt-6 w-full flex items-center justify-between gap-3 rounded-2xl border-2 border-dashed border-copper/60 bg-white px-5 py-4 hover:border-copper" aria-label={`Copy code ${won}`}>
                  <span className="font-mono font-bold text-2xl tracking-[0.15em] text-heritage">{won}</span>
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-copper">
                    {copied ? <><Check size={16} /> Copied</> : <><Copy size={16} /> Copy</>}
                  </span>
                </button>

                <Link href="/shop" onClick={() => { setOpen(false); setChip(true); }} className="mt-4 flex items-center justify-center w-full h-12 rounded-full bg-heritage text-warm-sand font-bold hover:bg-copper">
                  Shop now
                </Link>
                <p className="mt-3 text-xs text-heritage/55">On orders of ₹{MIN_ORDER.toLocaleString('en-IN')} or more, up to ₹{MAX_OFF.toLocaleString('en-IN')} off.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reminder chip after closing */}
      {!open && chip && won && (
        <div className="fixed left-3 bottom-20 lg:bottom-5 z-[900] flex items-center gap-1 rounded-full bg-heritage text-warm-sand shadow-lg pl-4 pr-1 py-1">
          <button onClick={copy} className="text-sm py-1.5" aria-label={`Copy discount code ${won}`}>
            <span className="opacity-75">Your code</span> <span className="font-mono font-bold tracking-wider">{won}</span>
            <span className="ml-2 text-[#E8C9A0] text-xs">{copied ? 'Copied' : 'Copy'}</span>
          </button>
          <button onClick={hideChip} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10" aria-label="Hide code reminder"><X size={14} /></button>
        </div>
      )}
    </>
  );
}
