export default function ProductSkeleton({ viewMode = 'grid' }) {
    const Card = () => (
        <div className={`bg-white border border-gray-100 rounded-sm overflow-hidden flex flex-col ${viewMode === 'list' ? 'sm:flex-row' : 'h-full'}`}>
            {/* Image Skeleton */}
            <div className={`relative bg-gray-200 shimmer-line ${viewMode === 'list' ? 'w-48 h-48 sm:h-auto flex-shrink-0' : 'aspect-square'}`}></div>

            {/* Content Skeleton */}
            <div className="p-6 flex flex-col flex-1 space-y-4">
                <div className="space-y-2">
                    {/* Title Line */}
                    <div className="h-6 bg-gray-200 rounded shimmer-line w-3/4"></div>
                    {/* Subtitle Line */}
                    <div className="h-4 bg-gray-100 rounded shimmer-line w-1/2"></div>
                </div>

                {/* Description Lines */}
                <div className="space-y-2 flex-grow">
                    <div className="h-3 bg-gray-100 rounded shimmer-line w-full"></div>
                    <div className="h-3 bg-gray-100 rounded shimmer-line w-5/6"></div>
                </div>

                {/* Price & Button */}
                <div className="pt-4 space-y-3 mt-auto">
                    <div className="h-8 bg-gray-200 rounded shimmer-line w-1/3"></div>
                    <div className="h-12 bg-gray-200 rounded shimmer-line w-full"></div>
                </div>
            </div>
        </div>
    );

    // Return generic grid of 6 skeletons
    return (
        <div className={viewMode === 'grid'
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'
            : 'space-y-6'
        }>
            {[...Array(6)].map((_, i) => <Card key={i} />)}
        </div>
    );
}
