import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, Instagram, Youtube } from 'lucide-react';

// Creator data with 9:16 vertical videos
const creators = [
  {
    id: 1,
    name: "Priya Sharma",
    handle: "@priyastyle",
    platform: "instagram",
    followers: "2.5M",
    videoUrl: "/varaha-assets/creator1.mp4",
    product: "Heritage Kundan Necklace",
    verified: true
  },
  {
    id: 2,
    name: "Nisha Kapoor",
    handle: "@nishafashion",
    platform: "youtube",
    followers: "1.8M",
    videoUrl: "/varaha-assets/creator2.mp4",
    product: "Traditional Jhumka Earrings",
    verified: true
  },
  {
    id: 3,
    name: "Anjali Mehta",
    handle: "@anjalijewels",
    platform: "instagram",
    followers: "3.2M",
    videoUrl: "/varaha-assets/creator3.mp4",
    product: "Polki Diamond Bangles",
    verified: true
  },
  {
    id: 4,
    name: "Rhea Malhotra",
    handle: "@rheaglam",
    platform: "instagram",
    followers: "950K",
    videoUrl: "/varaha-assets/creator4.mp4",
    product: "Gold Maang Tikka",
    verified: true
  },
  {
    id: 5,
    name: "Kavya Reddy",
    handle: "@kavyastyle",
    platform: "youtube",
    followers: "2.1M",
    videoUrl: "/varaha-assets/creator5.mp4",
    product: "Temple Jewelry Collection",
    verified: true
  }
];

export default function CreatorShowcase() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState({});
  const [isMuted, setIsMuted] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const videoRefs = useRef({});
  const sectionRef = useRef(null);

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

  // Intersection Observer for animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const togglePlay = (creatorId) => {
    const video = videoRefs.current[creatorId];
    if (video) {
      if (video.paused) {
        video.play();
        setIsPlaying(prev => ({ ...prev, [creatorId]: true }));
      } else {
        video.pause();
        setIsPlaying(prev => ({ ...prev, [creatorId]: false }));
      }
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    Object.values(videoRefs.current).forEach(video => {
      if (video) video.muted = !isMuted;
    });
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % creators.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + creators.length) % creators.length);
  };

  // Touch handlers for swipe
  const onTouchStart = (e) => {
    setTouchEnd(0); // Reset
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      nextSlide();
    }
    if (isRightSwipe) {
      prevSlide();
    }
  };

  // Auto-pause videos when scrolling away
  useEffect(() => {
    const handleScroll = () => {
      Object.entries(videoRefs.current).forEach(([id, video]) => {
        if (video && !video.paused) {
          const rect = video.getBoundingClientRect();
          if (rect.bottom < 0 || rect.top > window.innerHeight) {
            video.pause();
            setIsPlaying(prev => ({ ...prev, [id]: false }));
          }
        }
      });
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <section 
      ref={sectionRef}
      className="relative py-16 md:py-24 bg-gradient-to-b from-warm-sand via-white to-warm-sand overflow-hidden"
    >
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10 w-64 h-64 bg-copper rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-heritage rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div 
          className={`text-center max-w-3xl mx-auto mb-12 md:mb-16 transition-all duration-1000 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <div className="inline-block mb-4">
            <span className="text-copper font-semibold tracking-wider text-sm uppercase px-4 py-2 bg-copper/10 rounded-full border border-copper/20">
              ✨ Featured By Creators
            </span>
          </div>
          <h2 className="font-royal text-4xl md:text-5xl lg:text-6xl font-bold text-heritage mb-6">
            Loved by Influencers
          </h2>
          <p className="text-lg md:text-xl text-gray-600 leading-relaxed">
            See how top fashion creators style our exquisite jewelry collections
          </p>
        </div>

        {/* Desktop View - Horizontal Scroll */}
        <div className="hidden lg:block">
          <div className="relative">
            <div className="flex gap-6 overflow-x-auto scrollbar-hide pb-8 px-4 justify-center">
              {creators.map((creator, index) => (
                <div
                  key={creator.id}
                  className={`flex-shrink-0 transition-all duration-700 ${
                    isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12'
                  }`}
                  style={{ transitionDelay: `${index * 100}ms` }}
                >
                  <VideoCard
                    creator={creator}
                    videoRef={(el) => videoRefs.current[creator.id] = el}
                    isPlaying={isPlaying[creator.id]}
                    isMuted={isMuted}
                    onTogglePlay={() => togglePlay(creator.id)}
                    onToggleMute={toggleMute}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile/Tablet View - Carousel */}
        <div className="lg:hidden">
          <div className="relative max-w-md mx-auto px-4">
            {/* Navigation Buttons - Removed for touch-only navigation */}
            
            {/* Carousel with touch support */}
            <div 
              className="overflow-hidden"
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
            >
              <div 
                className="flex transition-transform duration-500 ease-out"
                style={{ transform: `translateX(-${currentIndex * 100}%)` }}
              >
                {creators.map((creator) => (
                  <div key={creator.id} className="w-full flex-shrink-0 flex justify-center">
                    <VideoCard
                      creator={creator}
                      videoRef={(el) => videoRefs.current[creator.id] = el}
                      isPlaying={isPlaying[creator.id]}
                      isMuted={isMuted}
                      onTogglePlay={() => togglePlay(creator.id)}
                      onToggleMute={toggleMute}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Mobile Progress Dots */}
            <div className="flex justify-center gap-2 mt-6">
              {creators.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === currentIndex ? 'w-8 bg-copper' : 'w-2 bg-heritage/30'
                  }`}
                  aria-label={`Go to creator ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div 
          className={`text-center mt-12 md:mt-16 transition-all duration-1000 delay-500 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <p className="text-lg text-gray-600 mb-6">
            Want to collaborate with us?
          </p>
          <a
            href="mailto:collaborate@varahajewels.com"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-copper to-heritage text-white font-semibold rounded-full hover:shadow-xl hover:scale-105 transition-all duration-300"
          >
            <Instagram size={20} />
            Become a Creator Partner
          </a>
        </div>
      </div>
    </section>
  );
}

// Video Card Component
function VideoCard({ creator, videoRef, isPlaying, isMuted, onTogglePlay, onToggleMute }) {
  const [thumbnailGenerated, setThumbnailGenerated] = useState(false);
  const canvasRef = useRef(null);
  const localVideoRef = useRef(null);

  // Handle both callback ref and local ref
  const setVideoRef = (element) => {
    localVideoRef.current = element;
    if (typeof videoRef === 'function') {
      videoRef(element);
    }
  };

  // Generate thumbnail from video
  useEffect(() => {
    const video = localVideoRef.current;
    if (!video || thumbnailGenerated) return;

    const handleLoadedData = () => {
      // Set video to 1 second to capture a good frame
      video.currentTime = 1;
    };

    const handleSeeked = () => {
      if (!canvasRef.current) return;
      
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      // Set canvas size to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert canvas to blob and set as poster
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          video.poster = url;
          setThumbnailGenerated(true);
        }
      }, 'image/jpeg', 0.8);
      
      // Reset video to start
      video.currentTime = 0;
    };

    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('seeked', handleSeeked);

    return () => {
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('seeked', handleSeeked);
    };
  }, [thumbnailGenerated]);

  return (
    <div className="relative group w-full max-w-[280px] sm:max-w-[320px] mx-auto">
      {/* Hidden canvas for thumbnail generation */}
      <canvas ref={canvasRef} className="hidden" />
      
      {/* 9:16 Video Container */}
      <div className="relative w-full aspect-[9/16] rounded-3xl overflow-hidden bg-black shadow-2xl">
        {/* Loading placeholder */}
        {!thumbnailGenerated && (
          <div className="absolute inset-0 bg-gradient-to-br from-copper/20 to-heritage/20 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-copper"></div>
          </div>
        )}
        
        {/* Video Element */}
        <video
          ref={setVideoRef}
          className="w-full h-full object-cover"
          loop
          playsInline
          muted={isMuted}
          preload="metadata"
        >
          <source src={creator.videoUrl} type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none"></div>

        {/* Play/Pause Button */}
        <button
          onClick={onTogglePlay}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all duration-300 group-hover:scale-110"
        >
          {isPlaying ? <Pause size={28} fill="white" /> : <Play size={28} fill="white" />}
        </button>

        {/* Mute Toggle */}
        <button
          onClick={onToggleMute}
          className="absolute top-4 right-4 w-10 h-10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-black/60 transition-all duration-300"
        >
          {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>

        {/* Creator Info - Bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
          {/* Profile */}
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-copper to-heritage flex items-center justify-center text-white font-bold text-lg">
              {creator.name.charAt(0)}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-1">
                <h3 className="font-bold text-lg">{creator.name}</h3>
                {creator.verified && (
                  <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <p className="text-sm text-white/80">{creator.handle} • {creator.followers}</p>
            </div>
            <div>
              {creator.platform === 'instagram' ? (
                <Instagram size={24} className="text-pink-400" />
              ) : (
                <Youtube size={24} className="text-red-500" />
              )}
            </div>
          </div>

          {/* Product Tag */}
          <div className="inline-block px-3 py-1.5 bg-copper/90 backdrop-blur-sm rounded-full text-sm font-medium">
            Wearing: {creator.product}
          </div>
        </div>
      </div>
    </div>
  );
}
