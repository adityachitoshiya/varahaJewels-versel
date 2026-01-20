import { useState, useRef, useEffect } from 'react';
import { Upload, X, Loader2, Image, Video } from 'lucide-react';
import { getApiUrl } from '../../lib/config';

export default function MediaUpload({ onUpload, initialMedia = '', label = 'Media Upload', className = '' }) {
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState(initialMedia);
    const [mediaType, setMediaType] = useState(''); // 'image' or 'video'
    const [error, setError] = useState('');
    const [progress, setProgress] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const videoRef = useRef(null);

    useEffect(() => {
        setPreview(initialMedia);
        // Detect media type from URL
        if (initialMedia) {
            if (initialMedia.match(/\.(mp4|mov|webm|avi)$/i) || initialMedia.includes('/video/')) {
                setMediaType('video');
            } else {
                setMediaType('image');
            }
        }
    }, [initialMedia]);

    const uploadFile = async (file) => {
        // Validation (Max 100MB)
        if (file.size > 100 * 1024 * 1024) {
            setError('File size must be less than 100MB');
            return;
        }

        // Check file type
        const isVideo = file.type.startsWith('video/');
        const isImage = file.type.startsWith('image/');

        if (!isVideo && !isImage) {
            setError('Please upload an image or video file');
            return;
        }

        setMediaType(isVideo ? 'video' : 'image');
        setError('');
        setUploading(true);
        setProgress(0);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const API_URL = getApiUrl();

            // Use XMLHttpRequest for progress tracking
            const url = await new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open('POST', `${API_URL}/api/upload`);

                const token = localStorage.getItem('admin_token');
                if (token) {
                    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
                }

                xhr.upload.onprogress = (event) => {
                    if (event.lengthComputable) {
                        const percent = Math.round((event.loaded / event.total) * 100);
                        setProgress(percent);
                    }
                };

                xhr.onload = () => {
                    if (xhr.status === 200) {
                        const data = JSON.parse(xhr.responseText);
                        resolve(data.url);
                    } else {
                        let errMsg = 'Upload failed';
                        try {
                            const errData = JSON.parse(xhr.responseText);
                            errMsg = errData.detail || errMsg;
                        } catch (e) { }
                        reject(new Error(errMsg));
                    }
                };

                xhr.onerror = () => reject(new Error('Network error - Upload failed'));
                xhr.send(formData);
            });

            setPreview(url);
            onUpload(url);

            setTimeout(() => {
                setProgress(0);
            }, 1000);

        } catch (err) {
            console.error('Upload Error:', err);
            setError(err.message || 'Failed to upload. Please try again.');
            setProgress(0);
        } finally {
            setUploading(false);
        }
    };

    const handleFileChange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        await uploadFile(file);
    };

    // Drag and Drop handlers
    const handleDragEnter = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            await uploadFile(files[0]);
        }
    };

    const clearMedia = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setPreview('');
        setMediaType('');
        onUpload('');
    };

    return (
        <div className={`space-y-1 ${className}`}>
            <label className="block text-sm font-medium text-gray-700">{label}</label>

            <div className="relative group">
                {preview ? (
                    <div className="relative h-48 w-full sm:w-64 rounded-lg border-2 border-gray-200 overflow-hidden bg-black">
                        {mediaType === 'video' ? (
                            <video
                                ref={videoRef}
                                src={preview}
                                className="w-full h-full object-cover"
                                controls
                            />
                        ) : (
                            <img
                                src={preview}
                                alt="Preview"
                                className="w-full h-full object-cover"
                            />
                        )}
                        <button
                            onClick={clearMedia}
                            className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 z-10"
                            title="Remove"
                        >
                            <X size={14} />
                        </button>
                        {/* Media type indicator */}
                        <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 rounded text-white text-xs flex items-center gap-1">
                            {mediaType === 'video' ? <Video size={12} /> : <Image size={12} />}
                            {mediaType}
                        </div>
                    </div>
                ) : (
                    <label
                        onDragEnter={handleDragEnter}
                        onDragLeave={handleDragLeave}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        className={`flex flex-col items-center justify-center w-full sm:w-64 h-48 border-2 border-dashed rounded-lg cursor-pointer transition-all relative overflow-hidden
                            ${isDragging
                                ? 'border-copper bg-copper/10 scale-105'
                                : 'border-gray-300 hover:bg-gray-50'
                            }`}
                    >
                        <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
                            {uploading ? (
                                <>
                                    <Loader2 className="w-8 h-8 text-copper animate-spin mb-2" />
                                    <p className="text-xs text-gray-600 font-medium">Uploading...</p>
                                    <div className="w-full mt-2 bg-gray-200 rounded-full h-1.5">
                                        <div
                                            className="bg-copper h-1.5 rounded-full transition-all duration-300"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                    <p className="text-[10px] text-gray-500 mt-1">{progress}%</p>
                                </>
                            ) : isDragging ? (
                                <>
                                    <Upload className="w-10 h-10 text-copper mb-2 animate-bounce" />
                                    <p className="text-sm text-copper font-semibold">Drop here!</p>
                                </>
                            ) : (
                                <>
                                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                                    <p className="text-xs text-gray-500">
                                        <span className="font-semibold text-copper">Click or drag</span>
                                        <br />
                                        <span className="text-[10px]">Image/Video (Max 100MB)</span>
                                    </p>
                                </>
                            )}
                        </div>
                        <input
                            type="file"
                            className="hidden"
                            accept="image/*,video/*"
                            onChange={handleFileChange}
                            disabled={uploading}
                        />
                    </label>
                )}
            </div>
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
    );
}
