import { useState, useRef } from 'react';

export default function TestVideo() {
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef(null);

  const handlePlay = async () => {
    const video = videoRef.current;
    if (!video) return;

    console.log('Video element:', video);
    console.log('Video src:', video.currentSrc);
    console.log('Video readyState:', video.readyState);
    console.log('Video networkState:', video.networkState);
    console.log('Video paused:', video.paused);
    console.log('Video muted:', video.muted);

    try {
      if (video.paused) {
        await video.play();
        console.log('✅ Video playing successfully');
        setIsPlaying(true);
      } else {
        video.pause();
        console.log('⏸️ Video paused');
        setIsPlaying(false);
      }
    } catch (error) {
      console.error('❌ Play error:', error);
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <h1 className="text-white text-2xl mb-4 text-center">Video Test Page</h1>
        
        <div className="relative aspect-[9/16] bg-black rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            loop
            playsInline
            muted
            preload="auto"
            onLoadedData={() => console.log('📹 Video loaded')}
            onCanPlay={() => console.log('▶️ Video can play')}
            onError={(e) => console.error('❌ Video error:', e)}
            onPlay={() => console.log('🎬 Video started playing')}
            onPause={() => console.log('⏸️ Video paused')}
          >
            <source src="/varaha-assets/creator1.mp4" type="video/mp4" />
          </video>

          <button
            onClick={handlePlay}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/50 transition-all"
          >
            {isPlaying ? '⏸️' : '▶️'}
          </button>
        </div>

        <div className="mt-4 text-white text-sm">
          <p>Status: {isPlaying ? 'Playing' : 'Paused'}</p>
          <p className="mt-2 text-gray-400">Check browser console (F12) for detailed logs</p>
        </div>

        <div className="mt-4">
          <a
            href="/"
            className="block text-center text-blue-400 hover:text-blue-300"
          >
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}
