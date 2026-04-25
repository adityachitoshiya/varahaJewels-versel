import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { getApiUrl } from '../../lib/config';
import Head from 'next/head';
import Link from 'next/link';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { Calendar, User, Tag, ArrowLeft, Share2, Copy, Check } from 'lucide-react';

export default function BlogPostPage() {
  const router = useRouter();
  const { slug } = router.query;
  const [post, setPost] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [relatedPosts, setRelatedPosts] = useState([]);

  useEffect(() => {
    if (slug) fetchPost();
  }, [slug]);

  const fetchPost = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${getApiUrl()}/api/blogs/${slug}`);
      if (res.ok) {
        const data = await res.json();
        setPost(data);
        // Fetch related posts
        fetchRelated(data.tags);
      } else {
        setPost(null);
      }
    } catch (err) {
      console.error('Failed to fetch blog:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRelated = async (tags) => {
    try {
      const tag = tags && tags.length > 0 ? tags[0] : '';
      const url = tag 
        ? `${getApiUrl()}/api/blogs?limit=3&tag=${tag}` 
        : `${getApiUrl()}/api/blogs?limit=3`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setRelatedPosts((data.posts || []).filter(p => p.slug !== slug).slice(0, 3));
      }
    } catch (err) {
      console.error('Failed to fetch related posts:', err);
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: post.title, url });
      } catch {}
    } else {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-white">
          <div className="max-w-3xl mx-auto px-4 py-20">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-gray-200 rounded w-3/4" />
              <div className="h-4 bg-gray-200 rounded w-1/3" />
              <div className="aspect-[16/9] bg-gray-200 rounded-xl" />
              <div className="space-y-3">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="h-4 bg-gray-200 rounded" style={{ width: `${85 + Math.random() * 15}%` }} />
                ))}
              </div>
            </div>
          </div>
        </main>
      </>
    );
  }

  if (!post) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">📄</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Blog post not found</h2>
            <p className="text-gray-500 mb-6">This article may have been removed or doesn't exist.</p>
            <Link href="/blogs" className="text-copper font-semibold hover:underline">
              ← Back to Blog
            </Link>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>{post.title} — Varaha Jewels Blog</title>
        <meta name="description" content={post.excerpt || post.title} />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.excerpt || post.title} />
        {post.cover_image && <meta property="og:image" content={post.cover_image} />}
      </Head>
      <Header />
      <main className="min-h-screen bg-white">

        {/* Back Link */}
        <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-6">
          <Link href="/blogs" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-heritage transition-colors">
            <ArrowLeft size={16} /> Back to Blog
          </Link>
        </div>

        {/* Article */}
        <article className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
          
          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {post.tags.map(tag => (
                <Link key={tag} href={`/blogs?tag=${tag}`}>
                  <span className="text-[11px] uppercase tracking-wider font-semibold text-copper bg-copper/10 px-3 py-1 rounded-full hover:bg-copper/20 transition-colors cursor-pointer">
                    {tag}
                  </span>
                </Link>
              ))}
            </div>
          )}

          {/* Title */}
          <h1 className="font-royal text-3xl sm:text-4xl lg:text-5xl font-bold text-heritage leading-tight mb-4">
            {post.title}
          </h1>

          {/* Meta */}
          <div className="flex items-center gap-4 text-sm text-gray-400 mb-8 pb-6 border-b border-gray-100">
            <span className="flex items-center gap-1.5">
              <Calendar size={14} />
              {formatDate(post.created_at)}
            </span>
            <span className="flex items-center gap-1.5">
              <User size={14} />
              {post.author}
            </span>
            <button
              onClick={handleShare}
              className="ml-auto flex items-center gap-1.5 text-gray-400 hover:text-copper transition-colors"
            >
              {copied ? <><Check size={14} /> Copied!</> : <><Share2 size={14} /> Share</>}
            </button>
          </div>

          {/* Cover Image */}
          {post.cover_image && (
            <div className="rounded-xl overflow-hidden mb-10 shadow-lg">
              <img
                src={post.cover_image}
                alt={post.title}
                className="w-full h-auto object-cover"
              />
            </div>
          )}

          {/* Content */}
          <div
            className="prose prose-lg prose-gray max-w-none
              prose-headings:font-royal prose-headings:text-heritage
              prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
              prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
              prose-p:text-gray-600 prose-p:leading-relaxed prose-p:mb-5
              prose-a:text-copper prose-a:no-underline hover:prose-a:underline
              prose-strong:text-heritage
              prose-img:rounded-xl prose-img:shadow-md
              prose-blockquote:border-l-copper prose-blockquote:bg-copper/5 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r-lg
              prose-li:text-gray-600
              prose-ul:my-4 prose-ol:my-4
            "
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* Divider */}
          <div className="my-12 flex items-center justify-center">
            <span className="text-2xl text-copper">♦</span>
          </div>

          {/* Author Card */}
          <div className="bg-gray-50 rounded-xl p-6 flex items-center gap-4 mb-12">
            <div className="w-14 h-14 rounded-full bg-heritage/10 flex items-center justify-center flex-shrink-0">
              <User size={24} className="text-heritage" />
            </div>
            <div>
              <p className="font-semibold text-heritage">{post.author}</p>
              <p className="text-sm text-gray-500">Varaha Jewels — Where Heritage Meets Royalty</p>
            </div>
          </div>
        </article>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <section className="bg-gray-50 py-12 sm:py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
              <h3 className="font-royal text-2xl font-bold text-heritage text-center mb-8">More from our Journal</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {relatedPosts.map(rp => (
                  <Link key={rp.id} href={`/blogs/${rp.slug}`}>
                    <div className="group cursor-pointer bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                      <div className="aspect-[16/10] bg-gray-100 overflow-hidden">
                        {rp.cover_image ? (
                          <img src={rp.cover_image} alt={rp.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-heritage/10 to-copper/10 flex items-center justify-center">
                            <span className="text-3xl">✍️</span>
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h4 className="font-royal font-bold text-heritage group-hover:text-copper transition-colors line-clamp-2">{rp.title}</h4>
                        <p className="text-xs text-gray-400 mt-2">{formatDate(rp.created_at)}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
