import { useState, useRef } from 'react';
import { getApiUrl } from '../../../lib/config';
import Link from 'next/link';
import AdminLayout from '../../../components/admin/AdminLayout';
import { Upload, FileSpreadsheet, Check, AlertCircle, Download, X, ArrowLeft, Loader2 } from 'lucide-react';
import Head from 'next/head';

const CSV_COLUMNS = [
    { key: 'name', label: 'Name', required: true },
    { key: 'price', label: 'Price', required: false },
    { key: 'stock', label: 'Stock', required: false },
    { key: 'category', label: 'Category', required: false },
    { key: 'metal', label: 'Metal', required: false },
    { key: 'carat', label: 'Carat', required: false },
    { key: 'stones', label: 'Stones', required: false },
    { key: 'polish', label: 'Polish', required: false },
    { key: 'image', label: 'Image URL', required: true },
    { key: 'additional_images', label: 'Additional Images (comma separated URLs)', required: false },
    { key: 'description', label: 'Description', required: false },
    { key: 'gender', label: 'Gender (Men/Women)', required: false },
    { key: 'collection', label: 'Collection', required: false },
    { key: 'product_type', label: 'Product Type', required: false },
    { key: 'colour', label: 'Colour', required: false },
    { key: 'tag', label: 'Tag', required: false },
    { key: 'premium', label: 'Premium (true/false)', required: false },
    { key: 'style', label: 'Style', required: false },
];

function parseCSV(text) {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    // Parse header
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''));

    const products = [];
    for (let i = 1; i < lines.length; i++) {
        const values = [];
        let current = '';
        let inQuotes = false;

        // Handle CSV with quoted fields
        for (const char of lines[i]) {
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        values.push(current.trim());

        const product = {};
        headers.forEach((header, idx) => {
            let val = values[idx] || '';
            val = val.replace(/^['"]|['"]$/g, ''); // Remove surrounding quotes

            // Map common header variations
            const key = header
                .replace('product name', 'name')
                .replace('product_name', 'name')
                .replace('image url', 'image')
                .replace('image_url', 'image')
                .replace('product type', 'product_type')
                .replace('additional images', 'additional_images');

            if (key === 'price' || key === 'stock') {
                product[key] = val ? Number(val) : null;
            } else if (key === 'premium') {
                product[key] = val.toLowerCase() === 'true' || val === '1';
            } else if (key === 'additional_images') {
                // Convert comma-separated URLs to JSON array
                if (val) {
                    const urls = val.split('|').map(u => u.trim()).filter(Boolean);
                    product[key] = JSON.stringify(urls);
                } else {
                    product[key] = '[]';
                }
            } else {
                product[key] = val || null;
            }
        });

        // Only add if has a name
        if (product.name) {
            products.push(product);
        }
    }

    return products;
}

export default function BulkUpload() {
    const [parsedProducts, setParsedProducts] = useState([]);
    const [fileName, setFileName] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [result, setResult] = useState(null);
    const [errors, setErrors] = useState([]);
    const fileRef = useRef(null);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setFileName(file.name);
        setResult(null);
        setErrors([]);

        const reader = new FileReader();
        reader.onload = (ev) => {
            const text = ev.target.result;
            const products = parseCSV(text);

            // Validate
            const validationErrors = [];
            products.forEach((p, idx) => {
                if (!p.name) validationErrors.push(`Row ${idx + 1}: Name is required`);
                if (!p.image) validationErrors.push(`Row ${idx + 1}: Image URL is required`);
            });

            setErrors(validationErrors);
            setParsedProducts(products);
        };
        reader.readAsText(file);
    };

    const handleUpload = async () => {
        if (parsedProducts.length === 0) return;
        setIsUploading(true);
        setResult(null);

        try {
            const API_URL = getApiUrl();
            const token = localStorage.getItem('admin_token');
            const res = await fetch(`${API_URL}/api/products/bulk`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(parsedProducts)
            });

            const data = await res.json();
            if (res.ok) {
                setResult(data);
                if (data.success > 0) {
                    setParsedProducts([]);
                    setFileName('');
                }
            } else {
                setErrors([data.detail || 'Upload failed']);
            }
        } catch (error) {
            setErrors([error.message]);
        } finally {
            setIsUploading(false);
        }
    };

    const downloadTemplate = () => {
        const headers = CSV_COLUMNS.map(c => c.key).join(',');
        const sampleRow = 'Gold Necklace,5000,10,Heritage,Gold,22K,Kundan,,https://example.com/image.jpg,,Beautiful necklace,Women,Bridal,Necklace,Gold,Featured,false,Traditional';
        const csv = headers + '\n' + sampleRow;
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'varaha_products_template.csv';
        a.click();
        URL.revokeObjectURL(url);
    };

    const removeProduct = (idx) => {
        setParsedProducts(prev => prev.filter((_, i) => i !== idx));
    };

    return (
        <AdminLayout>
            <Head>
                <title>Bulk Upload - Varaha Admin</title>
            </Head>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                    <Link href="/admin/products" className="text-sm text-gray-500 hover:text-copper flex items-center gap-1 mb-2">
                        <ArrowLeft size={16} /> Back to Products
                    </Link>
                    <h1 className="text-xl font-bold text-gray-800">Bulk Product Upload</h1>
                </div>
                <button
                    onClick={downloadTemplate}
                    className="px-4 py-2 border border-copper text-copper font-medium rounded-lg flex items-center gap-2 hover:bg-copper/5 transition-all"
                >
                    <Download size={18} />
                    Download CSV Template
                </button>
            </div>

            {/* Upload Area */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
                <div
                    className="p-8 border-2 border-dashed border-gray-200 rounded-xl m-4 text-center hover:border-copper/50 transition-colors cursor-pointer"
                    onClick={() => fileRef.current?.click()}
                >
                    <input
                        ref={fileRef}
                        type="file"
                        accept=".csv"
                        onChange={handleFileChange}
                        className="hidden"
                    />
                    <FileSpreadsheet size={48} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-600 font-medium mb-1">
                        {fileName || 'Click to upload CSV file'}
                    </p>
                    <p className="text-sm text-gray-400">
                        Supports .csv format. Max 500 products per upload.
                    </p>
                </div>

                {/* CSV Format Guide */}
                <div className="px-6 pb-6">
                    <details className="group">
                        <summary className="text-sm font-medium text-copper cursor-pointer hover:underline">
                            📋 CSV Column Guide
                        </summary>
                        <div className="mt-3 overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-gray-50">
                                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">Column</th>
                                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">Required</th>
                                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">Example</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {CSV_COLUMNS.map(col => (
                                        <tr key={col.key}>
                                            <td className="px-3 py-2 font-mono text-xs text-gray-700">{col.key}</td>
                                            <td className="px-3 py-2">
                                                {col.required ? (
                                                    <span className="text-red-500 text-xs font-bold">Required</span>
                                                ) : (
                                                    <span className="text-gray-400 text-xs">Optional</span>
                                                )}
                                            </td>
                                            <td className="px-3 py-2 text-xs text-gray-500">
                                                {col.key === 'name' && 'Gold Necklace'}
                                                {col.key === 'price' && '5000'}
                                                {col.key === 'stock' && '10'}
                                                {col.key === 'category' && 'Heritage'}
                                                {col.key === 'metal' && 'Gold'}
                                                {col.key === 'image' && 'https://...'}
                                                {col.key === 'gender' && 'Women'}
                                                {col.key === 'premium' && 'true / false'}
                                                {col.key === 'additional_images' && 'url1|url2|url3'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </details>
                </div>
            </div>

            {/* Validation Errors */}
            {errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                    <div className="flex items-center gap-2 text-red-700 font-medium mb-2">
                        <AlertCircle size={18} />
                        Validation Errors
                    </div>
                    <ul className="list-disc list-inside text-sm text-red-600 space-y-1">
                        {errors.map((err, i) => (
                            <li key={i}>{err}</li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Success Result */}
            {result && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
                    <div className="flex items-center gap-2 text-green-700 font-medium mb-2">
                        <Check size={18} />
                        Upload Successful!
                    </div>
                    <p className="text-sm text-green-600">
                        {result.success} products added successfully.
                        {result.errors?.length > 0 && ` ${result.errors.length} failed.`}
                    </p>
                </div>
            )}

            {/* Preview Table */}
            {parsedProducts.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                        <h2 className="font-semibold text-gray-800">
                            Preview ({parsedProducts.length} products)
                        </h2>
                        <button
                            onClick={handleUpload}
                            disabled={isUploading || errors.length > 0}
                            className={`px-6 py-2.5 font-medium rounded-lg flex items-center gap-2 transition-all ${isUploading || errors.length > 0
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-copper to-heritage text-white hover:shadow-lg'
                                }`}
                        >
                            {isUploading ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    Uploading...
                                </>
                            ) : (
                                <>
                                    <Upload size={18} />
                                    Upload {parsedProducts.length} Products
                                </>
                            )}
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">#</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Name</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Price</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Stock</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Category</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Metal</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Gender</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Image</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {parsedProducts.map((p, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-gray-400">{idx + 1}</td>
                                        <td className="px-4 py-3 font-medium text-gray-900">{p.name}</td>
                                        <td className="px-4 py-3">₹{p.price?.toLocaleString() || '-'}</td>
                                        <td className="px-4 py-3">{p.stock ?? '-'}</td>
                                        <td className="px-4 py-3">{p.category || '-'}</td>
                                        <td className="px-4 py-3">{p.metal || '-'}</td>
                                        <td className="px-4 py-3">{p.gender || '-'}</td>
                                        <td className="px-4 py-3">
                                            {p.image ? (
                                                <img src={p.image} alt="" className="w-10 h-10 object-cover rounded border"
                                                    onError={(e) => e.target.src = '/varaha-assets/logo.png'} />
                                            ) : (
                                                <span className="text-red-500 text-xs">Missing</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <button
                                                onClick={() => removeProduct(idx)}
                                                className="text-gray-300 hover:text-red-500 transition-colors"
                                            >
                                                <X size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
