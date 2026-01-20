import AdminLayout from '../../components/admin/AdminLayout';
import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Calendar, Download, RefreshCw, Filter } from 'lucide-react';
import Head from 'next/head';
import { getApiUrl } from '../../lib/config';

export default function Reports() {
    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState([]);
    const [stats, setStats] = useState({ total_sales: 0, total_orders: 0 });

    // Filters
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [status, setStatus] = useState('all');

    const fetchReport = async () => {
        setLoading(true);
        try {
            const API_URL = getApiUrl();
            const token = localStorage.getItem('token');

            const params = new URLSearchParams();
            if (startDate) params.append('start_date', startDate);
            if (endDate) params.append('end_date', endDate);
            if (status !== 'all') params.append('status', status.charAt(0).toUpperCase() + status.slice(1)); // Capitalize

            const res = await fetch(`${API_URL}/api/admin/reports/sales?${params.toString()}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (res.ok) {
                const data = await res.json();
                setReportData(data.data);
                setStats(data.stats);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        try {
            const API_URL = getApiUrl();
            const token = localStorage.getItem('token');
            const params = new URLSearchParams();
            if (startDate) params.append('start_date', startDate);
            if (endDate) params.append('end_date', endDate);
            if (status !== 'all') params.append('status', status.charAt(0).toUpperCase() + status.slice(1));
            params.append('export', 'true');

            const res = await fetch(`${API_URL}/api/admin/reports/sales?${params.toString()}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `sales_report_${new Date().toISOString().split('T')[0]}.csv`;
                document.body.appendChild(a);
                a.click();
                a.remove();
            }
        } catch (err) {
            console.error("Export failed", err);
        }
    };

    const handleGSTR1Export = async () => {
        try {
            const API_URL = getApiUrl();
            const token = localStorage.getItem('token');
            const params = new URLSearchParams();
            if (startDate) params.append('start_date', startDate);
            if (endDate) params.append('end_date', endDate);

            // Validate: Start Date is required for FP
            if (!startDate) {
                alert("Please select a Start Date to determine the Financial Period.");
                return;
            }

            const res = await fetch(`${API_URL}/api/admin/reports/gstr1?${params.toString()}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `GSTR1_${new Date().toISOString().split('T')[0]}.json`;
                document.body.appendChild(a);
                a.click();
                a.remove();
            } else {
                alert("Failed to export JSON");
            }
        } catch (err) {
            console.error("GSTR1 Export failed", err);
        }
    };

    useEffect(() => {
        // Set default dates to current month? Or just fetch all.
        // Let's fetch all initially.
        fetchReport();
    }, []);

    return (
        <AdminLayout>
            <Head>
                <title>Reports & Analytics | Admin</title>
            </Head>

            <div className="p-8 max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-serif font-bold text-gray-900 tracking-tight">Reports & Analytics</h1>
                        <p className="text-gray-500 mt-2 text-sm">Comprehensive sales insights and GST compliance reports.</p>
                    </div>
                </div>

                {/* Filters & Actions Bar */}
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-lg shadow-gray-100/50 flex flex-col lg:flex-row gap-5 items-end lg:items-center">

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full lg:w-auto flex-1">
                        {/* Start Date */}
                        <div className="relative group">
                            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">Start Date</label>
                            <div className="relative flex items-center">
                                <Calendar className="absolute left-3 text-copper/70 group-focus-within:text-copper transition-colors" size={18} />
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 outline-none focus:bg-white focus:border-copper focus:ring-4 focus:ring-copper/10 transition-all cursor-pointer"
                                />
                            </div>
                        </div>

                        {/* End Date */}
                        <div className="relative group">
                            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">End Date</label>
                            <div className="relative flex items-center">
                                <Calendar className="absolute left-3 text-copper/70 group-focus-within:text-copper transition-colors" size={18} />
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 outline-none focus:bg-white focus:border-copper focus:ring-4 focus:ring-copper/10 transition-all cursor-pointer"
                                />
                            </div>
                        </div>

                        {/* Status */}
                        <div className="relative group">
                            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">Order Status</label>
                            <div className="relative flex items-center">
                                <Filter className="absolute left-3 text-copper/70 group-focus-within:text-copper transition-colors" size={18} />
                                <select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 outline-none focus:bg-white focus:border-copper focus:ring-4 focus:ring-copper/10 transition-all appearance-none cursor-pointer"
                                    style={{ backgroundImage: 'none' }}
                                >
                                    <option value="all">All Statuses</option>
                                    <option value="paid">Paid</option>
                                    <option value="delivered">Delivered</option>
                                    <option value="pending">Pending</option>
                                    <option value="shipped">Shipped</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3 w-full lg:w-auto mt-2 lg:mt-6">
                        <button
                            onClick={fetchReport}
                            className="flex-1 lg:flex-none px-6 py-2.5 bg-gray-800 hover:bg-gray-900 text-white rounded-xl text-sm font-medium transition-all shadow-md hover:shadow-lg active:scale-95 flex items-center justify-center gap-2"
                        >
                            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                            <span className="hidden sm:inline">Apply</span>
                        </button>

                        <div className="h-8 w-px bg-gray-200 hidden lg:block mx-1"></div>

                        <button
                            onClick={handleGSTR1Export}
                            className="flex-1 lg:flex-none px-5 py-2.5 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 group"
                        >
                            <Download size={18} className="group-hover:-translate-y-0.5 transition-transform" />
                            GSTR1 JSON
                        </button>

                        <button
                            onClick={handleExport}
                            className="flex-1 lg:flex-none px-5 py-2.5 bg-gradient-to-r from-copper to-amber-700 text-white hover:from-amber-700 hover:to-copper rounded-xl text-sm font-medium transition-all shadow-md hover:shadow-copper/30 active:scale-95 flex items-center justify-center gap-2 group"
                        >
                            <Download size={18} className="group-hover:-translate-y-0.5 transition-transform" />
                            Export CSV
                        </button>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <TrendingUp size={80} className="text-copper" />
                        </div>
                        <div className="flex items-center gap-4 mb-2">
                            <div className="p-3 bg-copper/10 text-copper rounded-xl">
                                <TrendingUp size={24} />
                            </div>
                            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Total Revenue</h3>
                        </div>
                        <p className="text-4xl font-serif font-bold text-gray-900 mt-2">
                            ₹{stats.total_sales.toLocaleString('en-IN')}
                        </p>
                        <p className="text-xs text-gray-400 mt-2 font-medium">For the selected period</p>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <BarChart3 size={80} className="text-blue-600" />
                        </div>
                        <div className="flex items-center gap-4 mb-2">
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                                <BarChart3 size={24} />
                            </div>
                            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Total Orders</h3>
                        </div>
                        <p className="text-4xl font-serif font-bold text-gray-900 mt-2">
                            {stats.total_orders.toLocaleString('en-IN')}
                        </p>
                        <p className="text-xs text-gray-400 mt-2 font-medium">processed successfully</p>
                    </div>
                </div>

                {/* Data Table */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-xl shadow-gray-100/50 overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                        <h3 className="font-bold text-gray-800">Detailed Transaction Log</h3>
                        <span className="text-xs font-medium text-gray-500 bg-white px-2 py-1 rounded-md border border-gray-200">
                            Showing {reportData.length} records
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-wider border-b border-gray-200">
                                    <th className="px-6 py-4">Order Details</th>
                                    <th className="px-6 py-4">Customer</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Location</th>
                                    <th className="px-6 py-4 text-right">Taxable</th>
                                    <th className="px-6 py-4 text-right">GST (3%)</th>
                                    <th className="px-6 py-4 text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-12 text-center">
                                            <div className="flex flex-col items-center justify-center gap-3">
                                                <RefreshCw size={24} className="animate-spin text-copper" />
                                                <span className="text-sm font-medium text-gray-500">Loading Report Data...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : reportData.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-12 text-center text-gray-400">
                                            No orders found for the selected criteria.
                                        </td>
                                    </tr>
                                ) : (
                                    reportData.map((row) => (
                                        <tr key={row.order_id} className="group hover:bg-gray-50/80 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-gray-900 group-hover:text-copper transition-colors">{row.order_id}</div>
                                                <div className="text-xs text-gray-400 mt-0.5">{row.date}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-gray-800 text-sm">{row.customer}</div>
                                                <div className="text-xs text-gray-400 mt-0.5">{row.email}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold capitalize
                                                    ${row.status === 'paid' || row.status === 'delivered' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                                                        row.status === 'pending' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                                                            'bg-gray-100 text-gray-600 border border-gray-200'}`}>
                                                    {row.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {row.state || <span className="text-gray-300 italic">N/A</span>}
                                            </td>
                                            <td className="px-6 py-4 text-right text-sm font-medium text-gray-600">
                                                ₹{row.taxable_value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-6 py-4 text-right text-sm font-medium text-gray-600">
                                                ₹{(row.cgst + row.sgst + row.igst).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="font-bold text-gray-900">
                                                    ₹{row.gross_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
