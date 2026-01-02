import { useState } from 'react';
import { X } from 'lucide-react';

export default function AnnouncementBar() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="bg-black text-white px-4 py-2 flex justify-between items-center text-sm z-50 relative">
      <div className="flex-1 text-center">
        <p>Free Domestic Shipping on interactions above ₹50,000</p>
      </div>
      <button 
        onClick={() => setIsVisible(false)}
        className="text-white hover:text-gray-300 transition-colors"
        aria-label="Close announcement"
      >
        <X size={16} />
      </button>
    </div>
  );
}
