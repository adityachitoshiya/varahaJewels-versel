import { useState, useEffect, useRef } from 'react';
import { ChevronUp } from 'lucide-react';

export default function BackToTop() {
  const [isVisible, setIsVisible] = useState(false);
  const [isLongPressing, setIsLongPressing] = useState(false);
  const longPressTimer = useRef(null);
  const vibrationInterval = useRef(null);
  const scrollInterval = useRef(null);

  // Show button when page is scrolled down
  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  // Check if device is mobile and supports vibration
  const isMobileDevice = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  };

  const canVibrate = () => {
    return 'vibrate' in navigator && isMobileDevice();
  };

  // Start continuous vibration (40% intensity = 40ms vibrate, 60ms pause pattern)
  const startVibration = () => {
    if (canVibrate()) {
      // Clear any existing vibration
      navigator.vibrate(0);
      
      // Pattern: vibrate for 40ms, pause for 60ms (simulates 40% intensity)
      vibrationInterval.current = setInterval(() => {
        if (window.pageYOffset > 0) {
          navigator.vibrate(40);
        } else {
          stopVibration();
        }
      }, 100);
    }
  };

  // Stop vibration
  const stopVibration = () => {
    if (canVibrate()) {
      navigator.vibrate(0);
    }
    if (vibrationInterval.current) {
      clearInterval(vibrationInterval.current);
      vibrationInterval.current = null;
    }
  };

  // Smooth scroll to top
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // Auto scroll while long pressing
  const startAutoScroll = () => {
    scrollInterval.current = setInterval(() => {
      const currentScroll = window.pageYOffset;
      if (currentScroll > 0) {
        window.scrollBy({
          top: -50, // Scroll up by 50px each interval
          behavior: 'smooth'
        });
      } else {
        stopAutoScroll();
        stopVibration();
        setIsLongPressing(false);
      }
    }, 50);
  };

  const stopAutoScroll = () => {
    if (scrollInterval.current) {
      clearInterval(scrollInterval.current);
      scrollInterval.current = null;
    }
  };

  // Handle long press start
  const handlePressStart = () => {
    // Only enable long press on mobile
    if (!isMobileDevice()) return;

    longPressTimer.current = setTimeout(() => {
      setIsLongPressing(true);
      startVibration();
      startAutoScroll();
    }, 500); // 500ms delay to activate long press
  };

  // Handle long press end
  const handlePressEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    if (isLongPressing) {
      stopVibration();
      stopAutoScroll();
      setIsLongPressing(false);
    }
  };

  // Handle normal click (when not long pressing)
  const handleClick = () => {
    if (!isLongPressing && !isMobileDevice()) {
      scrollToTop();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopVibration();
      stopAutoScroll();
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
    };
  }, []);

  return (
    <>
      {isVisible && (
        <button
          onClick={handleClick}
          onMouseDown={handlePressStart}
          onMouseUp={handlePressEnd}
          onMouseLeave={handlePressEnd}
          onTouchStart={handlePressStart}
          onTouchEnd={handlePressEnd}
          onTouchCancel={handlePressEnd}
          className={`fixed bottom-8 right-8 z-50 group ${isLongPressing ? 'scale-95' : ''} transition-transform duration-200`}
          aria-label="Back to top"
        >
          {/* Outer rotating ring */}
          <div className="relative">
            <div className={`absolute inset-0 bg-copper rounded-full blur-xl transition-opacity duration-300 ${isLongPressing ? 'opacity-100 animate-pulse' : 'opacity-50 group-hover:opacity-75'}`}></div>
            
            {/* Main button */}
            <div className={`relative w-14 h-14 bg-gradient-to-br from-copper to-heritage rounded-full flex items-center justify-center shadow-2xl transform transition-all duration-300 border-2 border-copper/30 ${
              isLongPressing 
                ? 'scale-110 rotate-12 ring-4 ring-copper/50' 
                : 'group-hover:scale-110 group-hover:rotate-12'
            }`}>
              {/* Animated ring */}
              <div className={`absolute inset-0 rounded-full border-2 border-copper/50 ${isLongPressing ? 'animate-ping' : ''}`}></div>
              
              {/* Icon */}
              <ChevronUp 
                size={24} 
                className={`text-warm-sand relative z-10 transition-transform duration-300 ${
                  isLongPressing 
                    ? '-translate-y-2 animate-bounce' 
                    : 'group-hover:-translate-y-1'
                }`}
              />
            </div>

            {/* Bottom glow */}
            <div className={`absolute -bottom-1 left-1/2 transform -translate-x-1/2 h-2 bg-copper/30 rounded-full blur-md transition-all duration-300 ${
              isLongPressing ? 'w-12' : 'w-10 group-hover:w-12'
            }`}></div>

            {/* Long press indicator (mobile only) */}
            {isMobileDevice() && isLongPressing && (
              <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-heritage text-warm-sand text-xs px-3 py-1 rounded-full whitespace-nowrap animate-bounce">
                Scrolling... 📳
              </div>
            )}
          </div>
        </button>
      )}
    </>
  );
}
