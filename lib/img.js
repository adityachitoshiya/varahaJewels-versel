// Cloudinary delivers a small, modern-format copy of any image when asked:
//   .../upload/f_auto,q_auto,w_800/...   (best format for the browser, auto quality, 800 px wide)
// Product photos were uploaded at full size, so plain <img> tags used to download
// several MB per page. Use cld(url, width) for any <img> that is not next/image.
export function cld(url, width = 800) {
  if (!url || typeof url !== 'string') return url;
  if (!url.includes('res.cloudinary.com') || !url.includes('/upload/')) return url;
  if (/\/upload\/[^/]*(f_auto|w_\d+)/.test(url)) return url; // already transformed
  return url.replace('/upload/', `/upload/f_auto,q_auto,w_${width},c_limit/`);
}

// srcSet for sharp screens without downloading more than needed
export function cldSet(url, widths = [480, 800, 1200]) {
  if (!url || !url.includes('res.cloudinary.com')) return undefined;
  return widths.map((w) => `${cld(url, w)} ${w}w`).join(', ');
}
