import Head from 'next/head';
import Link from 'next/link';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { CollectionRail } from '../../components/homepage/ProductHome';
import { MENU } from '../../components/CollectionsMenu';
import { getAllPostSummaries, getPost, getRelatedPosts } from '../../lib/blogs';

const SITE = 'https://www.varahajewels.in';

// "[label](/path)" inside article text -> internal link; anything else stays text
function RichText({ text }) {
  const parts = [];
  const re = /\[([^\]]+)\]\((\/[^)\s]*)\)/g;
  let last = 0;
  let m;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    parts.push(<Link key={m.index} href={m[2]} className="text-copper font-medium underline underline-offset-2 hover:text-heritage">{m[1]}</Link>);
    last = m.index + m[0].length;
  }
  parts.push(text.slice(last));
  return <>{parts}</>;
}

const plain = (t = '') => t.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');

export default function BlogPost({ post, related }) {
  const url = `${SITE}/blogs/${post.slug}`;
  const shopLink = MENU.find((g) => g.key === 'collections').links.find((l) => post.links?.some((x) => x.href === l.href));

  const articleLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.date,
    mainEntityOfPage: url,
    author: { '@type': 'Organization', name: 'Varaha Jewels' },
    publisher: { '@type': 'Organization', name: 'Varaha Jewels', logo: { '@type': 'ImageObject', url: `${SITE}/varaha-assets/logo.png` } },
  };
  const faqLd = post.faq?.length ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: post.faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: plain(f.a) } })),
  } : null;
  const crumbsLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE}/blogs` },
      { '@type': 'ListItem', position: 3, name: post.title, item: url },
    ],
  };

  return (
    <>
      <Head>
        <title>{`${post.title} | Varaha Jewels`}</title>
        <meta name="description" content={post.description} />
        {post.keywords?.length > 0 && <meta name="keywords" content={post.keywords.join(', ')} />}
        <link rel="canonical" href={url} />
        <meta property="og:type" content="article" />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.description} />
        <meta property="og:url" content={url} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbsLd) }} />
        {faqLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />}
      </Head>
      <Header />

      <main className="bg-warm-sand">
        <article className="max-w-3xl mx-auto px-4 sm:px-6 pt-8 md:pt-12 pb-12">
          <nav aria-label="Breadcrumb" className="text-sm text-heritage/60">
            <Link href="/" className="hover:text-copper">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/blogs" className="hover:text-copper">Blog</Link>
            <span className="mx-2">/</span>
            <span className="text-heritage/80">{post.category}</span>
          </nav>

          <h1 className="mt-5 font-royal font-bold text-4xl md:text-6xl leading-[1.05] text-heritage">{post.title}</h1>
          <p className="mt-4 text-sm text-heritage/60">
            {post.readMinutes || 5} min read
            {post.date && <>, <time dateTime={post.date}>{new Date(post.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</time></>}
          </p>

          {post.intro && <p className="mt-8 font-playfair text-xl leading-relaxed text-heritage/90"><RichText text={post.intro} /></p>}

          <div className="mt-8 space-y-10">
            {post.sections.map((s, i) => (
              <section key={i}>
                {s.heading && <h2 className="font-royal font-bold text-3xl text-heritage leading-tight">{s.heading}</h2>}
                <div className="mt-3 space-y-4 text-[17px] leading-[1.75] text-[#4a2a1b]">
                  {(s.paragraphs || []).map((para, j) => <p key={j}><RichText text={para} /></p>)}
                  {s.list?.length > 0 && (
                    <ul className="space-y-2 pl-1">
                      {s.list.map((li, j) => (
                        <li key={j} className="flex gap-3"><span className="mt-[11px] w-1.5 h-1.5 rounded-full bg-copper flex-shrink-0" /><span><RichText text={li} /></span></li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>
            ))}
          </div>

          {post.faq?.length > 0 && (
            <section className="mt-12">
              <h2 className="font-royal font-bold text-3xl text-heritage">Questions people ask</h2>
              <div className="mt-4 divide-y divide-heritage/10 rounded-2xl bg-white border border-heritage/10">
                {post.faq.map((f, i) => (
                  <details key={i} className="group px-5 py-4" open={i === 0}>
                    <summary className="cursor-pointer list-none flex justify-between gap-4 font-semibold text-heritage">
                      {f.q}
                      <span className="text-copper transition-transform group-open:rotate-45" aria-hidden>+</span>
                    </summary>
                    <p className="mt-2 text-[15px] leading-relaxed text-heritage/75"><RichText text={f.a} /></p>
                  </details>
                ))}
              </div>
            </section>
          )}

          {post.links?.length > 0 && (
            <div className="mt-10 flex flex-wrap gap-3">
              {post.links.map((l) => (
                <Link key={l.href + l.label} href={l.href} className="inline-flex items-center h-11 px-6 rounded-full bg-heritage text-warm-sand text-sm font-semibold hover:bg-copper transition-colors">
                  {l.label}
                </Link>
              ))}
            </div>
          )}
        </article>

        {shopLink && <CollectionRail label={shopLink.label} title={`Shop ${shopLink.label.toLowerCase()}`} tone="ivory" />}

        {related.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <h2 className="font-royal font-bold text-3xl text-heritage mb-5">Keep reading</h2>
            <ul className="grid sm:grid-cols-3 gap-4 md:gap-6">
              {related.map((p) => (
                <li key={p.slug}>
                  <Link href={`/blogs/${p.slug}`} className="group h-full block rounded-2xl bg-white border border-heritage/10 p-6 hover:border-copper transition-colors">
                    <p className="text-xs text-copper font-semibold">{p.category}</p>
                    <p className="mt-2 font-royal font-bold text-xl leading-snug text-heritage group-hover:text-copper">{p.title}</p>
                    <p className="mt-3 text-xs text-heritage/50">{p.readMinutes} min read</p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}

export async function getStaticPaths() {
  return { paths: getAllPostSummaries().map((p) => ({ params: { slug: p.slug } })), fallback: 'blocking' };
}

export async function getStaticProps({ params }) {
  const post = getPost(params.slug);
  if (!post) return { notFound: true };
  return { props: { post, related: getRelatedPosts(post) } };
}
