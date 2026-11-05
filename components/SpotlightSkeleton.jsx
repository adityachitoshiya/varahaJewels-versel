// Placeholder for ProductSpotlight while products load (same dark layout)
export default function SpotlightSkeleton() {
    return (
        <section className="relative overflow-hidden bg-[#2a150c] py-20 md:py-28">
            <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 animate-pulse">
                <div className="mb-10 md:mb-14">
                    <div className="h-3 w-40 rounded bg-white/10 mb-5"></div>
                    <div className="h-12 w-2/3 md:w-1/2 rounded bg-white/10"></div>
                </div>

                <div className="grid lg:grid-cols-12 gap-8 lg:gap-14 items-center">
                    <div className="lg:col-span-7">
                        <div className="aspect-[4/5] sm:aspect-[5/4] lg:aspect-[6/5] rounded-[28px] bg-white/[0.06]"></div>
                    </div>
                    <div className="lg:col-span-5 space-y-5">
                        <div className="flex gap-2">
                            <div className="h-6 w-20 rounded-full bg-white/10"></div>
                            <div className="h-6 w-16 rounded-full bg-white/10"></div>
                        </div>
                        <div className="h-10 w-5/6 rounded bg-white/10"></div>
                        <div className="h-10 w-2/3 rounded bg-white/10"></div>
                        <div className="space-y-2.5 pt-2">
                            <div className="h-4 w-full rounded bg-white/[0.07]"></div>
                            <div className="h-4 w-full rounded bg-white/[0.07]"></div>
                            <div className="h-4 w-1/2 rounded bg-white/[0.07]"></div>
                        </div>
                        <div className="h-12 w-40 rounded bg-white/10"></div>
                        <div className="h-14 w-56 rounded-full bg-white/10"></div>
                    </div>
                </div>

                <div className="mt-12 md:mt-16 flex gap-4 overflow-hidden">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="w-[220px] md:w-[250px] h-[76px] flex-shrink-0 rounded-2xl bg-white/[0.05]"></div>
                    ))}
                </div>
            </div>
        </section>
    );
}
