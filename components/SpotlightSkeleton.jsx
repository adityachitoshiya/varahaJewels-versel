export default function SpotlightSkeleton() {
    return (
        <section className="py-12 sm:py-16 md:py-24 relative overflow-hidden bg-[#faf9f6]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

                {/* Header Skeleton */}
                <div className="text-center mb-8 sm:mb-12 md:mb-16 flex flex-col items-center">
                    <div className="h-4 bg-[#EDD9C7] rounded shimmer-line w-32 mb-3 sm:mb-4"></div>
                    <div className="h-8 sm:h-10 md:h-12 bg-[#EDD9C7] rounded shimmer-line w-3/4 sm:w-2/3 md:w-1/2"></div>
                </div>

                {/* Main Showcase Skeleton */}
                <div className="grid lg:grid-cols-12 gap-8 items-center">
                    {/* Image Area Skeleton */}
                    <div className="lg:col-span-7 relative">
                        <div className="aspect-[3/4] sm:aspect-[4/5] md:aspect-[16/10] lg:h-[600px] w-full bg-[#EDD9C7] rounded-xl sm:rounded-2xl shimmer-line"></div>
                    </div>

                    {/* Content Area Skeleton */}
                    <div className="lg:col-span-5 lg:-ml-12 relative z-20 mt-4 sm:mt-6 lg:mt-0">
                        <div className="bg-white/80 backdrop-blur-xl border border-white/60 p-5 sm:p-8 md:p-12 rounded-xl sm:rounded-2xl shadow-lg">
                            {/* Stars */}
                            <div className="h-4 bg-[#EDD9C7] rounded shimmer-line w-32 mb-6"></div>

                            {/* Title */}
                            <div className="h-10 bg-[#EDD9C7] rounded shimmer-line w-3/4 mb-6"></div>

                            {/* Description */}
                            <div className="space-y-3 mb-8">
                                <div className="h-4 bg-[#F4E6D8] rounded shimmer-line w-full"></div>
                                <div className="h-4 bg-[#F4E6D8] rounded shimmer-line w-full"></div>
                                <div className="h-4 bg-[#F4E6D8] rounded shimmer-line w-2/3"></div>
                            </div>

                            {/* Price */}
                            <div className="h-10 bg-[#EDD9C7] rounded shimmer-line w-1/3 mb-10"></div>

                            {/* Buttons */}
                            <div className="flex gap-4">
                                <div className="h-14 bg-[#EDD9C7] rounded-lg shimmer-line flex-1"></div>
                                <div className="h-14 bg-[#EDD9C7] rounded-lg shimmer-line w-20"></div>
                            </div>
                        </div>

                        {/* Thumbnails Skeleton */}
                        <div className="mt-4 sm:mt-6 md:mt-8 flex gap-2.5 sm:gap-4">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="w-14 h-14 sm:w-18 sm:h-18 md:w-20 md:h-20 bg-[#EDD9C7] rounded-lg sm:rounded-xl shimmer-line flex-shrink-0"></div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
