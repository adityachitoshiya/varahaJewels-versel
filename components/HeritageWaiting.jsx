import Link from 'next/link';
import Image from 'next/image';

export default function HeritageWaiting() {
    return (
        <div className="relative w-full min-h-screen flex flex-col items-center justify-center text-center overflow-hidden bg-[#2C1810]">

            {/* Background Images - Responsive */}
            <div className="absolute inset-0 z-0">
                {/* Mobile Image */}
                <div className="block md:hidden w-full h-full relative">
                    <Image
                        src="/varaha-assets/ribbonmobile.png"
                        alt="Royal Ribbon Background"
                        layout="fill"
                        objectFit="fill"
                        className="opacity-90"
                        priority
                    />
                </div>

                {/* Desktop Image */}
                <div className="hidden md:block w-full h-full relative">
                    <Image
                        src="/varaha-assets/ribbon-pc.png"
                        alt="Royal Ribbon Background"
                        layout="fill"
                        objectFit="fill"
                        className="opacity-90"
                        priority
                    />
                </div>

                {/* Gradient Overlay for Text Readability - Optional/Light */}
                <div className="absolute inset-0 bg-black/20 z-[1]"></div>
            </div>

            {/* Content Overlay */}
            <div className="relative z-10 flex flex-col items-center animate-fadeIn px-4 max-w-4xl mx-auto">

                {/* Brand Heading */}
                <h1 className="text-4xl md:text-7xl font-royal text-transparent bg-clip-text bg-gradient-to-r from-[#F4E6D8] via-[#E07A24] to-[#F4E6D8] mb-4 tracking-wide drop-shadow-lg">
                    Varaha Jewels
                </h1>

                {/* Subheading */}
                <p className="text-lg md:text-2xl text-warm-sand/90 font-light italic tracking-[0.2em] mb-12 drop-shadow-md">
                    Where heritage meets royalty
                </p>

                {/* Message Text */}
                <div className="max-w-3xl px-6 relative">
                    {/* Royal Separator */}
                    <div className="flex items-center gap-4 justify-center mb-6 opacity-80">
                        <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-gold"></div>
                        <div className="w-2 h-2 rotate-45 bg-gold border border-warm-sand"></div>
                        <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-gold"></div>
                    </div>

                    <p className="text-xl md:text-3xl font-royal text-warm-sand leading-relaxed drop-shadow-md">
                        Just a couple of time our royal craftsman crafting some luxurious for you
                    </p>
                </div>
            </div>
        </div>
    );
}
