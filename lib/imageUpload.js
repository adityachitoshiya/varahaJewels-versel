/**
 * Image Compression and Cloudinary Upload Utility
 * Compresses images to ~10KB while maintaining quality
 */

// Cloudinary Config (unsigned upload preset required)
const CLOUDINARY_CLOUD_NAME = 'dd5zrsmok';
const CLOUDINARY_UPLOAD_PRESET = 'varaha_returns'; // You need to create this in Cloudinary

/**
 * Compress image to target size (~10KB) while maintaining quality
 * Uses canvas to resize and compress
 */
export async function compressImage(file, targetSizeKB = 10) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                // Calculate dimensions - maintain aspect ratio
                let width = img.width;
                let height = img.height;

                // Start with a moderate size reduction for initial compression attempt
                const maxDimension = 800; // Start with reasonable size
                if (width > maxDimension || height > maxDimension) {
                    if (width > height) {
                        height = Math.round((height * maxDimension) / width);
                        width = maxDimension;
                    } else {
                        width = Math.round((width * maxDimension) / height);
                        height = maxDimension;
                    }
                }

                // Create canvas
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                // Function to try compression at different qualities
                const tryCompress = (quality, scale) => {
                    const scaledWidth = Math.round(width * scale);
                    const scaledHeight = Math.round(height * scale);

                    canvas.width = scaledWidth;
                    canvas.height = scaledHeight;

                    // Clear and draw
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillRect(0, 0, scaledWidth, scaledHeight);
                    ctx.drawImage(img, 0, 0, scaledWidth, scaledHeight);

                    // Compress to JPEG
                    return canvas.toDataURL('image/jpeg', quality);
                };

                // Binary search for optimal quality
                let quality = 0.7;
                let scale = 1.0;
                let result = tryCompress(quality, scale);
                let sizeKB = (result.length * 0.75) / 1024; // Approximate size

                // Adjust to reach target size
                let iterations = 0;
                while (sizeKB > targetSizeKB && iterations < 15) {
                    if (sizeKB > targetSizeKB * 3) {
                        scale *= 0.7;
                    } else if (sizeKB > targetSizeKB * 1.5) {
                        quality = Math.max(0.3, quality - 0.15);
                    } else {
                        quality = Math.max(0.2, quality - 0.05);
                    }
                    result = tryCompress(quality, scale);
                    sizeKB = (result.length * 0.75) / 1024;
                    iterations++;
                }

                console.log(`Compressed: ${file.name} - ${sizeKB.toFixed(1)}KB (quality: ${quality}, scale: ${scale})`);

                // Convert base64 to Blob
                const byteString = atob(result.split(',')[1]);
                const mimeType = 'image/jpeg';
                const ab = new ArrayBuffer(byteString.length);
                const ia = new Uint8Array(ab);
                for (let i = 0; i < byteString.length; i++) {
                    ia[i] = byteString.charCodeAt(i);
                }
                const blob = new Blob([ab], { type: mimeType });

                resolve({
                    blob,
                    base64: result,
                    sizeKB: sizeKB.toFixed(1),
                    originalName: file.name
                });
            };

            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = e.target.result;
        };

        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
    });
}

/**
 * Upload compressed image to Cloudinary
 */
export async function uploadToCloudinary(compressedImage) {
    const formData = new FormData();
    formData.append('file', compressedImage.blob, compressedImage.originalName);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('folder', 'returns');

    try {
        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
            {
                method: 'POST',
                body: formData
            }
        );

        if (!response.ok) {
            throw new Error('Cloudinary upload failed');
        }

        const data = await response.json();
        console.log('Cloudinary upload success:', data.secure_url);
        return data.secure_url;
    } catch (error) {
        console.error('Cloudinary upload error:', error);
        throw error;
    }
}

/**
 * Compress and upload multiple images
 * Returns array of Cloudinary URLs
 */
export async function processReturnImages(files, onProgress = null) {
    const urls = [];
    const total = files.length;

    for (let i = 0; i < files.length; i++) {
        const file = files[i];

        if (onProgress) {
            onProgress({ current: i + 1, total, status: `Compressing ${file.name}...` });
        }

        try {
            // Compress
            const compressed = await compressImage(file);

            if (onProgress) {
                onProgress({ current: i + 1, total, status: `Uploading ${file.name}...` });
            }

            // Upload to Cloudinary
            const url = await uploadToCloudinary(compressed);
            urls.push(url);

        } catch (error) {
            console.error(`Failed to process ${file.name}:`, error);
            // Continue with other images
        }
    }

    return urls;
}
