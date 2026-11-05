import Link from 'next/link';
import Image from 'next/image';
import { MENU, useMenuData } from '../CollectionsMenu';

// Homepage "Our collections": the store's real sections (same list as the
// Collections menu), each with a live piece count and starting price.
// A photo uploaded in Admin > CMS for a card with the same link is used first.

const TILES = 4;

export default function FeaturedCollections({ settings }) {
  const data = useMenuData(true);

  const cmsImages = (() => {
    try {
      const cards = JSON.parse(settings?.heritage_cards_json || '[]');
      return Object.fromEntries(cards.filter((c) => c.href && c.image).map((c) => [c.href, c.image]));
    } catch {
      return {};
    }
  })();

  const links = MENU.find((g) => g.key === 'collections').links;
  const tiles = (data ? links.filter((l) => data.info.get(l.label)?.count > 0) : links)
    .slice(0, TILES)
    .map((l) => ({ ...l, ...(data?.info.get(l.label) || {}), image: cmsImages[l.href] || data?.info.get(l.label)?.image }));

  if (data && tiles.length === 0) return null;

  return (
    <section className="py-16 md:py-24 bg-warm-sand" aria-labelledby="collections-title">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-6 mb-8 md:mb-12">
          <div>
            <h2 id="collections-title" className="font-royal text-4xl sm:text-5xl md:text-6xl font-bold text-heritage leading-[1.05]">
              Our collections
            </h2>
            <p className="mt-3 text-heritage/70 max-w-xl">Necklace sets for weddings and festivals, sterling silver for every day, and malas for prayer.</p>
          </div>
          <Link href="/shop" prefetch={false} className="hidden sm:inline-block text-sm font-semibold text-copper hover:text-heritage underline underline-offset-4 whitespace-nowrap">
            Shop everything
          </Link>
        </div>

        {/* First collection large, the rest stacked beside it */}
        <div className="grid grid-cols-2 lg:grid-cols-4 lg:grid-rows-2 gap-3 md:gap-5 lg:h-[640px]">
          {tiles.map((t, i) => (
            <Link
              key={t.label}
              href={t.href}
              prefetch={false}
              className={`group relative overflow-hidden rounded-2xl md:rounded-3xl bg-heritage/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-copper ${
                i === 0 ? 'col-span-2 row-span-2 aspect-[4/5] sm:aspect-[16/11] lg:aspect-auto' : i === 1 ? 'col-span-2 aspect-[16/9] lg:aspect-auto' : 'aspect-[4/5] lg:aspect-auto'
              }`}
            >
              {t.image && (
                <Image
                  src={t.image}
                  alt=""
                  fill
                  sizes={i === 0 ? '(max-width: 1024px) 100vw, 50vw' : '(max-width: 1024px) 50vw, 25vw'}
                  className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                  priority={i === 0}
                />
              )}
              <span className="absolute inset-0 bg-gradient-to-t from-[#2a150c]/85 via-[#2a150c]/15 to-transparent" />
              <span className={`absolute inset-x-0 bottom-0 text-[#FBF3EA] ${i === 0 ? 'p-6 md:p-9' : 'p-4 md:p-6'}`}>
                <span className={`block font-royal font-semibold leading-none ${i === 0 ? 'text-4xl md:text-6xl' : 'text-2xl md:text-3xl'}`}>{t.label}</span>
                {t.note && <span className={`block mt-2 text-[#F4E6D8]/85 ${i === 0 ? 'text-base md:text-lg' : 'text-xs md:text-sm'}`}>{t.note}</span>}
                {t.from && (
                  <span className={`mt-3 inline-block text-[#E8C9A0] ${i === 0 ? 'text-sm md:text-base' : 'text-xs md:text-sm'}`}>
                    From ₹{Math.round(t.from).toLocaleString('en-IN')}
                  </span>
                )}
              </span>
            </Link>
          ))}
        </div>

        <Link href="/shop" prefetch={false} className="sm:hidden mt-6 inline-block text-sm font-semibold text-copper underline underline-offset-4">
          Shop everything
        </Link>
      </div>
    </section>
  );
}
