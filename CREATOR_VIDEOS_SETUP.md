# Creator Showcase - Video Setup Guide

## 📹 How to Add Creator Videos

### Step 1: Prepare Your Videos
- **Format Required**: MP4 format
- **Aspect Ratio**: 9:16 (Vertical/Portrait mode - like Instagram Reels/YouTube Shorts)
- **Recommended Resolution**: 1080x1920 or 720x1280
- **File Size**: Keep under 10MB for better loading (compress if needed)

### Step 2: Add Videos to Project

1. Place your video files in the `/public/varaha-assets/` folder
2. Name them as:
   - `creator1.mp4`
   - `creator2.mp4`
   - `creator3.mp4`
   - `creator4.mp4`
   - `creator5.mp4`

3. Also add thumbnail images (shown before video plays):
   - `creator1-thumb.jpg`
   - `creator2-thumb.jpg`
   - `creator3-thumb.jpg`
   - `creator4-thumb.jpg`
   - `creator5-thumb.jpg`

### Step 3: Update Creator Information

Open `/components/homepage/CreatorShowcase.jsx` and update the `creators` array:

```javascript
const creators = [
  {
    id: 1,
    name: "Creator Name",           // Full name of the creator
    handle: "@creatorhandle",       // Instagram/YouTube handle
    platform: "instagram",          // "instagram" or "youtube"
    followers: "2.5M",             // Follower count
    videoUrl: "/varaha-assets/creator1.mp4",
    thumbnail: "/varaha-assets/creator1-thumb.jpg",
    product: "Product Name",        // Which jewelry they're wearing
    verified: true                  // Blue checkmark or not
  },
  // Add more creators...
];
```

### Step 4: Add More or Remove Creators

**To Add More Creators:**
- Add new object to the `creators` array
- Use unique `id` numbers
- Add corresponding video and thumbnail files

**To Remove Creators:**
- Simply delete the object from the array

### Step 5: Customize Appearance

You can customize:
- Section title (line 149)
- Section description (line 152)
- Collaboration email (line 217)
- Colors in Tailwind classes

## 🎨 Features Included

✅ **9:16 Vertical Video Support** (Instagram Reels/YouTube Shorts format)
✅ **Play/Pause Controls** on each video
✅ **Mute/Unmute Toggle** for audio
✅ **Mobile Responsive** - Carousel on mobile, horizontal scroll on desktop
✅ **Auto-pause** when scrolling away from videos
✅ **Creator Info Display** - Name, handle, followers, platform
✅ **Product Tags** - Shows which jewelry they're wearing
✅ **Verified Badges** - Blue checkmark for verified creators
✅ **Platform Icons** - Instagram/YouTube icons
✅ **Smooth Animations** - Fade-in and slide effects

## 📱 Responsive Behavior

- **Mobile/Tablet**: Carousel with navigation arrows and dots
- **Desktop**: Horizontal scrollable gallery showing multiple videos
- **All Devices**: Touch/swipe friendly

## 🎬 Video Compression Tips

If your videos are too large, compress them using:
- **Online**: HandBrake, CloudConvert, or Compressor.io
- **FFmpeg Command**:
  ```bash
  ffmpeg -i input.mp4 -vcodec h264 -acodec mp2 -b:v 1M -b:a 128k output.mp4
  ```

## 🔗 Current Location

The Creator Showcase appears on the homepage after:
1. Hero Section
2. Featured Collections
3. Product Spotlight
4. Heritage Section
5. Testimonials Section
6. **👉 Creator Showcase** ← HERE
7. Footer

---

**Need Help?** Contact: collaborate@varahajewels.com
