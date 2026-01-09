import Header from './Header';
import Footer from './Footer';

export default function ProductDetailSkeleton() {
    return (
        <div className="min-h-screen flex flex-col bg-white">
            {/* Header Skeleton */}
            <Header cartCount={0} />

            <main className="flex-1">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="lg:grid lg:grid-cols-12 lg:gap-8">

                        {/* Left Column - Images Skeleton */}
                        <div className="lg:col-span-7 xl:col-span-7 space-y-4">
                            <div className="aspect-[4/5] sm:aspect-square w-full bg-gray-200 rounded-sm shimmer-line"></div>
                            <div className="grid grid-cols-4 gap-4 hidden lg:grid">
                                {[...Array(4)].map((_, i) => (
                                    <div key={i} className="aspect-square bg-gray-200 rounded-sm shimmer-line"></div>
                                ))}
                            </div>
                        </div>

                        {/* Right Column - Info Skeleton */}
                        <div className="lg:col-span-5 xl:col-span-5 mt-6 lg:mt-0">
                            <div className="lg:sticky lg:top-24 space-y-6">
                                {/* Brand/Title */}
                                <div className="space-y-2">
                                    <div className="h-4 bg-gray-200 rounded shimmer-line w-1/4"></div>
                                    <div className="h-8 bg-gray-200 rounded shimmer-line w-3/4"></div>
                                </div>

                                {/* Rating */}
                                <div className="h-4 bg-gray-100 rounded shimmer-line w-1/3"></div>

                                {/* Price */}
                                <div className="h-10 bg-gray-200 rounded shimmer-line w-1/2 my-4"></div>

                                {/* Description */}
                                <div className="space-y-2">
                                    <div className="h-3 bg-gray-100 rounded shimmer-line w-full"></div>
                                    <div className="h-3 bg-gray-100 rounded shimmer-line w-full"></div>
                                    <div className="h-3 bg-gray-100 rounded shimmer-line w-full"></div>
                                    <div className="h-3 bg-gray-100 rounded shimmer-line w-2/3"></div>
                                </div>

                                {/* Config/Buttons */}
                                <div className="pt-6 space-y-4">
                                    <div className="h-12 bg-gray-200 rounded-sm shimmer-line w-full"></div>
                                    <div className="h-12 bg-gray-200 rounded-sm shimmer-line w-full"></div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
