import { useState, useEffect } from 'react';
import { getApiUrl } from '../../lib/config';
import AdminLayout from '../../components/admin/AdminLayout';
import Head from 'next/head';
import { Users, Activity, Calendar, TrendingUp, MapPin, Globe, Building2 } from 'lucide-react';

export default function Analytics() {
    const [stats, setStats] = useState({
        active_users: 0,
        daily_stats: [],
        total_visits: 0
    });
    const [geo, setGeo] = useState({
        top_states: [],
        top_countries: [],
        top_cities: []
    });
    const [isLoading, setIsLoading] = useState(true);
    const [logs, setLogs] = useState([]);

    useEffect(() => {
        fetchAnalytics();
        const interval = setInterval(fetchAnalytics, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchAnalytics = async () => {
        try {
            const API_URL = getApiUrl();
            const [statsRes, logsRes, geoRes] = await Promise.all([
                fetch(`${API_URL}/api/analytics`),
                fetch(`${API_URL}/api/analytics/logs?limit=50`),
                fetch(`${API_URL}/api/analytics/geo`)
            ]);

            if (statsRes.ok) setStats(await statsRes.json());
            if (logsRes.ok) setLogs(await logsRes.json());
            if (geoRes.ok) setGeo(await geoRes.json());
        } catch (error) {
            console.error('Error fetching analytics:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const maxStateVisits = geo.top_states.length > 0 ? geo.top_states[0].visits : 1;

    return (
        <AdminLayout>
            <Head>
                <title>Analytics - Varaha Admin</title>
            </Head>

            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-800">Traffic Analytics</h1>
                <p className="text-gray-500">Real-time visitor tracking & location insights</p>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="p-3 bg-green-100 text-green-600 rounded-lg">
                        <Activity size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Active Today</p>
                        <h2 className="text-3xl font-bold text-gray-800 animate-pulse">
                            {stats.active_users}
                        </h2>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                        <Users size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Total Visits (All Time)</p>
                        <h2 className="text-3xl font-bold text-gray-800">
                            {stats.total_visits}
                        </h2>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
                        <Globe size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Countries</p>
                        <h2 className="text-3xl font-bold text-gray-800">
                            {geo.top_countries.length}
                        </h2>
                    </div>
                </div>
            </div>

            {/* Geo Location Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                {/* Top States */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-5 border-b border-gray-100 flex items-center gap-2">
                        <MapPin size={18} className="text-copper" />
                        <h3 className="font-bold text-gray-800">Top States</h3>
                    </div>
                    <div className="p-4 max-h-[400px] overflow-y-auto">
                        {geo.top_states.length === 0 ? (
                            <p className="text-center text-gray-400 py-8 text-sm">No location data yet. Data appears after visitors come.</p>
                        ) : (
                            <div className="space-y-3">
                                {geo.top_states.map((item, idx) => (
                                    <div key={item.state}>
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                                <span className={`text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full ${idx < 3 ? 'bg-copper text-white' : 'bg-gray-100 text-gray-500'}`}>
                                                    {idx + 1}
                                                </span>
                                                {item.state}
                                            </span>
                                            <div className="text-right">
                                                <span className="text-sm font-bold text-gray-800">{item.visits}</span>
                                                <span className="text-xs text-gray-400 ml-1">({item.unique_visitors} unique)</span>
                                            </div>
                                        </div>
                                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-copper to-heritage rounded-full transition-all duration-500"
                                                style={{ width: `${(item.visits / maxStateVisits) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Top Countries */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-5 border-b border-gray-100 flex items-center gap-2">
                        <Globe size={18} className="text-blue-500" />
                        <h3 className="font-bold text-gray-800">Top Countries</h3>
                    </div>
                    <div className="p-4 max-h-[400px] overflow-y-auto">
                        {geo.top_countries.length === 0 ? (
                            <p className="text-center text-gray-400 py-8 text-sm">No data yet</p>
                        ) : (
                            <div className="space-y-2">
                                {geo.top_countries.map((item, idx) => (
                                    <div key={item.country} className="flex justify-between items-center p-2.5 rounded-lg hover:bg-gray-50 transition-colors">
                                        <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                            <span className="text-lg">
                                                {item.country === 'India' ? '🇮🇳' : item.country === 'United States' ? '🇺🇸' : item.country === 'United Kingdom' ? '🇬🇧' : '🌍'}
                                            </span>
                                            {item.country}
                                        </span>
                                        <div className="text-right">
                                            <span className="text-sm font-bold text-gray-800">{item.visits}</span>
                                            <span className="text-xs text-gray-400 ml-1">visits</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Top Cities */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-5 border-b border-gray-100 flex items-center gap-2">
                        <Building2 size={18} className="text-green-500" />
                        <h3 className="font-bold text-gray-800">Top Cities</h3>
                    </div>
                    <div className="p-4 max-h-[400px] overflow-y-auto">
                        {geo.top_cities.length === 0 ? (
                            <p className="text-center text-gray-400 py-8 text-sm">No data yet</p>
                        ) : (
                            <div className="space-y-2">
                                {geo.top_cities.map((item) => (
                                    <div key={`${item.city}-${item.state}`} className="flex justify-between items-center p-2.5 rounded-lg hover:bg-gray-50 transition-colors">
                                        <div>
                                            <span className="text-sm font-medium text-gray-700">{item.city}</span>
                                            <span className="text-xs text-gray-400 ml-1">({item.state})</span>
                                        </div>
                                        <span className="text-sm font-bold text-gray-800">{item.visits}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Daily Traffic */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100">
                        <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                            <Calendar size={20} className="text-gray-500" />
                            Last 30 Days Traffic
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase text-right">Visits</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase text-right">Trend</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {stats.daily_stats.length === 0 ? (
                                    <tr>
                                        <td colSpan="3" className="p-8 text-center text-gray-500">
                                            No data yet.
                                        </td>
                                    </tr>
                                ) : (
                                    stats.daily_stats.map((day) => (
                                        <tr key={day.date} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 font-mono text-gray-700">{day.date}</td>
                                            <td className="px-6 py-4 text-right font-bold text-gray-800">{day.visits}</td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="inline-block w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-copper"
                                                        style={{ width: `${Math.min(100, day.visits * 5)}%` }}
                                                    ></div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Recent Activity Logs */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100">
                        <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                            <Activity size={20} className="text-gray-500" />
                            Recent Activity
                        </h3>
                    </div>
                    <div className="overflow-x-auto max-h-[400px]">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 sticky top-0">
                                <tr>
                                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Time</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Page</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Location</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {logs.length === 0 ? (
                                    <tr><td colSpan="3" className="p-4 text-center text-gray-500">No logs yet</td></tr>
                                ) : (
                                    logs.map((log) => (
                                        <tr key={log.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-2 text-xs text-gray-500 whitespace-nowrap">
                                                {new Date(log.timestamp).toLocaleString('en-IN', {
                                                    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                                                })}
                                            </td>
                                            <td className="px-4 py-2">
                                                <span className="font-mono text-xs text-gray-700">{log.path}</span>
                                            </td>
                                            <td className="px-4 py-2 text-xs text-gray-500">
                                                {log.city && log.city !== 'Local' ? (
                                                    <span>{log.city}, {log.state}</span>
                                                ) : (
                                                    <span className="text-gray-300">—</span>
                                                )}
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
