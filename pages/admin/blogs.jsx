import { useState, useEffect, useRef } from 'react';
import { getApiUrl } from '../../lib/config';
import AdminLayout from '../../components/admin/AdminLayout';
import Head from 'next/head';
import { Plus, Edit3, Trash2, Eye, EyeOff, Image, X, Save, ArrowLeft, ExternalLink } from 'lucide-react';
import { useAdminToast } from '../../components/admin/AdminToast';

export default function AdminBlogs() {
    const toast = useAdminToast();
    const API_URL = getApiUrl();
    const [blogs, setBlogs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showEditor, setShowEditor] = useState(false);
    const [editingBlog, setEditingBlog] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [tagInput, setTagInput] = useState('');
    const fileInputRef = useRef(null);

    const emptyForm = {
        title: '',
        content: '',
        excerpt: '',
        cover_image: '',
        author: 'Varaha Jewels',
        tags: [],
        is_published: false,
    };
    const [form, setForm] = useState(emptyForm);

    useEffect(() => { fetchBlogs(); }, []);

    const fetchBlogs = async () => {
        const token = localStorage.getItem('admin_token');
        if (!token) { window.location.href = '/login'; return; }
        try {
            const res = await fetch(`${API_URL}/api/admin/blogs`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.status === 401 || res.status === 403) { window.location.href = '/login'; return; }
            if (res.ok) {
                const data = await res.json();
                setBlogs(data);
            }
        } catch (err) {
            console.error('Error fetching blogs:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const openEditor = (blog = null) => {
        if (blog) {
            setEditingBlog(blog);
            setForm({
                title: blog.title,
                content: blog.content,
                excerpt: blog.excerpt || '',
                cover_image: blog.cover_image || '',
                author: blog.author || 'Varaha Jewels',
                tags: blog.tags || [],
                is_published: blog.is_published,
            });
        } else {
            setEditingBlog(null);
            setForm(emptyForm);
        }
        setShowEditor(true);
    };

    const handleSave = async () => {
        if (!form.title.trim()) {
            toast.error('Title is required');
            return;
        }
        setIsSaving(true);
        const token = localStorage.getItem('admin_token');

        try {
            const method = editingBlog ? 'PUT' : 'POST';
            const url = editingBlog
                ? `${API_URL}/api/admin/blogs/${editingBlog.id}`
                : `${API_URL}/api/admin/blogs`;

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(form)
            });

            if (res.ok) {
                toast.success(editingBlog ? 'Blog updated!' : 'Blog created!');
                setShowEditor(false);
                fetchBlogs();
            } else {
                const err = await res.json();
                toast.error(err.detail || 'Failed to save');
            }
        } catch (err) {
            toast.error('Error saving blog');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (blog) => {
        const ok = await toast.confirm(`Delete "${blog.title}"?`, { confirmText: 'Delete', type: 'warning' });
        if (!ok) return;

        const token = localStorage.getItem('admin_token');
        try {
            const res = await fetch(`${API_URL}/api/admin/blogs/${blog.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                toast.success('Blog deleted');
                fetchBlogs();
            }
        } catch (err) {
            toast.error('Failed to delete');
        }
    };

    const togglePublish = async (blog) => {
        const token = localStorage.getItem('admin_token');
        try {
            const res = await fetch(`${API_URL}/api/admin/blogs/${blog.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ is_published: !blog.is_published })
            });
            if (res.ok) {
                toast.success(blog.is_published ? 'Moved to Draft' : 'Published!');
                fetchBlogs();
            }
        } catch (err) {
            toast.error('Failed to update');
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const token = localStorage.getItem('admin_token');
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch(`${API_URL}/api/upload`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            if (res.ok) {
                const data = await res.json();
                setForm(prev => ({ ...prev, cover_image: data.url || data.secure_url || data.image_url }));
                toast.success('Image uploaded!');
            } else {
                toast.error('Upload failed');
            }
        } catch (err) {
            toast.error('Upload error');
        }
    };

    const addTag = () => {
        const tag = tagInput.trim();
        if (tag && !form.tags.includes(tag)) {
            setForm(prev => ({ ...prev, tags: [...prev.tags, tag] }));
        }
        setTagInput('');
    };

    const removeTag = (tag) => {
        setForm(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
    };

    const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

    // ─── EDITOR VIEW ───
    if (showEditor) {
        return (
            <AdminLayout>
                <Head><title>{editingBlog ? 'Edit Blog' : 'New Blog'} - Varaha Admin</title></Head>

                <div className="flex items-center justify-between mb-6">
                    <button onClick={() => setShowEditor(false)} className="flex items-center gap-2 text-gray-500 hover:text-heritage transition-colors">
                        <ArrowLeft size={18} /> Back to Blogs
                    </button>
                    <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={form.is_published}
                                onChange={(e) => setForm(prev => ({ ...prev, is_published: e.target.checked }))}
                                className="w-4 h-4 text-copper rounded focus:ring-copper"
                            />
                            <span className="text-sm font-medium text-gray-700">Publish</span>
                        </label>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="px-5 py-2 bg-copper text-white rounded-lg hover:bg-amber-700 transition-colors font-semibold text-sm flex items-center gap-2"
                        >
                            <Save size={16} /> {isSaving ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-4">
                        <div>
                            <input
                                type="text"
                                placeholder="Blog Title..."
                                value={form.title}
                                onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                                className="w-full text-2xl font-bold text-gray-800 border-0 border-b-2 border-gray-200 focus:border-copper focus:ring-0 outline-none py-3 bg-transparent placeholder-gray-300"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Excerpt (Short Summary)</label>
                            <textarea
                                placeholder="Write a brief summary for the blog listing..."
                                value={form.excerpt}
                                onChange={(e) => setForm(prev => ({ ...prev, excerpt: e.target.value }))}
                                rows={2}
                                className="w-full border border-gray-200 rounded-lg p-3 focus:border-copper focus:ring-1 focus:ring-copper outline-none resize-none text-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Content (HTML)</label>
                            <textarea
                                placeholder="Write your blog content here... HTML is supported. Use <h2>, <h3>, <p>, <strong>, <ul>, <li>, <blockquote>, <img> tags."
                                value={form.content}
                                onChange={(e) => setForm(prev => ({ ...prev, content: e.target.value }))}
                                rows={20}
                                className="w-full border border-gray-200 rounded-lg p-4 focus:border-copper focus:ring-1 focus:ring-copper outline-none resize-y text-sm font-mono leading-relaxed"
                            />
                        </div>

                        {/* Content Preview */}
                        {form.content && (
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Preview</label>
                                <div
                                    className="border border-gray-200 rounded-lg p-6 prose prose-sm max-w-none bg-white prose-headings:text-heritage prose-a:text-copper"
                                    dangerouslySetInnerHTML={{ __html: form.content }}
                                />
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-5">
                        {/* Cover Image */}
                        <div className="bg-white rounded-xl border border-gray-100 p-4">
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Cover Image</label>
                            {form.cover_image ? (
                                <div className="relative rounded-lg overflow-hidden mb-3">
                                    <img src={form.cover_image} alt="Cover" className="w-full aspect-[16/10] object-cover" />
                                    <button
                                        onClick={() => setForm(prev => ({ ...prev, cover_image: '' }))}
                                        className="absolute top-2 right-2 w-7 h-7 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ) : (
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center cursor-pointer hover:border-copper/50 transition-colors"
                                >
                                    <Image size={28} className="mx-auto text-gray-300 mb-2" />
                                    <p className="text-xs text-gray-400">Click to upload</p>
                                </div>
                            )}
                            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                            <input
                                type="text"
                                placeholder="Or paste image URL..."
                                value={form.cover_image}
                                onChange={(e) => setForm(prev => ({ ...prev, cover_image: e.target.value }))}
                                className="w-full mt-2 text-xs border border-gray-200 rounded-lg p-2 focus:border-copper outline-none"
                            />
                        </div>

                        {/* Author */}
                        <div className="bg-white rounded-xl border border-gray-100 p-4">
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Author</label>
                            <input
                                type="text"
                                value={form.author}
                                onChange={(e) => setForm(prev => ({ ...prev, author: e.target.value }))}
                                className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:border-copper outline-none"
                            />
                        </div>

                        {/* Tags */}
                        <div className="bg-white rounded-xl border border-gray-100 p-4">
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Tags</label>
                            <div className="flex flex-wrap gap-1.5 mb-3">
                                {form.tags.map(tag => (
                                    <span key={tag} className="inline-flex items-center gap-1 bg-copper/10 text-copper text-xs font-medium px-2.5 py-1 rounded-full">
                                        {tag}
                                        <button onClick={() => removeTag(tag)} className="hover:text-red-500 transition-colors">
                                            <X size={12} />
                                        </button>
                                    </span>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Add tag..."
                                    value={tagInput}
                                    onChange={(e) => setTagInput(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                                    className="flex-1 border border-gray-200 rounded-lg p-2 text-sm focus:border-copper outline-none"
                                />
                                <button onClick={addTag} className="px-3 py-2 bg-gray-100 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
                                    Add
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    // ─── LIST VIEW ───
    return (
        <AdminLayout>
            <Head><title>Blogs - Varaha Admin</title></Head>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h1 className="text-2xl font-bold text-gray-800">Blog Posts</h1>
                <button
                    onClick={() => openEditor()}
                    className="px-4 py-2 bg-copper text-white rounded-lg hover:bg-amber-700 transition-colors font-semibold text-sm flex items-center gap-2"
                >
                    <Plus size={16} /> New Post
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {isLoading ? (
                    <div className="p-12 text-center text-gray-500">Loading blogs...</div>
                ) : blogs.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="text-5xl mb-3">📝</div>
                        <h3 className="text-lg font-bold text-gray-800 mb-1">No blog posts yet</h3>
                        <p className="text-gray-500 text-sm mb-4">Create your first blog post to engage customers.</p>
                        <button onClick={() => openEditor()} className="text-copper font-semibold text-sm hover:underline">
                            + Create First Post
                        </button>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {blogs.map(blog => (
                            <div key={blog.id} className="p-4 sm:p-5 hover:bg-gray-50/50 transition-colors flex flex-col sm:flex-row gap-4">
                                {/* Thumbnail */}
                                <div className="flex-shrink-0 w-full sm:w-32 h-20 sm:h-20 rounded-lg overflow-hidden bg-gray-100">
                                    {blog.cover_image ? (
                                        <img src={blog.cover_image} alt={blog.title} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-heritage/10 to-copper/10 flex items-center justify-center">
                                            <span className="text-2xl">✍️</span>
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <h3 className="font-semibold text-gray-800 text-sm sm:text-base line-clamp-1">{blog.title}</h3>
                                            <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                                                <span>{formatDate(blog.created_at)}</span>
                                                <span>by {blog.author}</span>
                                            </div>
                                        </div>
                                        <span className={`flex-shrink-0 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                            blog.is_published
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-yellow-100 text-yellow-700'
                                        }`}>
                                            {blog.is_published ? 'Published' : 'Draft'}
                                        </span>
                                    </div>

                                    {/* Tags */}
                                    {blog.tags && blog.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-2">
                                            {blog.tags.map(tag => (
                                                <span key={tag} className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{tag}</span>
                                            ))}
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 mt-3">
                                        <button onClick={() => openEditor(blog)} className="p-1.5 text-gray-400 hover:text-copper transition-colors" title="Edit">
                                            <Edit3 size={16} />
                                        </button>
                                        <button onClick={() => togglePublish(blog)} className="p-1.5 text-gray-400 hover:text-copper transition-colors" title={blog.is_published ? 'Unpublish' : 'Publish'}>
                                            {blog.is_published ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                        {blog.is_published && (
                                            <a href={`/blogs/${blog.slug}`} target="_blank" rel="noopener noreferrer" className="p-1.5 text-gray-400 hover:text-blue-500 transition-colors" title="View">
                                                <ExternalLink size={16} />
                                            </a>
                                        )}
                                        <button onClick={() => handleDelete(blog)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors ml-auto" title="Delete">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
