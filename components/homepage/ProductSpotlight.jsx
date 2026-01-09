import SpotlightSkeleton from '../SpotlightSkeleton';

// ... imports ...

export default function ProductSpotlight() {
  // ... state ...

  // ... useEffect ...

  // ... fetchFeaturedProducts ...

  // Safe fallback if no products
  if (isLoading) return <SpotlightSkeleton />;
  if (error) return <div className="py-24 text-center text-red-500">Error: {error}</div>;
  if (products.length === 0) {
    return (
      <div className="py-24 text-center">
        <p className="text-heritage/60 mb-4">No products available yet</p>
        <Link href="/admin/products/new" className="text-copper underline">Add your first product</Link>
      </div>
    );
  }

  const currentProduct = products[currentIndex];

  // Check if products are featured or new arrivals
  const hasFeaturedProducts = products.some(p => p.tag === 'Featured' || p.tag === 'Bestseller' || p.premium);

  return (
    <section className="py-24 relative overflow-hidden bg-[#faf9f6]">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
        <div className="absolute top-10 left-10 w-64 h-64 bg-copper rounded-full blur-[100px]"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-heritage rounded-full blur-[120px]"></div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Header */}
        <div
          ref={ref}
          className={`text-center mb-16 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-100 translate-y-0'}`}
        >
          <span className="text-copper font-medium tracking-[0.2em] uppercase text-sm mb-2 block animate-pulse">
            {hasFeaturedProducts ? 'Exquisite Collection' : 'Fresh Designs'}
          </span>
          <h2 className="font-royal text-5xl md:text-7xl font-bold text-heritage mb-6 drop-shadow-sm">
            {hasFeaturedProducts ? 'Featured Masterpieces' : 'New Arrivals'}
          </h2>
        </div>

        {/* Main Showcase */}
        <div className={`relative transition-all duration-1000 delay-200 ${isVisible ? 'opacity-100 scale-100' : 'opacity-100 scale-100'}`}>
          <div className="grid lg:grid-cols-12 gap-8 items-center">

            {/* Image Area - Spans 7 cols - WITH FLOATING EFFECT */}
            <div className="lg:col-span-7 relative group animate-float">
              <div className="aspect-[4/5] md:aspect-[16/10] lg:h-[600px] w-full relative rounded-2xl overflow-hidden shadow-[0_20px_50px_-12px_rgba(183,110,121,0.3)] border border-white/20">
                <img
                  src={currentProduct.image}
                  alt={currentProduct.name}
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                  onError={(e) => { e.target.src = '/varaha-assets/logo.png'; }}
                />

                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60"></div>

                {/* Tags on Image */}
                <div className="absolute top-6 left-6 flex gap-2">
                  {currentProduct.premium && (
                    <span className="px-4 py-1 bg-white/90 backdrop-blur-md text-heritage text-xs font-bold uppercase tracking-wider rounded-sm shadow-lg">
                      Premium
                    </span>
                  )}
                  {currentProduct.tag && (
                    <span className="px-4 py-1 bg-copper/90 backdrop-blur-md text-white text-xs font-bold uppercase tracking-wider rounded-sm shadow-lg">
                      {currentProduct.tag}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Content Area - Floating Glass Card - Spans 5 cols */}
            <div className="lg:col-span-5 lg:-ml-12 relative z-20 mt-8 lg:mt-0">
              <div className="bg-white/80 backdrop-blur-xl border border-white/60 p-8 md:p-12 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgb(183,110,121,0.2)] transition-shadow duration-500">
                <div className="flex items-center gap-2 text-copper mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={16} fill="currentColor" />
                  ))}
                  <span className="text-xs text-gray-500 font-medium ml-2 uppercase tracking-wide">(Bestseller)</span>
                </div>

                <h3 className="font-royal text-4xl md:text-5xl font-bold text-heritage mb-6 leading-[1.1]">
                  {currentProduct.name}
                </h3>

                <p className="font-playfair text-lg text-gray-600 mb-8 leading-relaxed line-clamp-3">
                  {currentProduct.description || "Experience the timeless elegance of our handcrafted masterpiece, designed to illuminate your grace."}
                </p>

                <div className="flex items-baseline gap-4 mb-10">
                  <span className="text-4xl font-light text-copper">
                    {currentProduct.price ? `₹${currentProduct.price.toLocaleString('en-IN')} ` : 'Price on Request'}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Link
                    href={`/product/${currentProduct.id}`}
                    className="flex-1 py-4 bg-heritage text-white text-center rounded-lg font-medium hover:bg-copper transition-colors flex items-center justify-center gap-2 group shadow-lg shadow-heritage/20"
                  >
                    Shop Now
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link
                    href={`/product/${currentProduct.id}`}
                    className="px-6 py-4 border border-heritage/20 text-heritage rounded-lg hover:bg-heritage/5 transition-colors flex items-center justify-center group"
                  >
                    <ShoppingBag size={20} className="group-hover:scale-110 transition-transform" />
                  </Link>
                </div>

              </div>

              {/* Thumbnails Navigation */}
              <div className="mt-8 flex gap-4 overflow-x-auto pb-4 hide-scrollbar px-1">
                {products.map((p, idx) => (
                  <button
                    key={p.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all duration-300 ${idx === currentIndex ? 'border-copper scale-110 shadow-lg ring-2 ring-copper/20' : 'border-transparent opacity-60 hover:opacity-100 hover:scale-105'}`}
                  >
                    <img
                      src={p.image}
                      alt={p.name}
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.src = '/varaha-assets/logo.png'; }}
                    />
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
