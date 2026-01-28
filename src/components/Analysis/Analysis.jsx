import { useEffect, useState } from 'react';
import { FiBarChart2, FiCalendar, FiFilter, FiRefreshCw, FiSearch, FiTrendingUp } from 'react-icons/fi';
import { adExpenseAPI } from '../../utils/apiServices';
import CentersPerformance from './CentersPerformance';

const Analysis = () => {
    const [activeTab, setActiveTab] = useState('centers');
    const [analysisData, setAnalysisData] = useState({
        centers: null
    });
    const [loading, setLoading] = useState({
        centers: false
    });
    const [error, setError] = useState(null);
    
    // Modern filters and search
    const [searchTerm, setSearchTerm] = useState('');
    const [dateRange, setDateRange] = useState('12months');
    const [sortBy, setSortBy] = useState('business');
    const [sortOrder, setSortOrder] = useState('desc');
    const [showFilters, setShowFilters] = useState(false);

    const fetchAnalysisData = async (type) => {
        setLoading(prev => ({ ...prev, [type]: true }));
        setError(null);
        
        try {
            let data;
            // Only fetch centers performance data
            data = await adExpenseAPI.getAllCentresAnalysis();
            setAnalysisData(prev => ({ ...prev, [type]: data }));
        } catch (err) {
            console.error(`Error fetching ${type} analysis:`, err);
            setError(`Failed to load ${type} analysis data`);
        } finally {
            setLoading(prev => ({ ...prev, [type]: false }));
        }
    };

    const refreshAnalysisData = () => {
        fetchAnalysisData(activeTab);
    };

    useEffect(() => {
        fetchAnalysisData(activeTab);
    }, [activeTab]);

    // Only Centers performance tab
    const tabs = [
        { id: 'centers', label: 'Centers Performance', icon: FiTrendingUp, color: 'purple', bgColor: 'bg-purple-500', lightBg: 'bg-purple-50', textColor: 'text-purple-700', borderColor: 'border-purple-200' }
    ];

    const getTabClasses = (tab) => {
        const baseClasses = "group relative flex items-center gap-3 px-6 py-3 rounded-xl font-medium text-sm transition-all duration-300 hover: transform hover:-translate-y-0.5";
        if (activeTab === tab.id) {
            return `${baseClasses} ${tab.bgColor} text-white  shadow-${tab.color}-500/25`;
        }
        return `${baseClasses} bg-white text-gray-600 hover:bg-gray-50 border border-gray-200 hover:border-gray-300`;
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Compact Header */}
                <div className="bg-white text-black border-zinc-200 rounded-lg border p-6 mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <FiBarChart2 className="text-lg text-purple-600" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">Centers Performance</h1>
                                <p className="text-sm text-gray-600">Center-wise expense analysis</p>
                            </div>
                        </div>
                        
                        {/* Compact Action Buttons */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                                    showFilters 
                                        ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                <FiFilter className="text-sm" />
                                Filters
                            </button>
                            <button
                                onClick={refreshAnalysisData}
                                disabled={loading[activeTab]}
                                className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <FiRefreshCw className={`text-sm ${loading[activeTab] ? 'animate-spin' : ''}`} />
                                Refresh
                            </button>
                        </div>
                    </div>

                    {/* Compact Filters Panel */}
                    {showFilters && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                {/* Search */}
                                <div className="relative">
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Search Centers</label>
                                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                                    <input
                                        type="text"
                                        placeholder="Search..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-8 pr-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>

                                {/* Date Range */}
                                <div className="relative">
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Date Range</label>
                                    <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                                    <select
                                        value={dateRange}
                                        onChange={(e) => setDateRange(e.target.value)}
                                        className="w-full pl-8 pr-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
                                    >
                                        <option value="3months">Last 3 Months</option>
                                        <option value="6months">Last 6 Months</option>
                                        <option value="12months">Last 12 Months</option>
                                        <option value="24months">Last 24 Months</option>
                                    </select>
                                </div>

                                {/* Sort By */}
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Sort By</label>
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value)}
                                        className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="business">Business Total</option>
                                        <option value="expense">Ad Expense</option>
                                        <option value="roi">ROI</option>
                                        <option value="percentage">Ad %</option>
                                    </select>
                                </div>

                                {/* Sort Order */}
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Order</label>
                                    <select
                                        value={sortOrder}
                                        onChange={(e) => setSortOrder(e.target.value)}
                                        className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="desc">High to Low</option>
                                        <option value="asc">Low to High</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Compact Error State */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                        <div className="flex items-center gap-2">
                            <span className="text-red-600 text-sm">⚠️</span>
                            <p className="text-red-700 text-sm font-medium">{error}</p>
                        </div>
                    </div>
                )}

                {/* Compact Loading State */}
                {loading[activeTab] && (
                    <div className="bg-white rounded-lg  border p-8 text-center">
                        <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-3">
                            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                        <p className="text-gray-600 font-medium text-sm">Loading centers performance...</p>
                    </div>
                )}

                {/* Compact Centers Performance Container */}
                {!loading[activeTab] && !error && analysisData[activeTab] && (
                    <div className="bg-white rounded-lg  border">
                        <CentersPerformance
                            data={analysisData[activeTab]}
                            title="Centers Performance"
                            searchTerm={searchTerm}
                            sortBy={sortBy}
                            sortOrder={sortOrder}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default Analysis;
