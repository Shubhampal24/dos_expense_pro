import {
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
import { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import { FiCalendar, FiTrendingUp } from 'react-icons/fi';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const AnalysisChart = ({ data, title, type, searchTerm = '', sortBy = 'business', sortOrder = 'desc' }) => {
    if (!data || !data.data || data.data.length === 0) {
        return (
            <div className="p-12 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-gray-100 to-gray-200 rounded-2xl mb-4">
                    <FiTrendingUp className="text-2xl text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium">No data available for {title}</p>
                <p className="text-gray-400 text-sm mt-1">Try adjusting your filters or date range</p>
            </div>
        );
    }

    const monthlyData = data.data;

    // Smart filtering and sorting with useMemo for performance
    const filteredAndSortedData = useMemo(() => {
        let filtered = [...monthlyData];
        
        // Apply search filter if searchTerm exists (for future use with entity names)
        if (searchTerm) {
            filtered = filtered.filter(item => 
                item.month.toLowerCase().includes(searchTerm.toLowerCase())
            );
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
                case 'percentage':
                    aValue = a.businessTotal > 0 ? (a.adExpenseTotal / a.businessTotal) * 100 : 0;
                    bValue = b.businessTotal > 0 ? (b.adExpenseTotal / b.businessTotal) * 100 : 0;
                    break;
                default:
                    aValue = a.businessTotal;
                    bValue = b.businessTotal;
            }
            
            return sortOrder === 'desc' ? bValue - aValue : aValue - bValue;
        });

        return filtered;
    }, [monthlyData, searchTerm, sortBy, sortOrder]);

    // Modern chart configuration with enhanced styling
    const chartData = {
        labels: filteredAndSortedData.map(item => item.month),
        datasets: [{
            label: 'Ad Expense',
            data: filteredAndSortedData.map(item => item.adExpenseTotal),
            borderColor: 'rgb(239, 68, 68)',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderWidth: 3,
            tension: 0.4,
            fill: true,
            pointRadius: 6,
            pointHoverRadius: 8,
            pointBackgroundColor: '#ffffff',
            pointBorderWidth: 3,
            pointHoverBackgroundColor: 'rgb(239, 68, 68)',
            pointHoverBorderColor: '#ffffff',
            pointHoverBorderWidth: 2,
        }, {
            label: 'Business Total',
            data: filteredAndSortedData.map(item => item.businessTotal),
            borderColor: 'rgb(34, 197, 94)',
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            borderWidth: 3,
            tension: 0.4,
            fill: true,
            pointRadius: 6,
            pointHoverRadius: 8,
            pointBackgroundColor: '#ffffff',
            pointBorderWidth: 3,
            pointHoverBackgroundColor: 'rgb(34, 197, 94)',
            pointHoverBorderColor: '#ffffff',
            pointHoverBorderWidth: 2,
        }]
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
                position: 'bottom',
                labels: {
                    usePointStyle: true,
                    padding: 20,
                    font: {
                        size: 12,
                        weight: '600'
                    },
                    color: '#4B5563'
                }
            },
            tooltip: {
                backgroundColor: 'rgba(17, 24, 39, 0.95)',
                titleColor: '#ffffff',
                bodyColor: '#ffffff',
                borderColor: 'rgba(156, 163, 175, 0.2)',
                borderWidth: 1,
                cornerRadius: 12,
                padding: 16,
                displayColors: true,
                usePointStyle: true,
                callbacks: {
                    title: (context) => `${context[0].label}`,
                    label: (context) => {
                        const value = context.parsed.y;
                        const label = context.dataset.label;
                        return `${label}: ₹${value?.toLocaleString() || 0}`;
                    },
                    afterBody: (context) => {
                        if (context.length > 1) {
                            const expense = context[0].parsed.y;
                            const business = context[1].parsed.y;
                            const roi = expense > 0 ? (business / expense).toFixed(2) : '0.00';
                            const percentage = business > 0 ? ((expense / business) * 100).toFixed(1) : '0.0';
                            return [
                                `ROI: ${roi}x`,
                                `Expense Ratio: ${percentage}%`
                            ];
                        }
                        return [];
                    }
                }
            }
        },
        scales: {
            x: {
                grid: {
                    display: false
                },
                border: {
                    display: false
                },
                ticks: {
                    color: '#6B7280',
                    font: {
                        size: 11,
                        weight: '500'
                    },
                    padding: 8
                }
            },
            y: {
                grid: {
                    color: 'rgba(156, 163, 175, 0.1)',
                    drawBorder: false
                },
                border: {
                    display: false
                },
                ticks: {
                    color: '#6B7280',
                    font: {
                        size: 11,
                        weight: '500'
                    },
                    padding: 8,
                    callback: function(value) {
                        return '₹' + value.toLocaleString();
                    }
                }
            }
        }
    };

    return (
        <div className="relative bg-white/70 backdrop-blur-md rounded-2xl  border border-white/20 overflow-hidden">
            {/* Modern header with gradient */}
            <div className="relative bg-gradient-to-r from-blue-50/80 to-indigo-50/80 p-6 border-b border-white/20">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl ">
                            <FiTrendingUp className="text-white text-lg" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                                {title}
                            </h3>
                            <p className="text-sm text-gray-600 mt-0.5">
                                Monthly performance trends
                            </p>
                        </div>
                    </div>
                    
                    {/* Quick stats */}
                    <div className="flex items-center space-x-4">
                        <div className="text-right">
                            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Total Months</p>
                            <p className="text-lg font-bold text-gray-900">{filteredAndSortedData.length}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Avg ROI</p>
                            <p className="text-lg font-bold text-green-600">
                                {(filteredAndSortedData.reduce((acc, item) => {
                                    const roi = item.adExpenseTotal > 0 ? item.businessTotal / item.adExpenseTotal : 0;
                                    return acc + roi;
                                }, 0) / filteredAndSortedData.length).toFixed(2)}x
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Chart container with modern styling */}
            <div className="p-6">
                <div className="relative h-80 mb-6">
                    <Line data={chartData} options={chartOptions} />
                </div>
            </div>

            {/* Enhanced data table with modern design */}
            <div className="border-t border-white/20 bg-gradient-to-r from-gray-50/50 to-blue-50/50">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-bold text-gray-900">Monthly Breakdown</h4>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <FiCalendar className="text-gray-400" />
                            <span>Last {filteredAndSortedData.length} months</span>
                        </div>
                    </div>
                    
                    <div className="overflow-hidden rounded-xl border border-white/20">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-gradient-to-r from-gray-50 to-blue-50">
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                                            Month
                                        </th>
                                        <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">
                                            <div className="flex items-center justify-end space-x-1">
                                                <span>Ad Expense</span>
                                                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                            </div>
                                        </th>
                                        <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">
                                            <div className="flex items-center justify-end space-x-1">
                                                <span>Business Total</span>
                                                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                            </div>
                                        </th>
                                        <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">
                                            ROI Ratio
                                        </th>
                                        <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">
                                            Expense %
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white/50 backdrop-blur-sm divide-y divide-gray-100">
                                    {filteredAndSortedData.map((item, index) => {
                                        const roi = item.adExpenseTotal > 0 ? item.businessTotal / item.adExpenseTotal : 0;
                                        const percentage = item.businessTotal > 0 ? (item.adExpenseTotal / item.businessTotal) * 100 : 0;
                                        
                                        return (
                                            <tr key={index} className="hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-indigo-50/30 transition-all duration-200">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center mr-3">
                                                            <FiCalendar className="text-blue-600 text-sm" />
                                                        </div>
                                                        <div className="font-medium text-gray-900">{item.month}</div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <div className="text-sm font-bold text-red-600">
                                                        ₹{item.adExpenseTotal.toLocaleString()}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <div className="text-sm font-bold text-green-600">
                                                        ₹{item.businessTotal.toLocaleString()}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                                                        roi >= 2 ? 'bg-green-100 text-green-800' :
                                                        roi >= 1.5 ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-red-100 text-red-800'
                                                    }`}>
                                                        {roi.toFixed(2)}x
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <div className="flex items-center justify-end space-x-2">
                                                        <div className="w-16 bg-gray-200 rounded-full h-2">
                                                            <div 
                                                                className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-300"
                                                                style={{ width: `${Math.min(percentage, 100)}%` }}
                                                            ></div>
                                                        </div>
                                                        <span className="text-sm font-medium text-gray-900 min-w-[3rem]">
                                                            {percentage.toFixed(1)}%
                                                        </span>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalysisChart;
