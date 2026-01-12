import { useState, useRef, useEffect } from 'react';
import { Upload, X, Loader2, Play } from 'lucide-react';
import { getApiUrl } from '../../lib/config';

export default function VideoUpload({ onUpload, initialVideo = '', label = 'Product Video', className = '' }) {
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState(initialVideo);
    const [error, setError] = useState('');
    const [progress, setProgress] = useState(0);
    const videoRef = useRef(null);

    useEffect(() => {
        setPreview(initialVideo);
    }, [initialVideo]);

    const handleVideoChange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // Validation (Max 100MB)
        if (file.size > 100 * 1024 * 1024) {
            setError('Video size must be less than 100MB');
            return;
        }

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
                        reject(new Error('Upload failed'));
                    }
                };

                xhr.onerror = () => reject(new Error('Upload failed'));
                xhr.send(formData);
            });

            setPreview(url);
            onUpload(url);

            // Reset progress after a moment
            setTimeout(() => {
                setProgress(0);
            }, 1000);

        } catch (err) {
            console.error('Upload Error:', err);
            setError('Failed to upload video. Please try again.');
            setProgress(0);
        } finally {
            setUploading(false);
        }
    };

    const clearVideo = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setPreview('');
        onUpload('');
    };

    return (
        <div className={`space-y-1 ${className}`}>
            <label className="block text-sm font-medium text-gray-700">{label}</label>

            <div className="relative group">
                {preview ? (
                    <div className="relative h-48 w-full sm:w-64 rounded-lg border-2 border-gray-200 overflow-hidden bg-black">
                        <video
                            ref={videoRef}
                            src={preview}
                            className="w-full h-full object-cover"
                            controls
                        />
                        <button
                            onClick={clearVideo}
                            className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 z-10"
                            title="Remove Video"
                        >
                            <X size={14} />
                        </button>
                    </div>
                ) : (
                    <label className="flex flex-col items-center justify-center w-full sm:w-64 h-48 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 transition-colors relative overflow-hidden">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
                            {uploading ? (
                                <>
                                    <Loader2 className="w-8 h-8 text-copper animate-spin mb-2" />
                                    <p className="text-xs text-gray-600 font-medium">Uploading video...</p>
                                    <div className="w-full mt-2 bg-gray-200 rounded-full h-1.5">
                                        <div
                                            className="bg-copper h-1.5 rounded-full transition-all duration-300"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                    <p className="text-[10px] text-gray-500 mt-1">{progress}%</p>
                                </>
                            ) : (
                                <>
                                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                                    <p className="text-xs text-gray-500">
                                        <span className="font-semibold text-copper">Click to upload video</span>
                                        <br />
                                        <span className="text-[10px]">MP4, MOV (Max 100MB)</span>
                                    </p>
                                </>
                            )}
                        </div>
                        <input
                            type="file"
                            className="hidden"
                            accept="video/*"
                            onChange={handleVideoChange}
                            disabled={uploading}
                        />
                    </label>
                )}
            </div>
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
    );
}
