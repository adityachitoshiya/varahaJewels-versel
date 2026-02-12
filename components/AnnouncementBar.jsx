import { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { getApiUrl } from '../lib/config';

export default function AnnouncementBar() {
  const [items, setItems] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [slideDirection, setSlideDirection] = useState('left');

  // Fetch announcement items from settings API
  useEffect(() => {
    const dismissed = localStorage.getItem('announcementBarDismissed');
    if (dismissed === 'true') {
      setIsDismissed(true);
      return;
    }

    const fetchItems = async () => {
      try {
        const API_URL = getApiUrl();
        const res = await fetch(`${API_URL}/api/settings`);
        if (res.ok) {
          const data = await res.json();
          let barItems = [];
          try {
            barItems = JSON.parse(data.announcement_bar_json || '[]');
          } catch (e) { barItems = []; }

          // Only show active items
          const activeItems = barItems.filter(item => item.active);
          setItems(activeItems);
        }
      } catch (err) {
        console.error('Failed to fetch announcement bar:', err);
      }
    };

    fetchItems();
  }, []);

  // Auto-rotate every 4 seconds
  useEffect(() => {
    if (items.length <= 1) return;

    const interval = setInterval(() => {
      setSlideDirection('left');
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentIndex(prev => (prev + 1) % items.length);
        setIsAnimating(false);
      }, 300);
    }, 4000);

    return () => clearInterval(interval);
  }, [items.length]);

  const goToNext = useCallback(() => {
    if (items.length <= 1 || isAnimating) return;
    setSlideDirection('left');
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentIndex(prev => (prev + 1) % items.length);
      setIsAnimating(false);
    }, 300);
  }, [items.length, isAnimating]);

  const goToPrev = useCallback(() => {
    if (items.length <= 1 || isAnimating) return;
    setSlideDirection('right');
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentIndex(prev => (prev - 1 + items.length) % items.length);
      setIsAnimating(false);
    }, 300);
  }, [items.length, isAnimating]);

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('announcementBarDismissed', 'true');
  };

  if (isDismissed || items.length === 0) return null;

  const currentItem = items[currentIndex];

  // Emoji per type
  const typeEmoji = {
    offer: '🎁',
    announcement: '📢',
    coupon: '🏷️'
  };

  const emoji = typeEmoji[currentItem?.type] || '✨';

  return (
    <div className="relative z-50 bg-gradient-to-r from-heritage via-copper to-heritage text-warm-sand py-1.5 px-2 border-b border-warm-sand/20 shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-center relative">

        {/* Left Arrow */}
        {items.length > 1 && (
          <button
            onClick={goToPrev}
            className="absolute left-0 p-0.5 hover:bg-warm-sand/10 rounded-full transition-colors"
            aria-label="Previous"
          >
            <ChevronLeft size={14} className="text-warm-sand/70" />
          </button>
        )}

        {/* Content */}
        <div className="overflow-hidden max-w-[85%] sm:max-w-none">
          <p
            className={`text-[10px] sm:text-xs text-center font-medium whitespace-nowrap transition-all duration-300 ease-in-out ${isAnimating
                ? slideDirection === 'left'
                  ? 'opacity-0 -translate-x-4'
                  : 'opacity-0 translate-x-4'
                : 'opacity-100 translate-x-0'
              }`}
          >
            <span className="mr-1">{emoji}</span>
            <span>{currentItem?.text}</span>
          </p>
        </div>

        {/* Right Arrow */}
        {items.length > 1 && (
          <button
            onClick={goToNext}
            className="absolute right-6 p-0.5 hover:bg-warm-sand/10 rounded-full transition-colors"
            aria-label="Next"
          >
            <ChevronRight size={14} className="text-warm-sand/70" />
          </button>
        )}

        {/* Dismiss */}
        <button
          onClick={handleDismiss}
          className="absolute right-0 p-0.5 hover:bg-warm-sand/10 rounded-full transition-colors"
          aria-label="Dismiss"
        >
          <X size={14} className="text-warm-sand/70" />
        </button>
      </div>

      {/* Dots indicator */}
      {items.length > 1 && (
        <div className="flex justify-center gap-1 mt-0.5">
          {items.map((_, idx) => (
            <span
              key={idx}
              className={`inline-block w-1 h-1 rounded-full transition-all ${idx === currentIndex ? 'bg-warm-sand w-2.5' : 'bg-warm-sand/40'
                }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}