import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../components/AdminLayout';
import { getApiUrl, getAuthHeaders } from '../../lib/config';
import { Plus, Edit2, Trash2, Eye, EyeOff } from 'lucide-react';

export default function CategoriesAdmin() {
    const router = useRouter();
    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        display_name: '',
        gender: '',
        description: '',
        is_active: true,
        sort_order: 0
    });

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const API_URL = getApiUrl();
            const res = await fetch(`${API_URL}/api/categories?active_only=false`, {
                headers: getAuthHeaders()
            });
            if (res.ok) {
                const data = await res.json();
                setCategories(data);
            }
        } catch (error) {
            console.error("Error fetching categories:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const API_URL = getApiUrl();

        try {
            const url = editingCategory
                ? `${API_URL}/api/categories/${editingCategory.id}`
                : `${API_URL}/api/categories`;

            const method = editingCategory ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: {
                    ...getAuthHeaders(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                alert(editingCategory ? 'Category updated!' : 'Category created!');
                setShowModal(false);
                resetForm();
                fetchCategories();
            } else {
                const error = await res.json();
                alert(error.detail || 'Error saving category');
            }
        } catch (error) {
            console.error("Error saving category:", error);
            alert('Error saving category');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this category?')) return;

        const API_URL = getApiUrl();
        try {
            const res = await fetch(`${API_URL}/api/categories/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            if (res.ok) {
                alert('Category deleted!');
                fetchCategories();
            }
        } catch (error) {
            console.error("Error deleting category:", error);
        }
    };

    const openEditModal = (category) => {
        setEditingCategory(category);
        setFormData({
            name: category.name,
            display_name: category.display_name,
            gender: category.gender || '',
            description: category.description || '',
            is_active: category.is_active,
            sort_order: category.sort_order
        });
        setShowModal(true);
    };

    const resetForm = () => {
        setEditingCategory(null);
        setFormData({
            name: '',
            display_name: '',
            gender: '',
            description: '',
            is_active: true,
            sort_order: 0
        });
    };

    return (
        <AdminLayout>
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-heritage">Category Management</h1>
                    <button
                        onClick={() => { resetForm(); setShowModal(true); }}
                        className="flex items-center gap-2 px-4 py-2 bg-copper text-white rounded-lg hover:bg-heritage transition"
                    >
                        <Plus size={20} /> Add Category
                    </button>
                </div>

                {isLoading ? (
                    <div className="text-center py-8">Loading...</div>
                ) : (
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Display Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gender</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {categories.map((cat) => (
                                    <tr key={cat.id}>
                                        <td className="px-6 py-4 whitespace-nowrap font-medium">{cat.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{cat.display_name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 rounded text-xs ${cat.gender === 'Men' ? 'bg-blue-100 text-blue-800' :
                                                    cat.gender === 'Women' ? 'bg-pink-100 text-pink-800' :
                                                        'bg-gray-100 text-gray-800'
                                                }`}>
                                                {cat.gender || 'Both'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">{cat.sort_order}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {cat.is_active ? (
                                                <span className="flex items-center gap-1 text-green-600">
                                                    <Eye size={16} /> Active
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1 text-gray-400">
                                                    <EyeOff size={16} /> Inactive
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => openEditModal(cat)}
                                                    className="text-copper hover:text-heritage"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(cat.id)}
                                                    className="text-red-500 hover:text-red-700"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 w-full max-w-md">
                            <h2 className="text-xl font-bold mb-4">
                                {editingCategory ? 'Edit Category' : 'Add Category'}
                            </h2>
                            <form onSubmit={handleSubmit}>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Category Name (English)</label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full p-2 border rounded-lg"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Display Name (Hindi/Custom)</label>
                                        <input
                                            type="text"
                                            value={formData.display_name}
                                            onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                                            className="w-full p-2 border rounded-lg"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Gender</label>
                                        <select
                                            value={formData.gender}
                                            onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                            className="w-full p-2 border rounded-lg"
                                        >
                                            <option value="">Both</option>
                                            <option value="Men">Men</option>
                                            <option value="Women">Women</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Description</label>
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            className="w-full p-2 border rounded-lg"
                                            rows="3"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Sort Order</label>
                                        <input
                                            type="number"
                                            value={formData.sort_order}
                                            onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) })}
                                            className="w-full p-2 border rounded-lg"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={formData.is_active}
                                            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                            className="rounded"
                                        />
                                        <label className="text-sm font-medium">Active</label>
                                    </div>
                                </div>
                                <div className="flex gap-2 mt-6">
                                    <button
                                        type="submit"
                                        className="flex-1 bg-copper text-white py-2 rounded-lg hover:bg-heritage transition"
                                    >
                                        {editingCategory ? 'Update' : 'Create'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setShowModal(false); resetForm(); }}
                                        className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300 transition"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
