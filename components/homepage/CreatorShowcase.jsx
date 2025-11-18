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
    if (!video) {
      console.error('Video not found for ID:', creatorId);
      return;
    }

    console.log('Toggle play for:', creatorId, 'Current state:', video.paused ? 'paused' : 'playing');
    console.log('Video readyState:', video.readyState, 'networkState:', video.networkState);
    console.log('Video src:', video.currentSrc);

    // First, pause all other videos
    Object.entries(videoRefs.current).forEach(([id, v]) => {
      if (v && id !== creatorId.toString() && !v.paused) {
        console.log('Pausing video:', id);
        v.pause();
        setIsPlaying(prev => ({ ...prev, [id]: false }));
      }
    });

    // Then toggle the current video
    if (video.paused) {
      console.log('Attempting to play video:', creatorId);
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('Video playing successfully:', creatorId);
            setIsPlaying(prev => ({ ...prev, [creatorId]: true }));
          })
          .catch(err => {
            console.error('Play error for', creatorId, ':', err);
            setIsPlaying(prev => ({ ...prev, [creatorId]: false }));
          });
      }
    } else {
      console.log('Pausing video:', creatorId);
      video.pause();
      setIsPlaying(prev => ({ ...prev, [creatorId]: false }));
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
      className="relative py-12 md:py-16 lg:py-24 bg-gradient-to-b from-warm-sand via-white to-warm-sand overflow-hidden"
    >
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute top-10 left-10 w-64 h-64 bg-copper rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-heritage rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div 
          className={`text-center max-w-3xl mx-auto mb-8 md:mb-12 lg:mb-16 transition-all duration-1000 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <div className="inline-block mb-3 md:mb-4">
            <span className="text-copper font-semibold tracking-wider text-xs sm:text-sm uppercase px-3 sm:px-4 py-1.5 sm:py-2 bg-copper/10 rounded-full border border-copper/20">
              ✨ Featured By Creators
            </span>
          </div>
          <h2 className="font-royal text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-heritage mb-4 md:mb-6">
            Loved by Influencers
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 leading-relaxed px-4">
            See how top fashion creators style our exquisite jewelry collections
          </p>
        </div>

        {/* Desktop View - Horizontal Scroll */}
        <div className="hidden lg:block">
          <div className="relative -mx-4">
            <div className="flex gap-4 xl:gap-6 overflow-x-auto scrollbar-hide pb-8 px-4 justify-start xl:justify-center snap-x snap-mandatory">
              {creators.map((creator, index) => (
                <div
                  key={creator.id}
                  className={`flex-shrink-0 snap-center transition-all duration-700 ${
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
          <div className="relative max-w-md mx-auto px-2 sm:px-4">
            {/* Carousel with touch support */}
            <div 
              className="overflow-hidden rounded-2xl"
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
            >
              <div 
                className="flex transition-transform duration-500 ease-out"
                style={{ transform: `translateX(-${currentIndex * 100}%)` }}
              >
                {creators.map((creator) => (
                  <div key={creator.id} className="w-full flex-shrink-0 flex justify-center px-2">
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
            <div className="flex justify-center gap-2 mt-4 sm:mt-6">
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
          className={`text-center mt-8 md:mt-12 lg:mt-16 px-4 transition-all duration-1000 delay-500 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <p className="text-base sm:text-lg text-gray-600 mb-4 sm:mb-6">
            Want to collaborate with us?
          </p>
          <a
            href="mailto:collaborate@varahajewels.com"
            className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-copper to-heritage text-white font-semibold text-sm sm:text-base rounded-full hover:shadow-xl hover:scale-105 transition-all duration-300"
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
  const localVideoRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [videoReady, setVideoReady] = useState(false);

  // Handle both callback ref and local ref
  const setVideoRef = (element) => {
    localVideoRef.current = element;
    if (typeof videoRef === 'function') {
      videoRef(element);
    }
  };

  // Video event handlers
  useEffect(() => {
    const video = localVideoRef.current;
    if (!video) return;

    const handleLoadedData = () => {
      console.log('Video loaded:', creator.name);
      setIsLoading(false);
      setHasError(false);
      setVideoReady(true);
    };

    const handleError = (e) => {
      console.error('Video error for', creator.name, ':', e);
      console.error('Video src:', video.src);
      console.error('Error details:', {
        error: video.error,
        networkState: video.networkState,
        readyState: video.readyState
      });
      setIsLoading(false);
      setHasError(true);
      setVideoReady(false);
    };

    const handleCanPlay = () => {
      console.log('Video can play:', creator.name);
      setIsLoading(false);
      setVideoReady(true);
    };

    const handleLoadStart = () => {
      console.log('Video load started:', creator.name);
    };

    const handleProgress = () => {
      console.log('Video loading progress:', creator.name, 'buffered:', video.buffered.length);
    };

    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('progress', handleProgress);
    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('error', handleError);

    // Log initial state
    console.log('Video element created for:', creator.name, 'src:', creator.videoUrl);

    return () => {
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('progress', handleProgress);
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('error', handleError);
    };
  }, [creator.name, creator.videoUrl]);

  return (
    <div className="relative group w-full max-w-[280px] sm:max-w-[300px] md:max-w-[320px] mx-auto">
      {/* 9:16 Video Container */}
      <div className="relative w-full aspect-[9/16] rounded-2xl sm:rounded-3xl overflow-hidden bg-black shadow-2xl">
        {/* Loading State */}
        {isLoading && (
          <div className="absolute inset-0 bg-gradient-to-br from-copper/20 to-heritage/20 flex items-center justify-center z-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-copper mx-auto mb-3"></div>
              <p className="text-white text-sm">Loading video...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {hasError && (
          <div className="absolute inset-0 bg-gradient-to-br from-red-900/20 to-heritage/20 flex items-center justify-center z-20">
            <div className="text-center text-white px-4">
              <p className="text-lg mb-2">⚠️ Video Error</p>
              <p className="text-sm opacity-80">Could not load video</p>
            </div>
          </div>
        )}

        {/* Video Element */}
        <video
          ref={setVideoRef}
          className={`w-full h-full object-cover bg-black ${!videoReady && 'opacity-0'}`}
          loop
          playsInline
          muted={isMuted}
          preload="auto"
          crossOrigin="anonymous"
          x5-video-player-type="h5"
          x5-video-player-fullscreen="true"
          x5-video-orientation="portraint"
          webkit-playsinline=""
          x-webkit-airplay="allow"
          style={{ objectFit: 'cover' }}
        >
          <source src={creator.videoUrl} type="video/mp4" />
          <p className="text-white text-center p-4">Your browser doesn't support HTML5 video.</p>
        </video>

        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none"></div>

        {/* Play/Pause Button */}
        <button
          onClick={onTogglePlay}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 sm:w-16 sm:h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/30 active:bg-white/40 transition-all duration-300 group-hover:scale-110 z-10"
        >
          {isPlaying ? <Pause size={24} className="sm:w-7 sm:h-7" fill="white" /> : <Play size={24} className="sm:w-7 sm:h-7" fill="white" />}
        </button>

        {/* Mute Toggle */}
        <button
          onClick={onToggleMute}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 w-9 h-9 sm:w-10 sm:h-10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-black/60 active:bg-black/70 transition-all duration-300 z-10"
        >
          {isMuted ? <VolumeX size={18} className="sm:w-5 sm:h-5" /> : <Volume2 size={18} className="sm:w-5 sm:h-5" />}
        </button>

        {/* Creator Info - Bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 text-white">
          {/* Profile */}
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-copper to-heritage flex items-center justify-center text-white font-bold text-base sm:text-lg flex-shrink-0">
              {creator.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <h3 className="font-bold text-sm sm:text-base md:text-lg truncate">{creator.name}</h3>
                {creator.verified && (
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <p className="text-xs sm:text-sm text-white/80 truncate">{creator.handle} • {creator.followers}</p>
            </div>
            <div className="flex-shrink-0">
              {creator.platform === 'instagram' ? (
                <Instagram size={20} className="sm:w-6 sm:h-6 text-pink-400" />
              ) : (
                <Youtube size={20} className="sm:w-6 sm:h-6 text-red-500" />
              )}
            </div>
          </div>

          {/* Product Tag */}
          <div className="inline-block px-2.5 py-1 sm:px-3 sm:py-1.5 bg-copper/90 backdrop-blur-sm rounded-full text-xs sm:text-sm font-medium">
            Wearing: {creator.product}
          </div>
        </div>
      </div>
    </div>
  );
}
