import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { loadProducts } from '../lib/products';

// Collections dropdown (desktop) + the matching mobile lists.
// Links are checked against the live product list the first time the menu
// opens: each shows how many pieces are in stock, and empty ones are hidden.

const has = (field, word) => (p) => (p[field] || '').toLowerCase().includes(word);
const forGender = (g, fn) => (p) => p.gender === g && fn(p);

export const MENU = [
  {
    key: 'collections',
    title: 'Our collections',
    links: [
      { label: 'Heritage', note: 'American Diamond sets', href: '/heritage', match: (p) => p.category === 'Heritage' },
      { label: 'Kundan sets', note: 'Festive necklace sets', href: '/women/necklaces', match: (p) => p.tag === 'Kundan' },
      { label: '925 Silver', note: 'Sterling silver pendants', href: '/silver', match: (p) => p.category === 'Silver' },
      { label: 'Divine', note: 'Rudraksha malas', href: '/divine', match: (p) => p.category === 'Divine' },
      { label: 'Watches', note: 'Kundan and rose gold watches', href: '/watches', match: (p) => p.category === 'Watches' },
      { label: 'Potli bags', note: 'Potlis and clutches', href: '/potli-bags', match: (p) => p.category === 'Potli Bags' },
      { label: 'Bridal', note: 'For the wedding day', href: '/women/bridal-jewellery', match: forGender('Women', (p) => p.collection === 'Bridal') },
      { label: 'Minimal', note: 'Everyday pieces', href: '/women/minimal', match: forGender('Women', (p) => p.collection === 'Minimal') },
    ],
  },
  {
    key: 'women',
    title: 'Women',
    all: { label: "All women's jewellery", href: '/women', match: (p) => p.gender === 'Women' },
    links: [
      { label: 'Necklaces', href: '/women/necklaces', match: forGender('Women', has('category', 'necklace')) },
      { label: 'Earrings', href: '/women/earrings', match: forGender('Women', has('category', 'earrings')) },
      { label: 'Rings', href: '/women/rings', match: forGender('Women', has('category', 'ring')) },
      { label: 'Bangles & bracelets', href: '/women/bangles-bracelets', match: forGender('Women', has('category', 'bangles')) },
      { label: 'Mangalsutra', href: '/women/mangalsutra', match: forGender('Women', has('category', 'mangalsutra')) },
    ],
  },
  {
    key: 'men',
    title: 'Men',
    all: { label: "All men's jewellery", href: '/men', match: (p) => p.gender === 'Men' },
    links: [
      { label: 'Necklaces & chains', href: '/men/necklaces-chains', match: forGender('Men', has('category', 'chain')) },
      { label: 'Rings', href: '/men/rings', match: forGender('Men', has('category', 'ring')) },
      { label: 'Bracelets', href: '/men/bracelets', match: forGender('Men', has('category', 'bracelet')) },
    ],
  },
];

export function useMenuData(enabled) {
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!enabled || data) return;
    let alive = true;
    loadProducts().then((all) => {
      if (!alive) return;
      const products = all.filter((p) => p.stock !== 0);
      const counts = new Map();
      const info = new Map(); // per link: { count, image, from }
      MENU.forEach((g) => [...g.links, g.all].filter(Boolean).forEach((l) => {
        const items = products.filter(l.match);
        const priced = items.filter((p) => p.price);
        counts.set(l.href + l.label, items.length);
        info.set(l.label, {
          count: items.length,
          image: items.find((p) => p.image)?.image,
          from: priced.length ? Math.min(...priced.map((p) => p.price)) : null,
        });
      }));
      const heritage = products.filter((p) => p.category === 'Heritage' && p.price);
      setData({
        counts,
        info,
        total: products.length,
        feature: heritage[0] || products.find((p) => p.is_spotlight) || products[0] || null,
        featureFrom: heritage.length ? Math.min(...heritage.map((p) => p.price)) : null,
      });
    });
    return () => { alive = false; };
  }, [enabled, data]);

  return data;
}

// Before the counts arrive, show every link; after, only links with stock
const visibleLinks = (links, data) =>
  data ? links.filter((l) => data.counts.get(l.href + l.label) > 0) : links;
const countOf = (l, data) => data?.counts.get(l.href + l.label);

export function CollectionsPanel({ data }) {
  const groups = MENU.map((g) => ({ ...g, shown: visibleLinks(g.links, data) })).filter((g) => g.shown.length || !data);
  const feature = data?.feature;

  return (
    <div className="bg-white rounded-2xl shadow-[0_24px_60px_-20px_rgba(60,25,10,0.35)] border border-heritage/10 p-7 w-[860px] max-w-[92vw]">
      <div className="flex gap-8">
        <div className="flex-1 grid gap-7" style={{ gridTemplateColumns: `repeat(${Math.max(groups.length, 1)}, minmax(0, 1fr))` }}>
          {groups.map((g) => (
            <div key={g.key}>
              <p className="font-royal font-bold text-heritage text-xl mb-3">{g.title}</p>
              <ul className="space-y-1">
                {g.shown.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      prefetch={false}
                      className="flex items-baseline justify-between gap-3 -mx-2 px-2 py-1.5 rounded-lg text-heritage hover:bg-warm-sand/70 hover:text-copper focus-visible:outline focus-visible:outline-2 focus-visible:outline-copper"
                    >
                      <span>
                        <span className="block text-[15px]">{l.label}</span>
                        {l.note && <span className="block text-xs text-heritage/55">{l.note}</span>}
                      </span>
                      {countOf(l, data) > 0 && <span className="text-xs tabular-nums text-heritage/45">{countOf(l, data)}</span>}
                    </Link>
                  </li>
                ))}
              </ul>
              {g.all && (!data || countOf(g.all, data) > 0) && (
                <Link href={g.all.href} prefetch={false} className="inline-block mt-3 text-sm font-semibold text-copper hover:text-heritage underline underline-offset-4">
                  {g.all.label}
                </Link>
              )}
            </div>
          ))}
        </div>

        {/* Feature tile: a real Heritage piece */}
        <Link href="/heritage" prefetch={false} className="group/tile relative w-[200px] flex-shrink-0 rounded-xl overflow-hidden bg-warm-sand">
          {feature?.image ? (
            <Image src={feature.image} alt="" fill sizes="200px" className="object-cover transition-transform duration-500 group-hover/tile:scale-105" />
          ) : (
            <span className="absolute inset-0 bg-heritage/10" />
          )}
          <span className="absolute inset-x-0 bottom-0 p-4 pt-12 bg-gradient-to-t from-[#2a150c]/90 to-transparent text-white">
            <span className="block font-royal text-xl font-semibold leading-tight">Heritage collection</span>
            {data?.featureFrom && <span className="block text-xs text-white/80 mt-1">From ₹{Math.round(data.featureFrom).toLocaleString('en-IN')}</span>}
          </span>
        </Link>
      </div>

      <div className="mt-6 pt-4 border-t border-heritage/10 flex items-center justify-between">
        <p className="text-sm text-heritage/60">{data ? `${data.total} pieces in stock` : ' '}</p>
        <Link href="/shop" prefetch={false} className="px-5 py-2 rounded-full bg-heritage text-warm-sand text-sm font-semibold hover:bg-copper transition-colors">
          Shop everything
        </Link>
      </div>
    </div>
  );
}

// Mobile accordion body for one group
export function MobileGroupLinks({ groupKey, data, onNavigate }) {
  const g = MENU.find((x) => x.key === groupKey);
  const links = visibleLinks(g.links, data);
  return (
    <div className="pl-4 pr-2 py-2 space-y-0.5">
      {links.map((l) => (
        <Link key={l.label} href={l.href} prefetch={false} onClick={onNavigate} className="flex items-center justify-between px-4 py-2.5 text-sm text-heritage hover:text-copper hover:bg-copper/5 rounded-md">
          <span>{l.label}</span>
          {countOf(l, data) > 0 && <span className="text-xs tabular-nums text-heritage/45">{countOf(l, data)}</span>}
        </Link>
      ))}
      {g.all && (!data || countOf(g.all, data) > 0) && (
        <Link href={g.all.href} prefetch={false} onClick={onNavigate} className="block px-4 py-2.5 text-sm font-semibold text-copper">
          {g.all.label}
        </Link>
      )}
      {data && links.length === 0 && !(g.all && countOf(g.all, data) > 0) &&<p className="px-4 py-2 text-sm text-heritage/55">New pieces coming soon</p>}
    </div>
  );
}
