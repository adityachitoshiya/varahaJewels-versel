import { useMemo, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { getAllPostSummaries, BLOG_CATEGORIES } from '../../lib/blogs';

const SITE = 'https://www.varahajewels.in';

export default function BlogIndex({ posts, categories }) {
  const [category, setCategory] = useState('All');
  const shown = useMemo(() => (category === 'All' ? posts : posts.filter((p) => p.category === category)), [posts, category]);
  const [lead, ...rest] = shown;

  return (
    <>
      <Head>
        <title>Jewellery Guides and Styling Tips | Varaha Jewels Blog</title>
        <meta name="description" content="Guides to Kundan, American Diamond, 925 silver and rudraksha jewellery: how to choose, style, gift and care for your pieces." />
        <link rel="canonical" href={`${SITE}/blogs`} />
        <meta property="og:title" content="Varaha Jewels Blog: jewellery guides and styling tips" />
        <meta property="og:type" content="website" />
      </Head>
      <Header />

      <main className="min-h-screen bg-warm-sand pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="pt-10 md:pt-14 max-w-3xl">
            <h1 className="font-royal font-bold text-5xl md:text-7xl text-heritage leading-none">Jewellery guides</h1>
            <p className="mt-4 text-lg text-heritage/70">
              How to choose, style, gift and look after Indian jewellery, from bridal sets to everyday silver.
            </p>
          </div>

          <div className="mt-8 flex gap-2.5 overflow-x-auto scrollbar-hide pb-2" role="tablist" aria-label="Topics">
            {['All', ...categories].map((c) => {
              const count = c === 'All' ? posts.length : posts.filter((p) => p.category === c).length;
              if (!count) return null;
              return (
                <button
                  key={c}
                  role="tab"
                  aria-selected={category === c}
                  onClick={() => setCategory(c)}
                  className={`flex-shrink-0 h-10 px-4 rounded-full border text-sm font-medium transition-colors ${category === c ? 'bg-heritage border-heritage text-warm-sand' : 'bg-white border-heritage/15 text-heritage hover:border-copper'}`}
                >
                  {c} <span className={category === c ? 'text-warm-sand/70' : 'text-heritage/45'}>{count}</span>
                </button>
              );
            })}
          </div>

          {!lead ? (
            <p className="py-20 text-center text-heritage/70">New guides are on their way.</p>
          ) : (
            <>
              <Link href={`/blogs/${lead.slug}`} className="group mt-8 block rounded-3xl bg-heritage text-warm-sand p-8 md:p-12 hover:bg-[#6a321d] transition-colors">
                <p className="text-sm text-[#E8C9A0]">{lead.category}, {lead.readMinutes} min read</p>
                <h2 className="mt-3 font-royal font-bold text-3xl md:text-5xl leading-[1.08] max-w-[22ch] group-hover:underline decoration-1 underline-offset-8">{lead.title}</h2>
                <p className="mt-4 text-warm-sand/80 max-w-2xl">{lead.description}</p>
              </Link>

              <ul className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {rest.map((p) => (
                  <li key={p.slug}>
                    <Link href={`/blogs/${p.slug}`} className="group h-full flex flex-col rounded-2xl bg-white border border-heritage/10 p-6 hover:border-copper transition-colors">
                      <p className="text-xs text-copper font-semibold">{p.category}</p>
                      <h2 className="mt-2 font-royal font-bold text-2xl leading-snug text-heritage group-hover:text-copper">{p.title}</h2>
                      <p className="mt-2 text-sm text-heritage/65 line-clamp-3">{p.description}</p>
                      <p className="mt-auto pt-4 text-xs text-heritage/50">{p.readMinutes} min read</p>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

export async function getStaticProps() {
  return { props: { posts: getAllPostSummaries(), categories: BLOG_CATEGORIES } };
}
