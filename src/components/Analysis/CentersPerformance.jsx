import {
    BarElement,
    CategoryScale,
    Chart as ChartJS,
    Filler,
    Legend,
    LinearScale,
    LineElement,
    PointElement,
    Title,
    Tooltip
} from 'chart.js';
import { useMemo, useState } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import { FiBarChart2, FiMapPin, FiTrendingUp } from 'react-icons/fi';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const CentersPerformance = ({ data, title, searchTerm = '', sortBy = 'business', sortOrder = 'desc' }) => {
    const [chartType, setChartType] = useState('bar');
    const [selectedCentre, setSelectedCentre] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterBy, setFilterBy] = useState('all');
    const [areaFilter, setAreaFilter] = useState('all');
    const [regionFilter, setRegionFilter] = useState('all');

    if (!data || !data.data || data.data.length === 0) {
        return (
            <div className="p-8 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-lg mb-3">
                    <FiMapPin className="text-lg text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium text-sm">No centers performance data available</p>
                <p className="text-gray-400 text-xs mt-1">Please check back later</p>
            </div>
        );
    }

    const centres = data.data;
    const months = centres[0]?.monthly?.map(item => item.month) || [];

    // Extract unique areas and regions for filters
    const uniqueAreas = useMemo(() => {
        const areas = [...new Set(centres.map(centre => 
            centre.centre.branchName || 'Unassigned'
        ).filter(Boolean))];
        return areas.sort();
    }, [centres]);

    const uniqueRegions = useMemo(() => {
        const regions = [...new Set(centres.map(centre => 
            centre.centre.regionName || 'Unassigned'
        ).filter(Boolean))];
        return regions.sort();
    }, [centres]);

    // Smart filtering and sorting with useMemo for performance
    const filteredAndSortedCentres = useMemo(() => {
        let filtered = [...centres];
        
        // Apply search filter (both name and center ID)
        if (searchQuery) {
            filtered = filtered.filter(centre => 
                centre.centre.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (centre.centre.centreId && centre.centre.centreId.toLowerCase().includes(searchQuery.toLowerCase()))
            );
        }

        // Apply area filter (using branchName)
        if (areaFilter !== 'all') {
            filtered = filtered.filter(centre => 
                (centre.centre.branchName || 'Unassigned') === areaFilter
            );
        }

        // Apply region filter (using regionName)
        if (regionFilter !== 'all') {
            filtered = filtered.filter(centre => 
                (centre.centre.regionName || 'Unassigned') === regionFilter
            );
        }

        // Apply performance filter
        if (filterBy !== 'all') {
            filtered = filtered.filter(centre => {
                const totalAdExpense = centre.monthly.reduce((sum, m) => sum + m.adExpenseTotal, 0);
                const totalBusiness = centre.monthly.reduce((sum, m) => sum + m.businessTotal, 0);
                const adPercentage = totalBusiness > 0 ? (totalAdExpense / totalBusiness) * 100 : 0;
                const roi = totalAdExpense > 0 ? totalBusiness / totalAdExpense : 0;
                const performanceScore = roi * 10 - adPercentage;
                
                switch (filterBy) {
                    case 'excellent': return performanceScore > 15;
                    case 'good': return performanceScore >= 10 && performanceScore <= 15;
                    case 'average': return performanceScore >= 5 && performanceScore < 10;
                    case 'poor': return performanceScore < 5;
                    default: return true;
                }
            });
        }

        // Apply sorting
        filtered.sort((a, b) => {
            let aValue, bValue;
            switch (sortBy) {
                case 'expense':
                    aValue = a.adExpenseTotal;
                    bValue = b.adExpenseTotal;
                    break;
                case 'business':
                    aValue = a.businessTotal;
                    bValue = b.businessTotal;
                    break;
                case 'roi':
                    aValue = a.adExpenseTotal > 0 ? a.businessTotal / a.adExpenseTotal : 0;
                    bValue = b.adExpenseTotal > 0 ? b.businessTotal / b.adExpenseTotal : 0;
                    break;
                case 'name':
                    aValue = a.centre.name;
                    bValue = b.centre.name;
                    return sortOrder === 'desc' ? bValue.localeCompare(aValue) : aValue.localeCompare(bValue);
                default:
                    aValue = a.businessTotal;
                    bValue = b.businessTotal;
            }
            
            return sortOrder === 'desc' ? bValue - aValue : aValue - bValue;
        });

        return filtered;
    }, [centres, searchQuery, areaFilter, regionFilter, filterBy, sortBy, sortOrder]);

    // Individual centre chart data - Performance Analysis Only
    const getIndividualChartData = (centreData) => {
        const monthlyData = centreData.monthly;
        
        const chartData = {
            labels: monthlyData.map(item => {
                const [year, month] = item.month.split('-');
                return new Date(year, month - 1).toLocaleDateString('en-US', { 
                    month: 'short', 
                    year: '2-digit' 
                });
            }),
            datasets: [
                {
                    label: 'Ad Percentage (%)',
                    data: monthlyData.map(item => {
                        const adPercentage = item.businessTotal > 0 ? ((item.adExpenseTotal / item.businessTotal) * 100) : 0;
                        return parseFloat(adPercentage.toFixed(1));
                    }),
                    backgroundColor: 'rgba(239, 68, 68, 0.6)',
                    borderColor: 'rgba(239, 68, 68, 1)',
                    borderWidth: 2,
                    tension: 0.3,
                    yAxisID: 'y',
                    type: 'line'
                },
                {
                    label: 'ROI Multiplier (x)',
                    data: monthlyData.map(item => {
                        const roi = item.adExpenseTotal > 0 ? (item.businessTotal / item.adExpenseTotal) : 0;
                        return parseFloat(roi.toFixed(1));
                    }),
                    backgroundColor: 'rgba(34, 197, 94, 0.6)',
                    borderColor: 'rgba(34, 197, 94, 1)',
                    borderWidth: 2,
                    tension: 0.3,
                    yAxisID: 'y1',
                    type: chartType
                },
                {
                    label: 'Performance Score',
                    data: monthlyData.map(item => {
                        const adPercentage = item.businessTotal > 0 ? ((item.adExpenseTotal / item.businessTotal) * 100) : 0;
                        const roi = item.adExpenseTotal > 0 ? (item.businessTotal / item.adExpenseTotal) : 0;
                        const performanceScore = roi * 10 - adPercentage;
                        return parseFloat(performanceScore.toFixed(1));
                    }),
                    backgroundColor: 'rgba(147, 51, 234, 0.6)',
                    borderColor: 'rgba(147, 51, 234, 1)',
                    borderWidth: 2,
                    tension: 0.3,
                    yAxisID: 'y2',
                    type: 'line'
                }
            ],
        };

        return chartData;
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            mode: 'index',
            intersect: false,
        },
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    usePointStyle: true,
                    padding: 15
                }
            },
            title: {
                display: true,
                text: selectedCentre ? `${selectedCentre.centre.name} - Performance Analysis` : 'All Centers Performance Analysis',
                font: {
                    size: 14,
                    weight: 'bold'
                }
            },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        const value = context.parsed.y;
                        if (context.dataset.label.includes('Percentage')) {
                            return `${context.dataset.label}: ${value}%`;
                        } else if (context.dataset.label.includes('ROI')) {
                            return `${context.dataset.label}: ${value}x`;
                        } else if (context.dataset.label.includes('Score')) {
                            return `${context.dataset.label}: ${value}`;
                        }
                        return `${context.dataset.label}: ${value}`;
                    }
                }
            }
        },
        scales: {
            x: {
                display: true,
                title: {
                    display: true,
                    text: 'Month'
                }
            },
            y: {
                type: 'linear',
                display: true,
                position: 'left',
                title: {
                    display: true,
                    text: 'Ad Percentage (%)'
                },
                beginAtZero: true,
                max: 10,
                ticks: {
                    callback: function(value) {
                        return value + '%';
                    }
                }
            },
            y1: {
                type: 'linear',
                display: true,
                position: 'right',
                title: {
                    display: true,
                    text: 'ROI Multiplier (x)'
                },
                beginAtZero: true,
                grid: {
                    drawOnChartArea: false,
                },
                ticks: {
                    callback: function(value) {
                        return value + 'x';
                    }
                }
            },
            y2: {
                type: 'linear',
                display: false,
                position: 'right',
                title: {
                    display: false,
                    text: 'Performance Score'
                },
                beginAtZero: true,
                grid: {
                    drawOnChartArea: false,
                }
            },
        },
    };

    return (
        <div className="p-4">
            {/* Compact Controls */}
            <div className="flex flex-wrap items-center justify-between mb-4 gap-3">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setChartType('bar')}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs transition-colors ${
                            chartType === 'bar' 
                                ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        <FiBarChart2 className="text-xs" />
                        Bar
                    </button>
                    <button
                        onClick={() => setChartType('line')}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs transition-colors ${
                            chartType === 'line' 
                                ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        <FiTrendingUp className="text-xs" />
                        Line
                    </button>
                </div>

                <div className="flex text-black items-center gap-2">
                    <input
                        type="text"
                        placeholder="Search by name or ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="px-3 py-1.5 border border-zinc-200 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white w-48"
                    />
                    
                    <select
                        value={areaFilter}
                        onChange={(e) => setAreaFilter(e.target.value)}
                        className="px-3 py-1.5 border rounded-md border-zinc-200 text-xs bg-white"
                    >
                        <option value="all">All Branches</option>
                        {uniqueAreas.map(area => (
                            <option key={area} value={area}>{area}</option>
                        ))}
                    </select>

                    <select
                        value={regionFilter}
                        onChange={(e) => setRegionFilter(e.target.value)}
                        className="px-3 py-1.5 border rounded-md border-zinc-200 text-xs bg-white"
                    >
                        <option value="all">All Regions</option>
                        {uniqueRegions.map(region => (
                            <option key={region} value={region}>{region}</option>
                        ))}
                    </select>
                    
                    <select
                        value={filterBy}
                        onChange={(e) => setFilterBy(e.target.value)}
                        className="px-3 py-1.5 border rounded-md border-zinc-200 text-xs bg-white"
                    >
                        <option value="all">All Performance</option>
                        <option value="excellent">Excellent (&gt;15 score)</option>
                        <option value="good">Good (10-15 score)</option>
                        <option value="average">Average (5-10 score)</option>
                        <option value="poor">Poor (&lt;5 score)</option>
                    </select>
                    
                    <select
                        value={selectedCentre?.centre.id || ''}
                        onChange={(e) => {
                            const centre = filteredAndSortedCentres.find(c => c.centre.id === e.target.value);
                            setSelectedCentre(centre);
                        }}
                        className="px-3 py-1.5 border rounded-md border-zinc-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                        <option value="">All Centers Overview</option>
                        {filteredAndSortedCentres.map(centre => (
                            <option key={centre.centre.id} value={centre.centre.id}>
                                {centre.centre.name} ({centre.centre.centreId || 'N/A'})
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {!selectedCentre ? (
                <>
                    {/* Performance Analysis Chart with Serial Numbers */}
                    <div className="h-80 mb-4">
                        <h3 className="text-sm font-semibold mb-2 text-gray-800">Performance Analysis Overview</h3>
                        {chartType === 'bar' ? (
                            <Bar data={{
                                labels: filteredAndSortedCentres.map((centre, index) => `${index + 1}. ${centre.centre.name.substring(0, 8)}...`),
                                datasets: [
                                    {
                                        label: 'Ad Percentage (%)',
                                        data: filteredAndSortedCentres.map(centre => {
                                            const totalAdExpense = centre.monthly.reduce((sum, m) => sum + m.adExpenseTotal, 0);
                                            const totalBusiness = centre.monthly.reduce((sum, m) => sum + m.businessTotal, 0);
                                            const adPercentage = totalBusiness > 0 ? ((totalAdExpense / totalBusiness) * 100) : 0;
                                            return parseFloat(adPercentage.toFixed(1));
                                        }),
                                        backgroundColor: 'rgba(239, 68, 68, 0.6)',
                                        borderColor: 'rgba(239, 68, 68, 1)',
                                        borderWidth: 2,
                                        yAxisID: 'y'
                                    },
                                    {
                                        label: 'ROI Multiplier (x)',
                                        data: filteredAndSortedCentres.map(centre => {
                                            const totalAdExpense = centre.monthly.reduce((sum, m) => sum + m.adExpenseTotal, 0);
                                            const totalBusiness = centre.monthly.reduce((sum, m) => sum + m.businessTotal, 0);
                                            const roi = totalAdExpense > 0 ? (totalBusiness / totalAdExpense) : 0;
                                            return parseFloat(roi.toFixed(1));
                                        }),
                                        backgroundColor: 'rgba(34, 197, 94, 0.6)',
                                        borderColor: 'rgba(34, 197, 94, 1)',
                                        borderWidth: 2,
                                        yAxisID: 'y1'
                                    },
                                    {
                                        label: 'Performance Score',
                                        data: filteredAndSortedCentres.map(centre => {
                                            const totalAdExpense = centre.monthly.reduce((sum, m) => sum + m.adExpenseTotal, 0);
                                            const totalBusiness = centre.monthly.reduce((sum, m) => sum + m.businessTotal, 0);
                                            const adPercentage = totalBusiness > 0 ? ((totalAdExpense / totalBusiness) * 100) : 0;
                                            const roi = totalAdExpense > 0 ? (totalBusiness / totalAdExpense) : 0;
                                            const performanceScore = roi * 10 - adPercentage;
                                            return parseFloat(performanceScore.toFixed(1));
                                        }),
                                        backgroundColor: 'rgba(147, 51, 234, 0.6)',
                                        borderColor: 'rgba(147, 51, 234, 1)',
                                        borderWidth: 2,
                                        yAxisID: 'y2'
                                    }
                                ]
                            }} options={chartOptions} />
                        ) : (
                            <Line data={{
                                labels: filteredAndSortedCentres.map((centre, index) => `${index + 1}. ${centre.centre.name.substring(0, 8)}...`),
                                datasets: [
                                    {
                                        label: 'Ad Percentage (%)',
                                        data: filteredAndSortedCentres.map(centre => {
                                            const totalAdExpense = centre.monthly.reduce((sum, m) => sum + m.adExpenseTotal, 0);
                                            const totalBusiness = centre.monthly.reduce((sum, m) => sum + m.businessTotal, 0);
                                            const adPercentage = totalBusiness > 0 ? ((totalAdExpense / totalBusiness) * 100) : 0;
                                            return parseFloat(adPercentage.toFixed(1));
                                        }),
                                        backgroundColor: 'rgba(239, 68, 68, 0.6)',
                                        borderColor: 'rgba(239, 68, 68, 1)',
                                        borderWidth: 2,
                                        tension: 0.3,
                                        yAxisID: 'y'
                                    },
                                    {
                                        label: 'ROI Multiplier (x)',
                                        data: filteredAndSortedCentres.map(centre => {
                                            const totalAdExpense = centre.monthly.reduce((sum, m) => sum + m.adExpenseTotal, 0);
                                            const totalBusiness = centre.monthly.reduce((sum, m) => sum + m.businessTotal, 0);
                                            const roi = totalAdExpense > 0 ? (totalBusiness / totalAdExpense) : 0;
                                            return parseFloat(roi.toFixed(1));
                                        }),
                                        backgroundColor: 'rgba(34, 197, 94, 0.6)',
                                        borderColor: 'rgba(34, 197, 94, 1)',
                                        borderWidth: 2,
                                        tension: 0.3,
                                        yAxisID: 'y1'
                                    },
                                    {
                                        label: 'Performance Score',
                                        data: filteredAndSortedCentres.map(centre => {
                                            const totalAdExpense = centre.monthly.reduce((sum, m) => sum + m.adExpenseTotal, 0);
                                            const totalBusiness = centre.monthly.reduce((sum, m) => sum + m.businessTotal, 0);
                                            const adPercentage = totalBusiness > 0 ? ((totalAdExpense / totalBusiness) * 100) : 0;
                                            const roi = totalAdExpense > 0 ? (totalBusiness / totalAdExpense) : 0;
                                            const performanceScore = roi * 10 - adPercentage;
                                            return parseFloat(performanceScore.toFixed(1));
                                        }),
                                        backgroundColor: 'rgba(147, 51, 234, 0.6)',
                                        borderColor: 'rgba(147, 51, 234, 1)',
                                        borderWidth: 2,
                                        tension: 0.3,
                                        yAxisID: 'y2'
                                    }
                                ]
                            }} options={chartOptions} />
                        )}
                    </div>

                    {/* Compact Centers Grid */}
                    <div className="bg-gradient-to-br mt-15 from-gray-50 to-gray-100 rounded-lg p-4 shadow-inner border border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                        {filteredAndSortedCentres.map(centre => {
                            const totalAdExpense = centre.monthly.reduce((sum, m) => sum + m.adExpenseTotal, 0);
                            const totalBusiness = centre.monthly.reduce((sum, m) => sum + m.businessTotal, 0);
                            const adPercentage = totalBusiness > 0 ? ((totalAdExpense / totalBusiness) * 100).toFixed(1) : 0;
                            const roi = totalAdExpense > 0 ? (totalBusiness / totalAdExpense).toFixed(1) : 0;
                            
                            // Performance rating based on ROI and Ad %
                            const performanceScore = parseFloat(roi) * 10 - parseFloat(adPercentage);
                            const performanceRating = performanceScore > 15 ? 'Excellent' : 
                                                    performanceScore > 10 ? 'Good' : 
                                                    performanceScore > 5 ? 'Average' : 'Poor';
                            const performanceColor = performanceScore > 15 ? 'text-green-600' : 
                                                   performanceScore > 10 ? 'text-blue-600' : 
                                                   performanceScore > 5 ? 'text-orange-600' : 'text-red-600';

                            return (
                                <div key={centre.centre.id} className="bg-white rounded-lg p-3 hover:bg-gray-50 transition-all duration-200 border border-gray-200  hover:">
                                    {/* Compact Center Header */}
                                    <div className="flex items-center justify-between mb-2">
                                        <div>
                                            <h4 className="font-medium text-gray-800 text-sm truncate">{centre.centre.name}</h4>
                                            <p className="text-xs text-gray-500">ID: {centre.centre.centreId || 'N/A'}</p>
                                        </div>
                                        <button
                                            onClick={() => setSelectedCentre(centre)}
                                            className="text-blue-600 hover:text-blue-800 text-xs px-2 py-1 rounded hover:bg-blue-50"
                                        >
                                            View
                                        </button>
                                    </div>

                                    {/* Performance Rating */}
                                    <div className="mb-2 text-center">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${performanceColor} bg-opacity-10`} 
                                              style={{backgroundColor: `${performanceColor.replace('text-', 'bg-').replace('-600', '-100')}`}}>
                                            {performanceRating}
                                        </span>
                                    </div>

                                    {/* Mini Chart */}
                                    <div className="h-20 mb-2">
                                        {chartType === 'bar' ? (
                                            <Bar 
                                                data={getIndividualChartData(centre)} 
                                                options={{
                                                    ...chartOptions,
                                                    plugins: {
                                                        ...chartOptions.plugins,
                                                        title: { display: false },
                                                        legend: { display: false }
                                                    },
                                                    scales: {
                                                        ...chartOptions.scales,
                                                        x: { ...chartOptions.scales.x, display: false },
                                                        y: { ...chartOptions.scales.y, display: false }
                                                    }
                                                }} 
                                            />
                                        ) : (
                                            <Line 
                                                data={getIndividualChartData(centre)} 
                                                options={{
                                                    ...chartOptions,
                                                    plugins: {
                                                        ...chartOptions.plugins,
                                                        title: { display: false },
                                                        legend: { display: false }
                                                    },
                                                    scales: {
                                                        ...chartOptions.scales,
                                                        x: { ...chartOptions.scales.x, display: false },
                                                        y: { ...chartOptions.scales.y, display: false }
                                                    }
                                                }} 
                                            />
                                        )}
                                    </div>

                                    {/* Performance Analysis Metrics - No Amounts */}
                                    <div className="grid grid-cols-4 gap-1 text-xs">
                                        <div className="bg-gray-50 p-1.5 rounded text-center">
                                            <p className="text-gray-500 text-xs">Ad %</p>
                                            <p className={`font-bold text-xs ${
                                                parseFloat(adPercentage) > 5 ? 'text-red-600' : 
                                                parseFloat(adPercentage) > 3 ? 'text-orange-600' : 'text-green-600'
                                            }`}>
                                                {adPercentage}%
                                            </p>
                                        </div>
                                        <div className="bg-gray-50 p-1.5 rounded text-center">
                                            <p className="text-gray-500 text-xs">ROI</p>
                                            <p className="font-bold text-blue-600 text-xs">{roi}x</p>
                                        </div>
                                        <div className="bg-gray-50 p-1.5 rounded text-center">
                                            <p className="text-gray-500 text-xs">Score</p>
                                            <p className={`font-bold text-xs ${performanceColor}`}>
                                                {performanceScore.toFixed(1)}
                                            </p>
                                        </div>
                                        <div className="bg-gray-50 p-1.5 rounded text-center">
                                            <p className="text-gray-500 text-xs">Grade</p>
                                            <p className={`font-bold text-xs ${performanceColor}`}>
                                                {performanceRating.charAt(0)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Additional Analysis Metrics */}
                                    <div className="mt-2 grid grid-cols-2 gap-1 text-xs">
                                        <div className="bg-gray-50 p-1.5 rounded text-center">
                                            <p className="text-gray-500 text-xs">Efficiency</p>
                                            <p className="font-bold text-xs text-purple-600">
                                                {roi > 0 && parseFloat(adPercentage) > 0 ? 
                                                    ((parseFloat(roi) / parseFloat(adPercentage)) * 100).toFixed(0) : '0'}%
                                            </p>
                                        </div>
                                        <div className="bg-gray-50 p-1.5 rounded text-center">
                                            <p className="text-gray-500 text-xs">Trend</p>
                                            <p className="font-bold text-xs text-indigo-600">
                                                {centre.monthly.length > 1 && centre.monthly[centre.monthly.length - 1].businessTotal > centre.monthly[centre.monthly.length - 2].businessTotal ? '↗' : '↘'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        </div>
                    </div>
                </>
            ) : (
                /* Compact Individual Center View */
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <button
                            onClick={() => setSelectedCentre(null)}
                            className="text-blue-600 hover:text-blue-800 text-xs"
                        >
                            ← Back to All Centers
                        </button>
                        <h3 className="text-sm font-semibold text-gray-800">{selectedCentre.centre.name}</h3>
                    </div>
                    <div className="h-64 mb-4">
                        {chartType === 'bar' ? (
                            <Bar data={getIndividualChartData(selectedCentre)} options={chartOptions} />
                        ) : (
                            <Line data={getIndividualChartData(selectedCentre)} options={chartOptions} />
                        )}
                    </div>

                    {/* Monthly Performance Analysis Table - No Amounts */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase">Sr.</th>
                                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
                                    <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase">Ad %</th>
                                    <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase">ROI</th>
                                    <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase">Score</th>
                                    <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase">Performance</th>
                                    <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase">Efficiency</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {selectedCentre.monthly.map((item, index) => {
                                    const [year, month] = item.month.split('-');
                                    const monthName = new Date(year, month - 1).toLocaleDateString('en-US', { 
                                        month: 'short', 
                                        year: '2-digit' 
                                    });
                                    const roi = item.adExpenseTotal > 0 ? (item.businessTotal / item.adExpenseTotal).toFixed(1) : 0;
                                    const adPercentage = item.businessTotal > 0 ? ((item.adExpenseTotal / item.businessTotal) * 100).toFixed(1) : 0;
                                    const performanceScore = parseFloat(roi) * 10 - parseFloat(adPercentage);
                                    const performanceRating = performanceScore > 15 ? 'Excellent' : 
                                                            performanceScore > 10 ? 'Good' : 
                                                            performanceScore > 5 ? 'Average' : 'Poor';
                                    const performanceColor = performanceScore > 15 ? 'text-green-600' : 
                                                           performanceScore > 10 ? 'text-blue-600' : 
                                                           performanceScore > 5 ? 'text-orange-600' : 'text-red-600';
                                    const efficiency = parseFloat(roi) > 0 && parseFloat(adPercentage) > 0 ? 
                                                     ((parseFloat(roi) / parseFloat(adPercentage)) * 100).toFixed(0) : '0';
                                    
                                    return (
                                        <tr key={item.month} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                            <td className="px-2 py-2 text-xs text-center font-medium text-gray-700">
                                                {index + 1}
                                            </td>
                                            <td className="px-2 py-2 text-xs font-medium text-gray-900">
                                                {monthName}
                                            </td>
                                            <td className={`px-2 py-2 text-xs text-right font-medium ${
                                                parseFloat(adPercentage) > 5 ? 'text-red-600' : 
                                                parseFloat(adPercentage) > 3 ? 'text-orange-600' : 'text-green-600'
                                            }`}>
                                                {adPercentage}%
                                            </td>
                                            <td className="px-2 py-2 text-xs text-blue-600 text-right font-medium">
                                                {roi}x
                                            </td>
                                            <td className={`px-2 py-2 text-xs text-right font-medium ${performanceColor}`}>
                                                {performanceScore.toFixed(1)}
                                            </td>
                                            <td className={`px-2 py-2 text-xs text-right font-medium ${performanceColor}`}>
                                                {performanceRating}
                                            </td>
                                            <td className="px-2 py-2 text-xs text-right font-medium text-purple-600">
                                                {efficiency}%
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Performance Analysis Summary Table with Serial Numbers & Area/Region */}
            {!selectedCentre && (
                <div className="mt-4 overflow-x-auto">
                    <h3 className="text-sm font-semibold mb-2 text-gray-800">Performance Analysis Summary</h3>
                    <table className="w-full text-xs">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase">Sr.</th>
                                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">Center</th>
                                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">Branch</th>
                                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">Region</th>
                                <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase">Performance</th>
                                <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase">Ad %</th>
                                <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase">ROI</th>
                                <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase">Score</th>
                                <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase">Efficiency</th>
                                <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase">Trend</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredAndSortedCentres
                                .map(centre => {
                                    const totalAdExpense = centre.monthly.reduce((sum, m) => sum + m.adExpenseTotal, 0);
                                    const totalBusiness = centre.monthly.reduce((sum, m) => sum + m.businessTotal, 0);
                                    const adPercentage = totalBusiness > 0 ? ((totalAdExpense / totalBusiness) * 100).toFixed(1) : 0;
                                    const roi = totalAdExpense > 0 ? (totalBusiness / totalAdExpense).toFixed(1) : 0;
                                    const performanceScore = parseFloat(roi) * 10 - parseFloat(adPercentage);
                                    const performanceRating = performanceScore > 15 ? 'Excellent' : 
                                                            performanceScore > 10 ? 'Good' : 
                                                            performanceScore > 5 ? 'Average' : 'Poor';
                                    const performanceColor = performanceScore > 15 ? 'text-green-600' : 
                                                           performanceScore > 10 ? 'text-blue-600' : 
                                                           performanceScore > 5 ? 'text-orange-600' : 'text-red-600';
                                    const efficiency = parseFloat(roi) > 0 && parseFloat(adPercentage) > 0 ? 
                                                     ((parseFloat(roi) / parseFloat(adPercentage)) * 100).toFixed(0) : '0';
                                    const trend = centre.monthly.length > 1 && centre.monthly[centre.monthly.length - 1].businessTotal > centre.monthly[centre.monthly.length - 2].businessTotal ? '↗' : '↘';
                                    
                                    return {
                                        ...centre,
                                        adPercentage: parseFloat(adPercentage),
                                        roi: parseFloat(roi),
                                        performanceScore,
                                        performanceRating,
                                        performanceColor,
                                        efficiency,
                                        trend
                                    };
                                })
                                .map((centre, index) => (
                                    <tr 
                                        key={centre.centre.id} 
                                        className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 cursor-pointer`}
                                        onClick={() => setSelectedCentre(centre)}
                                    >
                                        <td className="px-2 py-2 text-xs text-center font-medium text-gray-700">
                                            {index + 1}
                                        </td>
                                        <td className="px-2 py-2 text-xs font-medium text-gray-900 truncate max-w-20">
                                            {centre.centre.name}
                                        </td>
                                        <td className="px-2 py-2 text-xs text-gray-600">
                                            {centre.centre.centreId || 'N/A'}
                                        </td>
                                        <td className="px-2 py-2 text-xs text-gray-600">
                                            {centre.centre.branchName || 'Unassigned'}
                                        </td>
                                        <td className="px-2 py-2 text-xs text-gray-600">
                                            {centre.centre.regionName || 'Unassigned'}
                                        </td>
                                        <td className={`px-2 py-2 text-xs text-right font-medium ${centre.performanceColor}`}>
                                            {centre.performanceRating}
                                        </td>
                                        <td className={`px-2 py-2 text-xs text-right font-medium ${
                                            centre.adPercentage > 5 ? 'text-red-600' : 
                                            centre.adPercentage > 3 ? 'text-orange-600' : 'text-green-600'
                                        }`}>
                                            {centre.adPercentage}%
                                        </td>
                                        <td className="px-2 py-2 text-xs text-blue-600 text-right font-medium">
                                            {centre.roi}x
                                        </td>
                                        <td className={`px-2 py-2 text-xs text-right font-medium ${centre.performanceColor}`}>
                                            {centre.performanceScore.toFixed(1)}
                                        </td>
                                        <td className="px-2 py-2 text-xs text-right font-medium text-purple-600">
                                            {centre.efficiency}%
                                        </td>
                                        <td className="px-2 py-2 text-xs text-center">
                                            <span className={`${centre.trend === '↗' ? 'text-green-600' : 'text-red-600'}`}>
                                                {centre.trend}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default CentersPerformance;
