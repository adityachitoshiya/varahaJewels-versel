import { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { getApiUrl } from '../lib/config';

export default function AnnouncementBar() {
  const [items, setItems] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

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

          // Only show active items with non-empty text
          const activeItems = barItems.filter(item => item.active && item.text && item.text.trim());
          setItems(activeItems);
        }
      } catch (err) {
        console.error('Failed to fetch announcement bar:', err);
      }
    };

    fetchItems();
  }, []);

  // Auto-rotate with smooth crossfade
  useEffect(() => {
    if (items.length <= 1) return;

    const interval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentIndex(prev => (prev + 1) % items.length);
        setIsVisible(true);
      }, 400);
    }, 4000);

    return () => clearInterval(interval);
  }, [items.length]);

  const goToNext = useCallback(() => {
    if (items.length <= 1) return;
    setIsVisible(false);
    setTimeout(() => {
      setCurrentIndex(prev => (prev + 1) % items.length);
      setIsVisible(true);
    }, 400);
  }, [items.length]);

  const goToPrev = useCallback(() => {
    if (items.length <= 1) return;
    setIsVisible(false);
    setTimeout(() => {
      setCurrentIndex(prev => (prev - 1 + items.length) % items.length);
      setIsVisible(true);
    }, 400);
  }, [items.length]);

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('announcementBarDismissed', 'true');
  };

  if (isDismissed || items.length === 0) return null;

  const currentItem = items[currentIndex];

  return (
    <div className="relative z-50 bg-gradient-to-r from-heritage via-copper to-heritage text-warm-sand py-2 px-2 border-b border-warm-sand/20 shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-center relative">

        {/* Left Arrow */}
        {items.length > 1 && (
          <button
            onClick={goToPrev}
            className="absolute left-0 p-1 hover:bg-warm-sand/10 rounded-full transition-colors"
            aria-label="Previous"
          >
            <ChevronLeft size={14} className="text-warm-sand/70" />
          </button>
        )}

        {/* Content - Smooth crossfade */}
        <div className="overflow-hidden max-w-[85%] sm:max-w-none">
          <p
            className={`text-[10px] sm:text-xs text-center font-medium whitespace-nowrap transition-opacity duration-500 ease-in-out ${isVisible ? 'opacity-100' : 'opacity-0'
              }`}
          >
            {currentItem?.text}
          </p>
        </div>

        {/* Right Arrow */}
        {items.length > 1 && (
          <button
            onClick={goToNext}
            className="absolute right-6 p-1 hover:bg-warm-sand/10 rounded-full transition-colors"
            aria-label="Next"
          >
            <ChevronRight size={14} className="text-warm-sand/70" />
          </button>
        )}

        {/* Dismiss */}
        <button
          onClick={handleDismiss}
          className="absolute right-0 p-1 hover:bg-warm-sand/10 rounded-full transition-colors"
          aria-label="Dismiss"
        >
          <X size={14} className="text-warm-sand/70" />
        </button>
      </div>
    </div>
  );
}