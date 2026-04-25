import { useState, useEffect } from 'react';
import { getApiUrl } from '../../lib/config';
import Head from 'next/head';
import Link from 'next/link';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { Calendar, User, Tag, ArrowRight, Search } from 'lucide-react';

export default function BlogsPage() {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedTag, setSelectedTag] = useState('');
  const [allTags, setAllTags] = useState([]);

  useEffect(() => {
    fetchBlogs();
  }, [page, selectedTag]);

  const fetchBlogs = async () => {
    setIsLoading(true);
    try {
      let url = `${getApiUrl()}/api/blogs?page=${page}&limit=12`;
      if (selectedTag) url += `&tag=${selectedTag}`;
      
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts || []);
        setTotalPages(data.pages || 1);
        
        // Extract all unique tags
        if (!selectedTag && page === 1) {
          const tags = new Set();
          (data.posts || []).forEach(p => {
            (p.tags || []).forEach(t => tags.add(t));
          });
          setAllTags([...tags]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch blogs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
  };

  return (
    <>
      <Head>
        <title>Blog — Varaha Jewels | Jewellery Insights & Style Guide</title>
        <meta name="description" content="Explore jewellery care tips, styling guides, and heritage stories from Varaha Jewels. Discover the art of Indian jewellery." />
      </Head>
      <Header />
      <main className="min-h-screen bg-white">

        {/* Hero Section */}
        <section className="relative bg-heritage text-white overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 25% 50%, rgba(197,160,89,0.3) 0%, transparent 50%), radial-gradient(circle at 75% 50%, rgba(197,160,89,0.2) 0%, transparent 50%)' }} />
          </div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center relative">
            <span className="inline-block text-copper text-xs tracking-[4px] uppercase mb-4 font-medium">Our Journal</span>
            <h1 className="font-royal text-3xl sm:text-5xl lg:text-6xl font-bold mb-4 tracking-tight">
              The Varaha <span className="text-copper">Blog</span>
            </h1>
            <p className="text-white/70 max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
              Jewellery care tips, styling guides, heritage stories, and behind-the-scenes glimpses into the world of Varaha Jewels.
            </p>
          </div>
        </section>

        {/* Tag Filters */}
        {allTags.length > 0 && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
            <div className="flex flex-wrap gap-2 justify-center">
              <button
                onClick={() => { setSelectedTag(''); setPage(1); }}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  !selectedTag ? 'bg-heritage text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All Posts
              </button>
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => { setSelectedTag(tag); setPage(1); }}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                    selectedTag === tag ? 'bg-heritage text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Blog Grid */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-200 rounded-xl aspect-[16/10]" />
                  <div className="mt-4 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/3" />
                    <div className="h-6 bg-gray-200 rounded w-3/4" />
                    <div className="h-4 bg-gray-200 rounded w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">No blog posts yet</h3>
              <p className="text-gray-500">Check back soon for jewellery tips, guides, and stories.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {posts.map((post, idx) => (
                <Link key={post.id} href={`/blogs/${post.slug}`}>
                  <article className="group cursor-pointer">
                    {/* Cover Image */}
                    <div className="relative overflow-hidden rounded-xl aspect-[16/10] bg-gray-100">
                      {post.cover_image ? (
                        <img
                          src={post.cover_image}
                          alt={post.title}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-heritage/10 to-copper/10 flex items-center justify-center">
                          <span className="text-4xl">✍️</span>
                        </div>
                      )}
                      {/* Overlay on hover */}
                      <div className="absolute inset-0 bg-heritage/0 group-hover:bg-heritage/10 transition-colors duration-300" />
                    </div>

                    {/* Content */}
                    <div className="mt-4">
                      {/* Tags */}
                      {post.tags && post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {post.tags.slice(0, 2).map(tag => (
                            <span key={tag} className="text-[10px] uppercase tracking-wider font-semibold text-copper bg-copper/10 px-2 py-0.5 rounded-full">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Title */}
                      <h2 className="font-royal text-lg sm:text-xl font-bold text-heritage group-hover:text-copper transition-colors line-clamp-2 leading-tight">
                        {post.title}
                      </h2>

                      {/* Excerpt */}
                      {post.excerpt && (
                        <p className="text-gray-500 text-sm mt-2 line-clamp-2 leading-relaxed">
                          {post.excerpt}
                        </p>
                      )}

                      {/* Meta */}
                      <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          {formatDate(post.created_at)}
                        </span>
                        <span className="flex items-center gap-1">
                          <User size={12} />
                          {post.author}
                        </span>
                      </div>

                      {/* Read More */}
                      <div className="mt-3 flex items-center gap-1 text-copper text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        Read Article <ArrowRight size={14} />
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-12">
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className={`w-10 h-10 rounded-lg text-sm font-semibold transition-all ${
                    page === i + 1
                      ? 'bg-heritage text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
