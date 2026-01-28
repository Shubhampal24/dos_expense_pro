import React, { useState, useEffect } from "react";
import { adExpenseAPI, userAPI, bankAccountAPI } from "../../utils/apiServices";
import {
  getUserFromToken,
  hasAdminRole,
  ROLES,
  ADMIN_ROLES,
} from "../../utils/helpers";
import {
  FiUsers,
  FiDollarSign,
  FiTrendingUp,
  FiCalendar,
  FiUser,
  FiCheckCircle,
  FiClock,
  FiSearch,
  FiDownload,
  FiRefreshCw,
  FiFilter,
  FiBarChart2,
  FiPieChart,
  FiActivity,
  FiTarget,
  FiInfo,
  FiEye,
  FiSun,
  FiList,
  FiCreditCard,
  FiX,
  FiMapPin,
} from "react-icons/fi";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";

const AdminAnalysis = () => {
  const [analysisData, setAnalysisData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({
    selectedDate: "",
    selectedMonth: "",
    selectedQuarter: "",
    selectedYear: "",
    startDate: "",
    endDate: "",
    userId: "",
  });
  const [selectedView, setSelectedView] = useState("overview"); // overview, timeanalysis, trends, charts, userwise, table
  const [searchTerm, setSearchTerm] = useState("");
  const [timeAnalysisData, setTimeAnalysisData] = useState(null);
  const [timeUnit, setTimeUnit] = useState("month"); // 'month', 'week', 'quarter', 'year'
  const [chartType, setChartType] = useState("line"); // 'line', 'bar', 'area', 'pie'
  const [dashboardData, setDashboardData] = useState(null);
  const [tableData, setTableData] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageLimit, setPageLimit] = useState(10);
  const [bankAnalysisData, setBankAnalysisData] = useState(null);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [selectedBankForPopup, setSelectedBankForPopup] = useState(null);
  const [showEntriesPopup, setShowEntriesPopup] = useState(false);

  const currentUser = getUserFromToken();

  // Check if user has admin privileges (HEAD or ADDHEAD can access Admin Analysis)
  const hasAdminAccess =
    currentUser?.role && ADMIN_ROLES.includes(currentUser.role);

  useEffect(() => {
    if (hasAdminAccess) {
      fetchUsers();
      fetchDashboardData();
    }
  }, [hasAdminAccess]);

  const fetchUsers = async () => {
    try {
      const response = await userAPI.getAllUsers();
      setUsers(response.users || []);
    } catch (error) {
      // Users fetch failed silently handled
    }
  };

  const fetchDashboardData = async () => {
    if (!hasAdminAccess) return;

    setLoading(true);
    setError(null);
    try {
      const params = {
        page: currentPage,
        limit: pageLimit,
      };

      // Process filter parameters to match backend API format
      if (filters.selectedDate) {
        params.selectedDate = filters.selectedDate; // YYYY-MM-DD format
      }

      if (filters.selectedMonth) {
        // Convert "2025-03" to month: 3, year: 2025
        const [year, month] = filters.selectedMonth.split("-");
        if (year && month) {
          params.selectedMonth = parseInt(month, 10);
          params.selectedYear = parseInt(year, 10);
        }
      }

      if (filters.selectedQuarter) {
        // Convert "2025-Q1" to quarter: 1, year: 2025
        const [year, quarter] = filters.selectedQuarter.split("-Q");
        if (year && quarter) {
          params.selectedQuarter = parseInt(quarter, 10);
          params.selectedYear = parseInt(year, 10);
        }
      }

      if (
        filters.selectedYear &&
        !filters.selectedMonth &&
        !filters.selectedQuarter
      ) {
        // Only year filter (no month or quarter selected)
        params.selectedYear = parseInt(filters.selectedYear, 10);
      }

      // Explicit date range (takes precedence when provided)
      if (filters.startDate && filters.endDate) {
        params.startDate = filters.startDate; // YYYY-MM-DD
        params.endDate = filters.endDate; // YYYY-MM-DD
      }

      const response = await adExpenseAPI.getHeadDashboard(params);

      setDashboardData(response);
      setTableData(response.tableData);

      // Convert dashboard data to analysisData format for backward compatibility
      const analysisData = {
        overallStats: {
          totalExpenses: response.summary.totalExpenses,
          totalAmount: response.summary.totalAmount,
          averageAmount: response.summary.averageAmount,
          // verifiedExpenses: response.summary.verifiedExpenses,
          // unverifiedExpenses: response.summary.unverifiedExpenses,
          verificationRate: response.summary.verificationRate,
        },
        summary: {
          totalUsers: response.summary.totalHeadUsers,
          averageAmountPerUser:
            response.summary.totalHeadUsers > 0
              ? response.summary.totalAmount / response.summary.totalHeadUsers
              : 0,
          averageEntriesPerUser:
            response.summary.totalHeadUsers > 0
              ? response.summary.totalExpenses / response.summary.totalHeadUsers
              : 0,
        },
        userWisePerformance: response.userAnalysis || [],
        topPerformers: response.topPerformers || { byAmount: [] },
        monthlyTrend: response.monthlyTrend || [],
        dateRange: response.summary.dateRange || {
          startDate:
            filters.startDate || new Date().toISOString().split("T")[0],
          endDate: filters.endDate || new Date().toISOString().split("T")[0],
        },
      };

      setAnalysisData(analysisData);
      setError(null);
    } catch (error) {
      setError(error.message || "Failed to fetch dashboard data");
      setDashboardData(null);
      setAnalysisData(null);
    } finally {
      setLoading(false);
    }
  };
  const fetchTimeAnalysisData = async () => {
    if (!hasAdminAccess) return;

    try {
      setLoading(true);
      const params = {
        unit: timeUnit,
      };

      // Process filter parameters to match backend API format
      if (filters.selectedDate) {
        params.selectedDate = filters.selectedDate; // YYYY-MM-DD format
      }

      if (filters.selectedMonth) {
        // Convert "2025-03" to month: 3, year: 2025
        const [year, month] = filters.selectedMonth.split("-");
        if (year && month) {
          params.selectedMonth = parseInt(month, 10);
          params.selectedYear = parseInt(year, 10);
        }
      }

      if (filters.selectedQuarter) {
        // Convert "2025-Q1" to quarter: 1, year: 2025
        const [year, quarter] = filters.selectedQuarter.split("-Q");
        if (year && quarter) {
          params.selectedQuarter = parseInt(quarter, 10);
          params.selectedYear = parseInt(year, 10);
        }
      }

      if (
        filters.selectedYear &&
        !filters.selectedMonth &&
        !filters.selectedQuarter
      ) {
        // Only year filter (no month or quarter selected)
        params.selectedYear = parseInt(filters.selectedYear, 10);
      }

      // Use the HEAD time analysis API endpoint
      const response = await adExpenseAPI.getHeadUsersAnalysisByTime(params);

      setTimeAnalysisData(response);
      setError(null);
    } catch (error) {
      setError(error.message || "Failed to fetch time analysis data");
      setTimeAnalysisData(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchBankAnalysis = async () => {
    if (!hasAdminAccess) return;

    try {
      setLoading(true);
      
      // Prepare filters for the bank analysis API
      const analysisFilters = {};
      
      // Add date filters if available
      if (filters.startDate) {
        analysisFilters.startDate = filters.startDate;
      }
      if (filters.endDate) {
        analysisFilters.endDate = filters.endDate;
      }
      // Add specific date-based filters
      if (filters.selectedDate) {
        analysisFilters.startDate = filters.selectedDate;
        analysisFilters.endDate = filters.selectedDate;
      }
      if (filters.selectedMonth) {
        const year = filters.selectedMonth.split('-')[0];
        const month = filters.selectedMonth.split('-')[1];
        analysisFilters.startDate = `${year}-${month}-01`;
        const lastDay = new Date(year, month, 0).getDate();
        analysisFilters.endDate = `${year}-${month}-${lastDay}`;
      }
      if (filters.userId) {
        analysisFilters.userId = filters.userId;
      }

      // Fetch comprehensive bank account analysis using the dedicated API
      const bankAnalysisResponse = await bankAccountAPI.getAllBankAccountsAnalysis(analysisFilters);
      console.log("Bank Analysis Response:", bankAnalysisResponse);
      if (bankAnalysisResponse) {
        // Transform the API response to match the expected format for the UI
        const transformedData = {
          summary: {
            totalBankAccounts: bankAnalysisResponse.summary?.totalBankAccounts || 0,
            activeBankAccounts: bankAnalysisResponse.summary?.activeAccounts || 0,
            totalPaymentsAmount: (bankAnalysisResponse.summary?.totalTransactionAmount || 0) + (bankAnalysisResponse.summary?.totalExpenseAmount || 0),
            totalPaymentsCount: (bankAnalysisResponse.summary?.totalTransactions || 0) + (bankAnalysisResponse.summary?.totalExpenses || 0),
            totalLinkedExpenses: bankAnalysisResponse.summary?.totalExpenses || 0,
            totalLinkedExpenseAmount: bankAnalysisResponse.summary?.totalExpenseAmount || 0,
            totalNetFlow: bankAnalysisResponse.summary?.totalNetFlow || 0,
            totalUniqueUsers: bankAnalysisResponse.summary?.totalUniqueUsers || 0,
            accountsWithNegativeNetFlow: bankAnalysisResponse.summary?.accountsWithNegativeNetFlow || 0,
            accountsWithPositiveNetFlow: bankAnalysisResponse.summary?.accountsWithPositiveNetFlow || 0,
          },
          bankAnalysis: (bankAnalysisResponse.bankAccounts || []).map(bank => ({
            account: {
              _id: bank.accountId,
              bankName: bank.bankName,
              accountNumber: bank.accountNumber,
              accountHolder: bank.accountHolder,
              ifscCode: bank.ifscCode,
              branchName: bank.branchName,
              balance: bank.currentBalance,
              isActive: bank.isActive,
              createdAt: bank.createdAt,
            },
            // Transaction data
            totalAmount: bank.totalTransactionAmount || 0,
            paymentCount: bank.totalTransactions || 0,
            avgPayment: bank.averageTransactionAmount || 0,
            
            // Linked expense data (more comprehensive)
            totalLinkedExpenses: bank.totalLinkedExpenses || 0,
            totalLinkedExpenseAmount: bank.totalLinkedExpenseAmount || 0,
            averageLinkedExpenseAmount: bank.averageLinkedExpenseAmount || 0,
            linkedExpenseBreakdown: bank.linkedExpenseBreakdown || {},
            
            // Performance metrics
            performanceMetrics: bank.performanceMetrics || {},
            netFlow: bank.netFlow || 0,
            
            // Admin insights
            adminInsights: bank.adminInsights || {},
            
            // Utilization calculations
            utilizationRate: bank.performanceMetrics?.accountUtilization || 0,
            transactionVelocity: bank.performanceMetrics?.transactionVelocity || 0,
            linkedExpenseVelocity: bank.performanceMetrics?.linkedExpenseVelocity || 0,
            
            // Date ranges
            transactionDateRange: bank.transactionDateRange || { earliest: null, latest: null },
            expenseDateRange: bank.expenseDateRange || { earliest: null, latest: null },
            
            // Associated data
            associatedTids: bank.associatedTids || 0,
            tidNumbers: bank.tidNumbers || [],
            
            // User information
            user: bank.userId || {},
            
            // Monthly analysis
            monthlyTransactionAnalysis: bank.monthlyTransactionAnalysis || [],
            monthlyExpenseAnalysis: bank.monthlyExpenseAnalysis || [],
            
            // Centre analysis
            centreAnalysis: bank.centreAnalysis || [],
            
            lastUsed: bank.transactionDateRange?.latest || bank.expenseDateRange?.latest,
            transactions: bank.recentTransactions || []
          }))
        };

        setBankAnalysisData(transformedData);
        setBankAccounts(bankAnalysisResponse.bankAccounts || []);
      }
      
      setError(null);
    } catch (error) {
      console.error('Bank analysis fetch error:', error);
      setError(error.message || "Failed to fetch bank analysis data");
      setBankAnalysisData(null);
    } finally {
      setLoading(false);
    }
  };



  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const applyFilters = () => {
    // Show processed parameters that will be sent to API
    const processedParams = {};

    if (filters.selectedDate) {
      processedParams.selectedDate = filters.selectedDate;
    }

    if (filters.selectedMonth) {
      const [year, month] = filters.selectedMonth.split("-");
      if (year && month) {
        processedParams.selectedMonth = parseInt(month, 10);
        processedParams.selectedYear = parseInt(year, 10);
      }
    }

    if (filters.selectedQuarter) {
      const [year, quarter] = filters.selectedQuarter.split("-Q");
      if (year && quarter) {
        processedParams.selectedQuarter = parseInt(quarter, 10);
        processedParams.selectedYear = parseInt(year, 10);
      }
    }

    if (
      filters.selectedYear &&
      !filters.selectedMonth &&
      !filters.selectedQuarter
    ) {
      processedParams.selectedYear = parseInt(filters.selectedYear, 10);
    }

    if (filters.startDate && filters.endDate) {
      processedParams.startDate = filters.startDate;
      processedParams.endDate = filters.endDate;
    }

    // Count active filters
    const activeFilters = Object.entries(filters).filter(
      ([key, value]) => value && value.trim() !== ""
    ).length;

    setCurrentPage(1); // Reset to first page when applying filters
    fetchDashboardData();
  };

  const resetFilters = () => {
    setFilters({
      selectedDate: "",
      selectedMonth: "",
      selectedQuarter: "",
      selectedYear: "",
      startDate: "",
      endDate: "",
      userId: "",
    });
    setCurrentPage(1);
    setTimeout(() => fetchDashboardData(), 100);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-IN");
  };

  const getUserName = (userId) => {
    const user = users.find((u) => u._id === userId);
    return user ? user.name : "Unknown User";
  };

  // Format chart data from API response
  const prepareChartData = (analysisData) => {
    if (!analysisData || analysisData.length === 0) return [];

    return analysisData
      .map((period, index) => {
        let periodLabel = "";
        let sortKey = "";

        if (timeUnit === "month") {
          const date = new Date(period._id.year, period._id.month - 1);
          periodLabel = date.toLocaleDateString("en-IN", {
            year: "numeric",
            month: "short",
          });
          sortKey = `${period._id.year}-${String(period._id.month).padStart(
            2,
            "0"
          )}`;
        } else if (timeUnit === "week") {
          periodLabel = `${period._id.year} W${period._id.week}`;
          sortKey = `${period._id.year}-W${String(period._id.week).padStart(
            2,
            "0"
          )}`;
        } else if (timeUnit === "quarter") {
          periodLabel = `${period._id.year} Q${period._id.quarter}`;
          sortKey = `${period._id.year}-Q${period._id.quarter}`;
        } else if (timeUnit === "year") {
          periodLabel = `${period._id.year}`;
          sortKey = `${period._id.year}`;
        }

        return {
          period: periodLabel,
          sortKey,
          totalAmount: period.totalAmount,
          count: period.count,
          averageAmount: Math.round(period.totalAmount / period.count),
          // Format for display
          displayAmount: formatCurrency(period.totalAmount),
          displayAverage: formatCurrency(period.totalAmount / period.count),
        };
      })
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  };

  // Get summary statistics
  const getSummaryStats = (chartData) => {
    if (!chartData || chartData.length === 0) return null;

    const totalAmount = chartData.reduce(
      (sum, item) => sum + item.totalAmount,
      0
    );
    const totalCount = chartData.reduce((sum, item) => sum + item.count, 0);
    const avgAmount = totalAmount / totalCount;

    // Find trends
    const latestPeriod = chartData[chartData.length - 1];
    const previousPeriod = chartData[chartData.length - 2];

    let trend = null;
    if (previousPeriod) {
      const amountChange =
        latestPeriod.totalAmount - previousPeriod.totalAmount;
      const percentChange = (
        (amountChange / previousPeriod.totalAmount) *
        100
      ).toFixed(1);
      trend = {
        amount: amountChange,
        percent: percentChange,
        direction: amountChange >= 0 ? "up" : "down",
      };
    }

    return {
      totalAmount,
      totalCount,
      avgAmount,
      trend,
      periodsCount: chartData.length,
    };
  };

  // Chart colors
  const CHART_COLORS = [
    "#f97316",
    "#3b82f6",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
  ];

  const filteredUsers =
    analysisData?.userWisePerformance?.filter(
      (user) =>
        user.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.loginId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.userRole.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

  // Access denied component
  if (!hasAdminAccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg  p-8 max-w-md mx-auto text-center">
          <div className="text-red-500 text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 mb-4">
            You don't have permission to access admin analysis. Only HEAD or
            ADDHEAD (Admin) roles are allowed.
          </p>
          <div className="text-sm text-gray-500">
            Your role:{" "}
            <span className="font-medium">
              {currentUser?.role || "Unknown"}
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-700 font-medium text-lg">
            Loading Admin Analysis...
          </p>
          <p className="text-gray-500 text-sm mt-2">
            Please wait while we fetch the data
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg  p-8 max-w-md mx-auto text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-gradient-to-tr from-white via-gray-100 to-slate-100">
      <div className="w-full h-full bg-white overflow-y-auto">
        <div className="flex flex-col px-4 md:px-6 lg:px-8 xl:px-12 h-full">
          <div className="py-4 md:py-6 lg:py-8 xl:py-12 w-full max-w-full">
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-800 flex items-center gap-2">
                    <FiBarChart2 className="text-amber-500" />
                    Admin <span className="text-amber-500">Analysis</span>
                  </h1>
                  <p className="text-sm text-gray-600">
                    Comprehensive analytics and insights for expense management
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={fetchDashboardData}
                    disabled={loading}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
                    title="Refresh data"
                  >
                    <FiRefreshCw className={loading ? 'animate-spin' : ''} />
                    Refresh
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-400 to-amber-400 text-white font-semibold rounded-lg hover:from-orange-500 hover:to-amber-500 transition-all duration-200"
                  >
                    <FiDownload />
                    Export
                  </button>
                </div>
              </div>

              {/* Summary Stats Cards */}
              {analysisData?.overallStats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                        <FiDollarSign className="text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-blue-600 font-medium">Total Expenses</p>
                        <p className="text-2xl font-bold text-blue-800">{analysisData.overallStats.totalExpenses || 0}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                        <FiTrendingUp className="text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-green-600 font-medium">Total Amount</p>
                        <p className="text-2xl font-bold text-green-800">
                          {formatCurrency(analysisData.overallStats.totalAmount || 0)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                        <FiUsers className="text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-purple-600 font-medium">HEAD Users</p>
                        <p className="text-2xl font-bold text-purple-800">
                          {dashboardData?.summary?.totalHeadUsers || analysisData?.summary?.totalUsers || 0}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-amber-50 to-amber-100 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center">
                        <FiTarget className="text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-amber-600 font-medium">Average Amount</p>
                        <p className="text-2xl font-bold text-amber-800">
                          {formatCurrency(analysisData.overallStats.averageAmount || 0)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Messages */}
            {error && (
              <div className="bg-red-100 border border-red-300 rounded-lg p-3 mb-4">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {/* Advanced Filter Section */}
            <div className="bg-white rounded-lg  border border-gray-200 mb-6">
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-lg font-semibold text-gray-800">
                  <FiFilter className="inline text-amber-500 mr-2" />
                  Advanced Filters
                </h2>
                <div className="flex gap-3">
                  <button
                    onClick={applyFilters}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-400 to-amber-400 text-white font-semibold rounded-lg hover:from-orange-500 hover:to-amber-500 transition-all duration-200"
                  >
                    <FiFilter />
                    Apply Filters
                  </button>
                  <button
                    onClick={resetFilters}
                    className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <FiRefreshCw />
                    Reset
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Quick Date Selection */}
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Quick Date Select
                      {filters.selectedDate && (
                        <span className="text-green-600 ml-1">●</span>
                      )}
                    </label>
                    <div className="relative mt-1">
                      <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                      <input
                        type="date"
                        value={filters.selectedDate}
                        onChange={(e) =>
                          handleFilterChange("selectedDate", e.target.value)
                        }
                        className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
                      />
                    </div>
                  </div>

                  {/* Month Selection */}
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Select Month
                      {filters.selectedMonth && (
                        <span className="text-green-600 ml-1">●</span>
                      )}
                    </label>
                    <div className="relative mt-1">
                      <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                      <input
                        type="month"
                        value={filters.selectedMonth}
                        onChange={(e) =>
                          handleFilterChange("selectedMonth", e.target.value)
                        }
                        className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
                      />
                    </div>
                  </div>

                  {/* Quarter Selection */}
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Select Quarter
                      {filters.selectedQuarter && (
                        <span className="text-green-600 ml-1">●</span>
                      )}
                    </label>
                    <div className="relative mt-1">
                      <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                      <select
                        value={filters.selectedQuarter}
                        onChange={(e) =>
                          handleFilterChange("selectedQuarter", e.target.value)
                        }
                        className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
                      >
                        <option value="">All Quarters</option>
                        <option value="2024-Q1">2024 Q1</option>
                        <option value="2024-Q2">2024 Q2</option>
                        <option value="2024-Q3">2024 Q3</option>
                        <option value="2024-Q4">2024 Q4</option>
                        <option value="2025-Q1">2025 Q1</option>
                        <option value="2025-Q2">2025 Q2</option>
                        <option value="2025-Q3">2025 Q3</option>
                        <option value="2025-Q4">2025 Q4</option>
                      </select>
                    </div>
                  </div>

                  {/* Year Selection */}
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Select Year
                      {filters.selectedYear && (
                        <span className="text-green-600 ml-1">●</span>
                      )}
                    </label>
                    <div className="relative mt-1">
                      <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                      <select
                        value={filters.selectedYear}
                        onChange={(e) =>
                          handleFilterChange("selectedYear", e.target.value)
                        }
                        className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
                      >
                        <option value="">All Years</option>
                        <option value="2023">2023</option>
                        <option value="2024">2024</option>
                        <option value="2025">2025</option>
                      </select>
                    </div>
                  </div>

                  {/* Custom Date Range - Start */}
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Start Date
                      {filters.startDate && (
                        <span className="text-green-600 ml-1">●</span>
                      )}
                    </label>
                    <div className="relative mt-1">
                      <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                      <input
                        type="date"
                        value={filters.startDate}
                        onChange={(e) =>
                          handleFilterChange("startDate", e.target.value)
                        }
                        className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
                      />
                    </div>
                  </div>

                  {/* Custom Date Range - End */}
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      End Date
                      {filters.endDate && <span className="text-green-600 ml-1">●</span>}
                    </label>
                    <div className="relative mt-1">
                      <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                      <input
                        type="date"
                        value={filters.endDate}
                        onChange={(e) =>
                          handleFilterChange("endDate", e.target.value)
                        }
                        className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
                      />
                    </div>
                  </div>

                  {/* User Selection */}
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Select User
                      {filters.userId && <span className="text-green-600 ml-1">●</span>}
                    </label>
                    <div className="relative mt-1">
                      <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                      <select
                        value={filters.userId}
                        onChange={(e) => handleFilterChange("userId", e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
                      >
                        <option value="">All HEAD Users</option>
                        {dashboardData?.allHeadUsers?.map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.name} ({user.loginId})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
            </div>
          </div>
        </div>

            {/* View Tabs */}
            <div className="bg-white rounded-lg  border border-gray-200 mb-6">
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8 px-6" aria-label="Tabs">
                  {[
                    { id: "overview", label: "Overview", icon: FiBarChart2 },
                    { id: "userwise", label: "Users", icon: FiUsers },
                    { id: "bankanalysis", label: "Bank Analysis", icon: FiCreditCard },
                    { id: "table", label: "Table", icon: FiList },
                    { id: "timeanalysis", label: "Time Analysis", icon: FiCalendar },
                    { id: "charts", label: "Charts", icon: FiPieChart },
                    { id: "trends", label: "Trends", icon: FiTrendingUp },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setSelectedView(tab.id);
                        if (
                          tab.id === "timeanalysis" ||
                          tab.id === "charts" ||
                          tab.id === "trends"
                        ) {
                          fetchTimeAnalysisData();
                        } else if (tab.id === "bankanalysis") {
                          fetchBankAnalysis();
                        }
                      }}
                      className={`${
                        selectedView === tab.id
                          ? 'border-amber-500 text-amber-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors`}
                    >
                      <tab.icon className="text-sm" />
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>

              <div className="p-6">
                {/* Overview Tab */}
                {selectedView === "overview" &&
                  analysisData &&
                  analysisData.overallStats && (
                    <div className="space-y-6">
                      {/* Performance Insights */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-6">
                          <h4 className="text-lg font-semibold text-blue-800 mb-4 flex items-center gap-2">
                            <FiActivity className="text-blue-600" />
                            Performance Metrics
                          </h4>
                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <span className="text-blue-700 text-sm">
                                Avg Amount per Entry:
                              </span>
                              <span className="font-medium text-blue-900 text-sm">
                                {formatCurrency(
                                  analysisData?.overallStats?.averageAmount || 0
                                )}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-blue-700 text-sm">
                                Avg Amount per User:
                              </span>
                              <span className="font-medium text-blue-900 text-sm">
                                {formatCurrency(
                                  analysisData?.summary?.averageAmountPerUser || 0
                                )}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-blue-700 text-sm">
                                Avg Entries per User:
                              </span>
                              <span className="font-medium text-blue-900 text-sm">
                                {Math.round(analysisData?.summary?.averageEntriesPerUser || 0)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-6">
                          <h4 className="text-lg font-semibold text-green-800 mb-4 flex items-center gap-2">
                            <FiCheckCircle className="text-green-600" />
                            Verification Status
                          </h4>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-green-700 text-sm flex items-center gap-1">
                                <FiCheckCircle className="text-green-500 text-sm" />
                                Verified:
                              </span>
                              <span className="font-medium text-green-800 text-sm">
                                {analysisData?.overallStats?.verifiedExpenses || 0}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-green-700 text-sm flex items-center gap-1">
                                <FiClock className="text-yellow-500 text-sm" />
                                Pending:
                              </span>
                              <span className="font-medium text-yellow-600 text-sm">
                                {analysisData?.overallStats?.unverifiedExpenses || 0}
                              </span>
                            </div>
                            <div className="mt-3">
                              <div className="flex justify-between text-xs text-green-700 mb-1">
                                <span>Verification Rate</span>
                                <span>{Math.round(analysisData?.overallStats?.verificationRate || 0)}%</span>
                              </div>
                              <div className="w-full bg-green-200 rounded-full h-2">
                                <div
                                  className="bg-green-500 h-2 rounded-full transition-all duration-500"
                                  style={{
                                    width: `${analysisData?.overallStats?.verificationRate || 0}%`,
                                  }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="bg-gradient-to-r from-amber-50 to-amber-100 rounded-lg p-6">
                          <h4 className="text-lg font-semibold text-amber-800 mb-4 flex items-center gap-2">
                            <FiTarget className="text-amber-600" />
                            Top Performers
                          </h4>
                          <div className="space-y-3">
                            {(analysisData?.topPerformers?.byAmount || [])
                              .slice(0, 3)
                              .map((user, index) => (
                                <div
                                  key={user.userId || index}
                                  className="flex items-center justify-between p-2 bg-white rounded-lg"
                                >
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                                        index === 0
                                          ? "bg-yellow-500 text-white"
                                          : index === 1
                                          ? "bg-gray-400 text-white"
                                          : "bg-orange-500 text-white"
                                      }`}
                                    >
                                      {index + 1}
                                    </span>
                                    <span className="text-sm text-gray-900 font-medium truncate">
                                      {user.userName || "Unknown"}
                                    </span>
                                  </div>
                                  <span className="text-sm font-bold text-amber-700">
                                    {formatCurrency(user.totalAmount || 0)}
                                  </span>
                                </div>
                              ))}
                            {(!analysisData?.topPerformers?.byAmount ||
                              analysisData.topPerformers.byAmount.length === 0) && (
                              <div className="text-sm text-amber-600 text-center py-4">
                                <FiInfo className="mx-auto text-2xl mb-2" />
                                No performance data available
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                {/* User Performance Tab */}
                {selectedView === "userwise" && analysisData && (
                  <div className="space-y-6">
                    {/* Search and Stats */}
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                      <div className="flex-1 max-w-md">
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Search users by name, login ID, or role..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-10 py-3 bg-white border border-gray-300 rounded-lg text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
                          />
                          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                          {searchTerm && (
                            <button
                              onClick={() => setSearchTerm('')}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                              <FiX />
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium">
                          {filteredUsers.length} of {analysisData?.userWisePerformance?.length || 0} users
                        </div>
                      </div>
                    </div>

                    {/* User Performance Cards */}
                    {filteredUsers && filteredUsers.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredUsers.map((user, index) => (
                          <div
                            key={user.userId || index}
                            className="bg-white rounded-lg border border-gray-200 p-6 hover: transition-shadow duration-200"
                          >
                            <div className="flex items-center gap-4 mb-4">
                              <div className="w-12 h-12 bg-gradient-to-r from-amber-400 to-amber-500 rounded-full flex items-center justify-center">
                                <FiUser className="text-white text-lg" />
                              </div>
                              <div className="flex-1">
                                <h3 className="font-semibold text-gray-900 text-sm">
                                  {user.userName || "Unknown"}
                                </h3>
                                <p className="text-xs text-gray-500">
                                  {user.loginId || "N/A"} • {user.userRole || "HEAD"}
                                </p>
                              </div>
                            </div>
                            
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600 flex items-center gap-1">
                                  <FiDollarSign className="text-green-500" />
                                  Total Amount:
                                </span>
                                <span className="font-semibold text-green-600">
                                  {formatCurrency(user.totalAmount || 0)}
                                </span>
                              </div>
                              
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600 flex items-center gap-1">
                                  <FiActivity className="text-blue-500" />
                                  Total Entries:
                                </span>
                                <span className="font-semibold text-blue-600">
                                  {user.totalEntries || 0}
                                </span>
                              </div>
                              
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600 flex items-center gap-1">
                                  <FiTrendingUp className="text-purple-500" />
                                  Average:
                                </span>
                                <span className="font-semibold text-purple-600">
                                  {formatCurrency(user.averageAmount || 0)}
                                </span>
                              </div>

                              {/* Performance Bar */}
                              <div className="mt-4">
                                <div className="flex justify-between items-center mb-1">
                                  <span className="text-xs text-gray-500">Performance</span>
                                  <span className="text-xs text-gray-500">
                                    {Math.round(((user.totalAmount || 0) / Math.max(...(analysisData?.userWisePerformance || []).map(u => u.totalAmount || 0), 1)) * 100)}%
                                  </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-gradient-to-r from-amber-400 to-amber-500 h-2 rounded-full transition-all duration-500"
                                    style={{
                                      width: `${Math.round(((user.totalAmount || 0) / Math.max(...(analysisData?.userWisePerformance || []).map(u => u.totalAmount || 0), 1)) * 100)}%`,
                                    }}
                                  ></div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-gray-50 rounded-lg border border-gray-200 p-8 text-center">
                        <FiUsers className="mx-auto text-gray-400 text-4xl mb-4" />
                        <p className="text-gray-500 text-lg mb-2">
                          {searchTerm ? 'No users match your search' : 'No user data available'}
                        </p>
                        <p className="text-gray-400 text-sm mb-4">
                          {searchTerm ? 'Try adjusting your search terms' : 'User performance data will appear here once available'}
                        </p>
                        {searchTerm && (
                          <button
                            onClick={() => setSearchTerm('')}
                            className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
                          >
                            Clear Search
                          </button>
                        )}
                      </div>
                    )}
              </div>
            )}

                {/* Bank Analysis Tab */}
                {selectedView === "bankanalysis" && (
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                          <FiCreditCard className="text-amber-500" />
                          Bank Account Analysis
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Track payments and usage across all bank accounts
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={fetchBankAnalysis}
                          disabled={loading}
                          className={`flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-400 to-amber-400 text-white font-semibold rounded-lg hover:from-orange-500 hover:to-amber-500 transition-all duration-200 ${
                            loading ? 'opacity-75 cursor-not-allowed' : ''
                          }`}
                        >
                          <FiRefreshCw className={loading ? 'animate-spin' : ''} />
                          {loading ? 'Loading...' : 'Refresh Analysis'}
                        </button>
                      </div>
                    </div>

                    {/* Enhanced Bank Analysis Summary */}
                    {loading ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className="bg-gray-50 rounded-lg p-4 animate-pulse">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                              <div className="flex-1">
                                <div className="h-3 bg-gray-300 rounded mb-2"></div>
                                <div className="h-6 bg-gray-300 rounded"></div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : bankAnalysisData?.summary ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                              <FiCreditCard className="text-white text-sm" />
                            </div>
                            <div>
                              <p className="text-xs text-blue-600 font-medium">Total Accounts</p>
                              <p className="text-xl font-bold text-blue-800">
                                {bankAnalysisData.summary.totalBankAccounts}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                              <FiActivity className="text-white text-sm" />
                            </div>
                            <div>
                              <p className="text-xs text-green-600 font-medium">Active Accounts</p>
                              <p className="text-xl font-bold text-green-800">
                                {bankAnalysisData.summary.activeBankAccounts}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-gradient-to-r from-amber-50 to-amber-100 rounded-lg p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center">
                              <FiTrendingUp className="text-white text-sm" />
                            </div>
                            <div>
                              <p className="text-xs text-amber-600 font-medium">Total Expenses</p>
                              <p className="text-xl font-bold text-amber-800">
                                {bankAnalysisData.summary.totalLinkedExpenses || 0}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 rounded-lg p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center">
                              <FiUsers className="text-white text-sm" />
                            </div>
                            <div>
                              <p className="text-xs text-indigo-600 font-medium">Unique Users</p>
                              <p className="text-xl font-bold text-indigo-800">
                                {bankAnalysisData.summary.totalUniqueUsers || 0}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : null}

                    {/* Bank Expenses Chart */}
                    {loading ? (
                      <div className="bg-white rounded-lg border border-gray-200 p-6  mb-6">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-5 h-5 bg-gray-300 rounded animate-pulse"></div>
                          <div className="h-6 bg-gray-300 rounded w-64 animate-pulse"></div>
                        </div>
                        <div className="h-80 bg-gray-100 rounded animate-pulse flex items-center justify-center">
                          <div className="text-gray-400">Loading chart...</div>
                        </div>
                      </div>
                    ) : bankAnalysisData?.bankAnalysis && bankAnalysisData.bankAnalysis.length > 0 ? (
                      <div className="bg-white rounded-lg border border-gray-200 p-6  mb-6">
                        <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                          <FiBarChart2 className="text-purple-500" />
                          Bank Account Expenses Overview
                        </h4>
                        <div className="h-80">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart 
                              data={bankAnalysisData.bankAnalysis.map(bank => ({
                                name: bank.account.bankName.length > 15 
                                  ? bank.account.bankName.substring(0, 15) + '...' 
                                  : bank.account.bankName,
                                fullName: bank.account.bankName,
                                linkedExpenses: bank.totalLinkedExpenseAmount || 0,
                                expenseCount: bank.totalLinkedExpenses || 0,
                                adExpenses: bank.linkedExpenseBreakdown?.linkedAdExpenseAmount || 0,
                                regularExpenses: bank.linkedExpenseBreakdown?.linkedRegularExpenseAmount || 0,
                                totalEntries: (bank.totalLinkedExpenses || 0) + (bank.paymentCount || 0),
                              }))}
                              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                              <XAxis 
                                dataKey="name" 
                                stroke="#6b7280" 
                                fontSize={11}
                                angle={-45}
                                textAnchor="end"
                                height={80}
                              />
                              <YAxis stroke="#6b7280" fontSize={11} />
                              <Tooltip
                                formatter={(value, name) => [
                                  formatCurrency(value),
                                  name === 'linkedExpenses' ? 'Total Linked Expenses' : 
                                  name === 'adExpenses' ? 'Ad Expenses' : 'Regular Expenses'
                                ]}
                                labelFormatter={(label, payload) => {
                                  const data = payload?.[0]?.payload;
                                  return `${data?.fullName || label} (${data?.totalEntries || 0} total entries)`;
                                }}
                                contentStyle={{
                                  backgroundColor: "#f9fafb",
                                  border: "1px solid #e5e7eb",
                                  borderRadius: "8px",
                                  fontSize: "12px",
                                }}
                              />
                              <Legend wrapperStyle={{ fontSize: "11px" }} />
                              <Bar 
                                dataKey="adExpenses" 
                                stackId="expenses"
                                fill="#8b5cf6" 
                                name="Ad Expenses"
                                radius={[0, 0, 0, 0]}
                              />
                              <Bar 
                                dataKey="regularExpenses" 
                                stackId="expenses"
                                fill="#06b6d4" 
                                name="Regular Expenses"
                                radius={[2, 2, 0, 0]}
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    ) : null}

                    {/* Comprehensive Bank Account Cards */}
                    {loading ? (
                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        {[1, 2].map((i) => (
                          <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
                            <div className="flex items-center gap-4 mb-6">
                              <div className="w-14 h-14 bg-gray-300 rounded-full"></div>
                              <div className="flex-1">
                                <div className="h-5 bg-gray-300 rounded mb-2"></div>
                                <div className="h-4 bg-gray-300 rounded mb-1 w-3/4"></div>
                                <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                              </div>
                              <div className="text-right">
                                <div className="h-6 bg-gray-300 rounded w-16 mb-2"></div>
                                <div className="h-6 bg-gray-300 rounded w-20"></div>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
                              {[1, 2, 3, 4, 5, 6].map((j) => (
                                <div key={j} className="bg-gray-100 rounded-lg p-3">
                                  <div className="h-3 bg-gray-300 rounded mb-2"></div>
                                  <div className="h-5 bg-gray-300 rounded mb-1"></div>
                                  <div className="h-3 bg-gray-300 rounded w-2/3"></div>
                                </div>
                              ))}
                            </div>
                            <div className="space-y-4">
                              <div className="h-20 bg-gray-100 rounded"></div>
                              <div className="h-16 bg-gray-100 rounded"></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : bankAnalysisData?.bankAnalysis && bankAnalysisData.bankAnalysis.length > 0 ? (
                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        {bankAnalysisData.bankAnalysis.map((bankData, index) => (
                          <div
                            key={bankData.account._id || index}
                            className="bg-white rounded-lg border border-gray-200 p-6 hover: transition-all duration-200"
                          >
                            {/* Bank Account Header */}
                            <div className="flex items-center gap-4 mb-6">
                              <div className="w-14 h-14 bg-gradient-to-r from-amber-400 to-amber-500 rounded-full flex items-center justify-center">
                                <FiCreditCard className="text-white text-xl" />
                              </div>
                              <div className="flex-1">
                                <h3 className="font-semibold text-gray-900 text-lg">
                                  {bankData.account.bankName}
                                </h3>
                                <p className="text-sm text-gray-600">
                                  {bankData.account.accountHolder}
                                </p>
                                <p className="text-xs text-gray-500 font-mono">
                                  {bankData.account.accountNumber}
                                </p>
                              </div>
                              <div className="text-right">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  bankData.account.isActive
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {bankData.account.isActive ? 'Active' : 'Inactive'}
                                </span>
                                <div className="mt-2">
                                  <button
                                    onClick={() => {
                                      setSelectedBankForPopup(bankData);
                                      setShowEntriesPopup(true);
                                    }}
                                    className="inline-flex items-center px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-full hover:bg-blue-200 transition-colors"
                                  >
                                    <FiEye className="mr-1" />
                                    View Entries
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Enhanced Statistics Grid */}
                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
                              

                              {/* Linked Expenses */}
                              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-3">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-xs text-purple-600 font-medium">Linked Expenses</p>
                                    <p className="text-lg font-bold text-purple-800">
                                      {formatCurrency(bankData.totalLinkedExpenseAmount || 0)}
                                    </p>
                                    <p className="text-xs text-purple-600">
                                      {bankData.totalLinkedExpenses || 0} entries
                                    </p>
                                  </div>
                                  <FiActivity className="text-purple-400 text-lg" />
                                </div>
                              </div>

                              {/* Total Entries */}
                              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg p-3">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-xs text-emerald-600 font-medium">Total Entries</p>
                                    <p className="text-lg font-bold text-emerald-800">
                                      {(bankData.totalLinkedExpenses || 0) + (bankData.paymentCount || 0)}
                                    </p>
                                    <p className="text-xs text-emerald-600">
                                      All transactions & expenses
                                    </p>
                                  </div>
                                  <FiList className="text-emerald-400 text-lg" />
                                </div>
                              </div>

                              

                              {/* Average Expense */}
                              <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-3">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-xs text-amber-600 font-medium">Avg Expense</p>
                                    <p className="text-lg font-bold text-amber-800">
                                      {formatCurrency(bankData.averageLinkedExpenseAmount || 0)}
                                    </p>
                                  </div>
                                  <FiTarget className="text-amber-400 text-lg" />
                                </div>
                              </div>
                            </div>

                          

                            {/* Date Ranges */}
                            <div className="bg-blue-50 rounded-lg p-4 mb-6">
                              <h4 className="text-sm font-semibold text-blue-800 mb-3 flex items-center gap-2">
                                <FiCalendar className="text-blue-600" />
                                Activity Timeline
                              </h4>
                              <div className="grid grid-cols-1 gap-3">
                                {bankData.expenseDateRange?.earliest && (
                                  <div className="flex justify-between items-center">
                                    <span className="text-xs text-blue-600">Expense Range:</span>
                                    <span className="text-xs text-blue-800 font-mono">
                                      {formatDate(bankData.expenseDateRange.earliest)} - {formatDate(bankData.expenseDateRange.latest)}
                                    </span>
                                  </div>
                                )}
                                {bankData.transactionDateRange?.earliest && (
                                  <div className="flex justify-between items-center">
                                    <span className="text-xs text-blue-600">Transaction Range:</span>
                                    <span className="text-xs text-blue-800 font-mono">
                                      {formatDate(bankData.transactionDateRange.earliest)} - {formatDate(bankData.transactionDateRange.latest)}
                                    </span>
                                  </div>
                                )}
                                {bankData.adminInsights?.lastActivity && (
                                  <div className="flex justify-between items-center">
                                    <span className="text-xs text-blue-600">Last Activity:</span>
                                    <span className="text-xs text-blue-800 font-mono">
                                      {formatDate(bankData.adminInsights.lastActivity)}
                                      <span className="ml-2 text-gray-500">
                                        ({bankData.adminInsights.daysSinceLastActivity} days ago)
                                      </span>
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* User Information */}
                            {bankData.user && bankData.user.name && (
                              <div className="bg-green-50 rounded-lg p-4 mb-6">
                                <h4 className="text-sm font-semibold text-green-800 mb-2 flex items-center gap-2">
                                  <FiUser className="text-green-600" />
                                  Associated User
                                </h4>
                                <p className="text-sm text-green-800 font-medium">
                                  {bankData.user.name}
                                </p>
                              </div>
                            )}

                           
                          </div>
                        ))}
                      </div>
                    ) : !loading && (
                      <div className="bg-gray-50 rounded-lg border border-gray-200 p-8 text-center">
                        <FiCreditCard className="mx-auto text-gray-400 text-4xl mb-4" />
                        <p className="text-gray-500 text-lg mb-2">
                          {error ? 'Error loading bank analysis' : 'No bank account data available'}
                        </p>
                        <p className="text-gray-400 text-sm mb-4">
                          {error ? 'Please try refreshing the analysis' : 'Bank account analysis will appear here once available'}
                        </p>
                        <button
                          onClick={fetchBankAnalysis}
                          className={`px-4 py-2 rounded-lg transition-colors ${
                            error 
                              ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                              : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                          }`}
                        >
                          {error ? 'Retry Analysis' : 'Load Bank Analysis'}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Expense Table Tab */}
                {selectedView === "table" && dashboardData && tableData && (
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                          <FiList className="text-amber-500" />
                          Expense Records
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Detailed view of all HEAD user expense entries
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-sm text-gray-600 bg-gray-100 px-3 py-2 rounded-lg">
                          Showing {(tableData.pagination.currentPage - 1) * tableData.pagination.limit + 1} - {Math.min(tableData.pagination.currentPage * tableData.pagination.limit, tableData.pagination.totalItems)} of {tableData.pagination.totalItems} records
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="text-sm text-gray-600">Show:</label>
                          <select
                            value={pageLimit}
                            onChange={(e) => {
                              setPageLimit(parseInt(e.target.value));
                              setCurrentPage(1);
                              setTimeout(() => fetchDashboardData(), 100);
                            }}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                          >
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Table */}
                    <div className="bg-white rounded-lg border overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Date
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                User
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Paid To
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Reason
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Amount
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Location
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {tableData.data.map((expense, index) => (
                              <tr key={expense.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                                <td className="px-4 py-4">
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">
                                      {formatDate(expense.date)}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {new Date(expense.createdAt).toLocaleTimeString("en-IN")}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-4">
                                  <div className="flex items-center">
                                    <div className="flex-shrink-0 h-8 w-8">
                                      <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center">
                                        <FiUser className="text-amber-600" />
                                      </div>
                                    </div>
                                    <div className="ml-3">
                                      <div className="text-sm font-medium text-gray-900">
                                        {expense.user}
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        {expense.loginId}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-4">
                                  <div className="text-sm text-gray-900">
                                    {expense.paidTo}
                                  </div>
                                </td>
                                <td className="px-4 py-4">
                                  <div
                                    className="text-sm text-gray-700 max-w-xs truncate"
                                    title={expense.reason}
                                  >
                                    {expense.reason}
                                  </div>
                                </td>
                                <td className="px-4 py-4">
                                  <div className="text-sm font-medium text-gray-900">
                                    {formatCurrency(expense.amount)}
                                  </div>
                                </td>
                                <td className="px-4 py-4">
                                  <span
                                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                      expense.verified
                                        ? "bg-green-100 text-green-800"
                                        : "bg-yellow-100 text-yellow-800"
                                    }`}
                                  >
                                    {expense.verified ? (
                                      <>
                                        <FiCheckCircle className="mr-1" />
                                        Verified
                                      </>
                                    ) : (
                                      <>
                                        <FiClock className="mr-1" />
                                        Pending
                                      </>
                                    )}
                                  </span>
                                </td>
                                <td className="px-4 py-4">
                                  <div className="text-xs text-gray-600">
                                    {expense.regions && (
                                      <div className="flex items-center gap-1 mb-1">
                                        <span>📍</span>
                                        <span>{expense.regions}</span>
                                      </div>
                                    )}
                                    {expense.branches && (
                                      <div className="flex items-center gap-1 mb-1">
                                        <span>🏢</span>
                                        <span>{expense.branches}</span>
                                      </div>
                                    )}
                                    {expense.centres && (
                                      <div className="flex items-center gap-1">
                                        <span>🏬</span>
                                        <span>{expense.centres}</span>
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                    </table>
                  </div>

                      {/* Pagination */}
                      <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                          Page {tableData.pagination.currentPage} of {tableData.pagination.totalPages}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              if (tableData.pagination.hasPrev) {
                                setCurrentPage(currentPage - 1);
                                setTimeout(() => fetchDashboardData(), 100);
                              }
                            }}
                            disabled={!tableData.pagination.hasPrev}
                            className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
                              tableData.pagination.hasPrev
                                ? "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                                : "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
                            }`}
                          >
                            Previous
                          </button>
                          <span className="px-4 py-2 text-sm font-medium text-gray-700 bg-amber-100 rounded-lg">
                            {currentPage}
                          </span>
                          <button
                            onClick={() => {
                              if (tableData.pagination.hasNext) {
                                setCurrentPage(currentPage + 1);
                                setTimeout(() => fetchDashboardData(), 100);
                              }
                            }}
                            disabled={!tableData.pagination.hasNext}
                            className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
                              tableData.pagination.hasNext
                                ? "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                                : "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
                            }`}
                          >
                            Next
                          </button>
                        </div>
                      </div>
                </div>
              </div>
            )}

            {/* Monthly Trends Tab */}
            {selectedView === "trends" && dashboardData && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-800">
                  Monthly Expense Trends for HEAD Users
                </h3>

                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-2 py-2 text-left font-medium text-gray-500 uppercase">
                            Month
                          </th>
                          <th className="px-2 py-2 text-left font-medium text-gray-500 uppercase">
                            Amount
                          </th>
                          <th className="px-2 py-2 text-left font-medium text-gray-500 uppercase">
                            Entries
                          </th>
                          <th className="px-2 py-2 text-left font-medium text-gray-500 uppercase">
                            Users
                          </th>
                          <th className="px-2 py-2 text-left font-medium text-gray-500 uppercase">
                            Avg
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {dashboardData.monthlyTrend &&
                          dashboardData.monthlyTrend.map((month, index) => {
                            // Handle month display based on API response format
                            let monthDisplay = "N/A";
                            if (month.month) {
                              // API returns format like "2025-08"
                              monthDisplay = new Date(
                                month.month + "-01"
                              ).toLocaleDateString("en-IN", {
                                year: "numeric",
                                month: "short",
                              });
                            }

                            return (
                              <tr
                                key={month.month || index}
                                className={
                                  index % 2 === 0 ? "bg-white" : "bg-gray-50"
                                }
                              >
                                <td className="px-2 py-2">
                                  <div className="text-xs font-medium text-gray-900">
                                    {monthDisplay}
                                  </div>
                                </td>
                                <td className="px-2 py-2">
                                  <div className="text-xs font-medium text-gray-900">
                                    {formatCurrency(month.totalAmount || 0)}
                                  </div>
                                </td>
                                <td className="px-2 py-2">
                                  <div className="text-xs text-gray-900">
                                    {month.totalEntries || 0}
                                  </div>
                                </td>
                                <td className="px-2 py-2">
                                  <div className="text-xs text-gray-900">
                                    {month.activeUsers || "N/A"}
                                  </div>
                                </td>
                                <td className="px-2 py-2">
                                  <div className="text-xs text-gray-900">
                                    {month.totalEntries > 0
                                      ? formatCurrency(
                                          month.totalAmount / month.totalEntries
                                        )
                                      : formatCurrency(0)}
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
            )}

            {/* Time Analysis Tab */}
            {selectedView === "timeanalysis" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-800">
                    HEAD Users Expense Analysis by Time
                  </h3>
                  <button
                    onClick={fetchTimeAnalysisData}
                    className="px-3 py-1 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-1 text-xs"
                  >
                    <FiRefreshCw className="text-xs" />
                    Refresh
                  </button>
                </div>

                {/* Time Analysis Filters */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Time Unit
                      </label>
                      <select
                        value={timeUnit}
                        onChange={(e) => {
                          setTimeUnit(e.target.value);
                          // Auto-refresh when time unit changes
                          setTimeout(() => fetchTimeAnalysisData(), 100);
                        }}
                        className="w-full px-2 py-1 text-black text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
                      >
                        <option value="month">Monthly</option>
                        <option value="week">Weekly</option>
                        <option value="quarter">Quarterly</option>
                        <option value="year">Yearly</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Analysis Scope
                      </label>
                      <div className="w-full px-2 py-1 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-xs font-medium">
                        📊 HEAD Users Only
                      </div>
                    </div>
                  </div>
                </div>

                {/* Time Analysis Results */}
                {timeAnalysisData ? (
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <div className="px-3 py-2 border-b border-gray-200 bg-gray-50">
                      <h4 className="text-xs font-semibold text-gray-800">
                        {timeUnit.charAt(0).toUpperCase() + timeUnit.slice(1)}ly
                        Analysis for HEAD Users
                      </h4>
                      <p className="text-xs text-gray-600 mt-0.5">
                        {timeAnalysisData.analysis?.length || 0} periods | Role:{" "}
                        {timeAnalysisData.role || "HEAD"}
                      </p>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-2 py-2 text-left font-medium text-gray-500 uppercase">
                              Period
                            </th>
                            <th className="px-2 py-2 text-left font-medium text-gray-500 uppercase">
                              Amount
                            </th>
                            <th className="px-2 py-2 text-left font-medium text-gray-500 uppercase">
                              Entries
                            </th>
                            <th className="px-2 py-2 text-left font-medium text-gray-500 uppercase">
                              Average
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {timeAnalysisData.analysis?.map((period, index) => {
                            let periodLabel = "";
                            if (timeUnit === "month") {
                              periodLabel = `${period._id.year}-${String(
                                period._id.month
                              ).padStart(2, "0")}`;
                            } else if (timeUnit === "week") {
                              periodLabel = `${period._id.year} W${period._id.week}`;
                            } else if (timeUnit === "quarter") {
                              periodLabel = `${period._id.year} Q${period._id.quarter}`;
                            } else if (timeUnit === "year") {
                              periodLabel = `${period._id.year}`;
                            }

                            return (
                              <tr
                                key={index}
                                className={
                                  index % 2 === 0 ? "bg-white" : "bg-gray-50"
                                }
                              >
                                <td className="px-2 py-2">
                                  <div className="text-xs font-medium text-gray-900">
                                    {periodLabel}
                                  </div>
                                </td>
                                <td className="px-2 py-2">
                                  <div className="text-xs font-medium text-gray-900">
                                    {formatCurrency(period.totalAmount)}
                                  </div>
                                </td>
                                <td className="px-2 py-2">
                                  <div className="text-xs text-gray-900">
                                    {period.count}
                                  </div>
                                </td>
                                <td className="px-2 py-2">
                                  <div className="text-xs text-gray-900">
                                    {formatCurrency(
                                      period.totalAmount / period.count
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}

                          {(!timeAnalysisData.analysis ||
                            timeAnalysisData.analysis.length === 0) && (
                            <tr>
                              <td colSpan="4" className="px-2 py-4 text-center">
                                <div className="text-gray-500">
                                  <FiCalendar className="mx-auto text-lg mb-1" />
                                  <p className="text-xs">
                                    No HEAD user expense data found
                                  </p>
                                </div>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
                    <FiCalendar className="mx-auto text-gray-400 text-2xl mb-2" />
                    <p className="text-gray-600 mb-3 text-xs">
                      Click "Refresh" to load HEAD users time analysis
                    </p>
                    <button
                      onClick={fetchTimeAnalysisData}
                      className="px-3 py-1.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-xs"
                    >
                      Load HEAD Analysis
                    </button>
                  </div>
                )}
              </div>
            )}

                {/* Visual Charts Tab */}
                {selectedView === "charts" && (
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                          <FiPieChart className="text-amber-500" />
                          Visual Analytics
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Interactive charts and data visualization
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <label className="text-sm font-medium text-gray-700">
                            Time Unit:
                          </label>
                          <select
                            value={timeUnit}
                            onChange={(e) => {
                              setTimeUnit(e.target.value);
                              setTimeout(() => fetchTimeAnalysisData(), 100);
                            }}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                          >
                            <option value="month">Monthly</option>
                            <option value="week">Weekly</option>
                            <option value="quarter">Quarterly</option>
                            <option value="year">Yearly</option>
                          </select>
                        </div>
                        <button
                          onClick={fetchTimeAnalysisData}
                          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-400 to-amber-400 text-white font-semibold rounded-lg hover:from-orange-500 hover:to-amber-500 transition-all duration-200"
                        >
                          <FiRefreshCw />
                          Refresh Data
                        </button>
                      </div>
                    </div>

                {timeAnalysisData && timeAnalysisData.analysis?.length > 0 ? (
                  <div className="space-y-3">
                    {/* Chart Data Preparation */}
                    {(() => {
                      const chartData = prepareChartData(
                        timeAnalysisData.analysis || []
                      );
                      const summaryStats = getSummaryStats(chartData);

                      return (
                        <>
                            {/* Summary Statistics Cards */}
                            {summaryStats && (
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                                <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-4">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="text-blue-100 text-sm font-medium">
                                        Total Amount
                                      </p>
                                      <p className="text-2xl font-bold">
                                        {formatCurrency(summaryStats.totalAmount)}
                                      </p>
                                    </div>
                                    <div className="w-10 h-10 bg-blue-400 rounded-full flex items-center justify-center">
                                      <FiDollarSign className="text-white" />
                                    </div>
                                  </div>
                                </div>

                                <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg p-4">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="text-green-100 text-sm font-medium">
                                        Total Entries
                                      </p>
                                      <p className="text-2xl font-bold">
                                        {summaryStats.totalCount}
                                      </p>
                                    </div>
                                    <div className="w-10 h-10 bg-green-400 rounded-full flex items-center justify-center">
                                      <FiBarChart2 className="text-white" />
                                    </div>
                                  </div>
                                </div>

                                <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg p-4">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="text-purple-100 text-sm font-medium">
                                        Average Amount
                                      </p>
                                      <p className="text-2xl font-bold">
                                        {formatCurrency(summaryStats.avgAmount)}
                                      </p>
                                    </div>
                                    <div className="w-10 h-10 bg-purple-400 rounded-full flex items-center justify-center">
                                      <FiTrendingUp className="text-white" />
                                    </div>
                                  </div>
                                </div>

                                <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg p-4">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="text-amber-100 text-sm font-medium">
                                        Analysis Periods
                                      </p>
                                      <p className="text-2xl font-bold">
                                        {summaryStats.periodsCount}
                                      </p>
                                      {summaryStats.trend && (
                                        <p
                                          className={`text-sm ${
                                            summaryStats.trend.direction === "up"
                                              ? "text-green-200"
                                              : "text-red-200"
                                          }`}
                                        >
                                          {summaryStats.trend.direction === "up"
                                            ? "↗"
                                            : "↘"}{" "}
                                          {summaryStats.trend.percent}% trend
                                        </p>
                                      )}
                                    </div>
                                    <div className="w-10 h-10 bg-amber-400 rounded-full flex items-center justify-center">
                                      <FiCalendar className="text-white" />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Line Chart - Amount Trend */}
                            <div className="bg-white border border-gray-200 rounded-lg p-6 ">
                              <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                <FiTrendingUp className="text-amber-500" />
                                Amount Trend Analysis
                              </h4>
                              <div className="h-64">
                              <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData}>
                                  <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="#f0f0f0"
                                  />
                                  <XAxis
                                    dataKey="period"
                                    stroke="#6b7280"
                                    fontSize={10}
                                    angle={-45}
                                    textAnchor="end"
                                    height={50}
                                  />
                                  <YAxis stroke="#6b7280" fontSize={10} />
                                  <Tooltip
                                    formatter={(value, name) => [
                                      name === "totalAmount"
                                        ? formatCurrency(value)
                                        : value,
                                      name === "totalAmount"
                                        ? "Total Amount"
                                        : "Count",
                                    ]}
                                    labelStyle={{ color: "#374151" }}
                                    contentStyle={{
                                      backgroundColor: "#f9fafb",
                                      border: "1px solid #e5e7eb",
                                      borderRadius: "8px",
                                      fontSize: "12px",
                                    }}
                                  />
                                  <Legend wrapperStyle={{ fontSize: "12px" }} />
                                  <Line
                                    type="monotone"
                                    dataKey="totalAmount"
                                    stroke="#f97316"
                                    strokeWidth={2}
                                    dot={{
                                      fill: "#f97316",
                                      strokeWidth: 1,
                                      r: 3,
                                    }}
                                    activeDot={{ r: 5, fill: "#ea580c" }}
                                    name="Total Amount"
                                  />
                                </LineChart>
                              </ResponsiveContainer>
                            </div>
                          </div>

                            {/* Bar Chart - Entries Count */}
                            <div className="bg-white border border-gray-200 rounded-lg p-6 ">
                              <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                <FiBarChart2 className="text-blue-500" />
                                Entries Volume Analysis
                              </h4>
                              <div className="h-64">
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData}>
                                  <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="#f0f0f0"
                                  />
                                  <XAxis
                                    dataKey="period"
                                    stroke="#6b7280"
                                    fontSize={10}
                                    angle={-45}
                                    textAnchor="end"
                                    height={50}
                                  />
                                  <YAxis stroke="#6b7280" fontSize={10} />
                                  <Tooltip
                                    formatter={(value, name) => [
                                      value,
                                      "Entries Count",
                                    ]}
                                    labelStyle={{ color: "#374151" }}
                                    contentStyle={{
                                      backgroundColor: "#f9fafb",
                                      border: "1px solid #e5e7eb",
                                      borderRadius: "8px",
                                      fontSize: "12px",
                                    }}
                                  />
                                  <Legend wrapperStyle={{ fontSize: "12px" }} />
                                  <Bar
                                    dataKey="count"
                                    fill="#3b82f6"
                                    name="Entries Count"
                                    radius={[2, 2, 0, 0]}
                                  />
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          </div>

                            {/* Combined Chart - Amount vs Count */}
                            <div className="bg-white border border-gray-200 rounded-lg p-6 ">
                              <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                <FiActivity className="text-purple-500" />
                                Combined Metrics Analysis
                              </h4>
                              <div className="h-64">
                              <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData}>
                                  <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="#f0f0f0"
                                  />
                                  <XAxis
                                    dataKey="period"
                                    stroke="#6b7280"
                                    fontSize={10}
                                    angle={-45}
                                    textAnchor="end"
                                    height={50}
                                  />
                                  <YAxis
                                    yAxisId="amount"
                                    orientation="left"
                                    stroke="#f97316"
                                    fontSize={10}
                                  />
                                  <YAxis
                                    yAxisId="count"
                                    orientation="right"
                                    stroke="#3b82f6"
                                    fontSize={10}
                                  />
                                  <Tooltip
                                    formatter={(value, name) => [
                                      name === "totalAmount"
                                        ? formatCurrency(value)
                                        : value,
                                      name === "totalAmount"
                                        ? "Total Amount"
                                        : "Entries Count",
                                    ]}
                                    labelStyle={{ color: "#374151" }}
                                    contentStyle={{
                                      backgroundColor: "#f9fafb",
                                      border: "1px solid #e5e7eb",
                                      borderRadius: "8px",
                                      fontSize: "12px",
                                    }}
                                  />
                                  <Legend wrapperStyle={{ fontSize: "12px" }} />
                                  <Line
                                    yAxisId="amount"
                                    type="monotone"
                                    dataKey="totalAmount"
                                    stroke="#f97316"
                                    strokeWidth={2}
                                    dot={{
                                      fill: "#f97316",
                                      strokeWidth: 1,
                                      r: 3,
                                    }}
                                    name="Total Amount"
                                  />
                                  <Line
                                    yAxisId="count"
                                    type="monotone"
                                    dataKey="count"
                                    stroke="#3b82f6"
                                    strokeWidth={2}
                                    dot={{
                                      fill: "#3b82f6",
                                      strokeWidth: 1,
                                      r: 3,
                                    }}
                                    name="Entries Count"
                                  />
                                </LineChart>
                              </ResponsiveContainer>
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                    ) : (
                      <div className="bg-gray-50 rounded-lg border border-gray-200 p-8 text-center">
                        <FiBarChart2 className="mx-auto text-gray-400 text-4xl mb-4" />
                        <h4 className="text-lg font-semibold text-gray-700 mb-2">
                          No Chart Data Available
                        </h4>
                        <p className="text-gray-600 mb-6 text-sm">
                          Load analysis data to view interactive charts and visualizations
                        </p>
                        <button
                          onClick={fetchTimeAnalysisData}
                          className="px-6 py-3 bg-gradient-to-r from-orange-400 to-amber-400 text-white font-semibold rounded-lg hover:from-orange-500 hover:to-amber-500 transition-all duration-200 flex items-center gap-2 mx-auto"
                        >
                          <FiRefreshCw />
                          Load Chart Data
                        </button>
                      </div>
                    )}
              </div>
            )}
          </div>
          </div>
        </div>
      </div>
    </div>

    {/* Bank Entries Popup */}
    {showEntriesPopup && selectedBankForPopup && (
      <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg  max-w-4xl w-full max-h-[90vh] overflow-hidden">
          {/* Popup Header */}
          <div className="bg-gradient-to-r from-purple-500 to-blue-500 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold">{selectedBankForPopup.account.bankName}</h3>
                <p className="text-purple-100 mt-1">
                  {selectedBankForPopup.account.accountHolder} • {selectedBankForPopup.account.accountNumber}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowEntriesPopup(false);
                  setSelectedBankForPopup(null);
                }}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <FiX size={24} />
              </button>
            </div>
          </div>

          {/* Popup Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-purple-50 rounded-lg p-4 text-center">
                <p className="text-sm text-purple-600 font-medium">Linked Expenses</p>
                <p className="text-xl font-bold text-purple-800">
                  {selectedBankForPopup.totalLinkedExpenses || 0}
                </p>
                <p className="text-xs text-purple-600">
                  {formatCurrency(selectedBankForPopup.totalLinkedExpenseAmount || 0)}
                </p>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <p className="text-sm text-blue-600 font-medium">Transactions</p>
                <p className="text-xl font-bold text-blue-800">
                  {selectedBankForPopup.paymentCount || 0}
                </p>
                <p className="text-xs text-blue-600">
                  {formatCurrency(selectedBankForPopup.totalAmount || 0)}
                </p>
              </div>
              <div className="bg-emerald-50 rounded-lg p-4 text-center">
                <p className="text-sm text-emerald-600 font-medium">Total Entries</p>
                <p className="text-xl font-bold text-emerald-800">
                  {(selectedBankForPopup.totalLinkedExpenses || 0) + (selectedBankForPopup.paymentCount || 0)}
                </p>
                <p className="text-xs text-emerald-600">All activity</p>
              </div>
              <div className="bg-amber-50 rounded-lg p-4 text-center">
                <p className="text-sm text-amber-600 font-medium">Avg Expense</p>
                <p className="text-xl font-bold text-amber-800">
                  {formatCurrency(selectedBankForPopup.averageLinkedExpenseAmount || 0)}
                </p>
                <p className="text-xs text-amber-600">Per expense</p>
              </div>
            </div>

            {/* Expense Breakdown */}
            {selectedBankForPopup.linkedExpenseBreakdown && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <FiPieChart className="text-purple-500" />
                  Expense Breakdown
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-purple-600">Ad Expenses</span>
                      <span className="text-lg font-bold text-purple-800">
                        {selectedBankForPopup.linkedExpenseBreakdown.linkedAdExpenses || 0}
                      </span>
                    </div>
                    <p className="text-xl font-bold text-purple-900">
                      {formatCurrency(selectedBankForPopup.linkedExpenseBreakdown.linkedAdExpenseAmount || 0)}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-cyan-600">Regular Expenses</span>
                      <span className="text-lg font-bold text-cyan-800">
                        {selectedBankForPopup.linkedExpenseBreakdown.linkedRegularExpenses || 0}
                      </span>
                    </div>
                    <p className="text-xl font-bold text-cyan-900">
                      {formatCurrency(selectedBankForPopup.linkedExpenseBreakdown.linkedRegularExpenseAmount || 0)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Monthly Analysis */}
            {selectedBankForPopup.monthlyExpenseAnalysis && selectedBankForPopup.monthlyExpenseAnalysis.length > 0 && (
              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <h4 className="text-lg font-semibold text-blue-800 mb-3 flex items-center gap-2">
                  <FiCalendar className="text-blue-600" />
                  Monthly Expense Analysis
                </h4>
                <div className="space-y-3">
                  {selectedBankForPopup.monthlyExpenseAnalysis.slice(0, 6).map((month, index) => (
                    <div key={month.month} className="bg-white rounded-lg p-3 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          {new Date(month.month + '-01').toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long' 
                          })}
                        </p>
                        <p className="text-sm text-gray-600">{month.expenseCount} expenses</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-blue-800">
                          {formatCurrency(month.totalAmount)}
                        </p>
                        <p className="text-xs text-gray-500">
                          Ad: {formatCurrency(month.adExpenseAmount || 0)} | 
                          Regular: {formatCurrency(month.regularExpenseAmount || 0)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Date Ranges */}
            <div className="bg-green-50 rounded-lg p-4 mb-6">
              <h4 className="text-lg font-semibold text-green-800 mb-3 flex items-center gap-2">
                <FiCalendar className="text-green-600" />
                Activity Timeline
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedBankForPopup.expenseDateRange?.earliest && (
                  <div className="bg-white rounded-lg p-3">
                    <p className="text-sm font-medium text-green-600 mb-1">Expense Activity</p>
                    <p className="text-sm text-gray-800">
                      <strong>From:</strong> {formatDate(selectedBankForPopup.expenseDateRange.earliest)}
                    </p>
                    <p className="text-sm text-gray-800">
                      <strong>To:</strong> {formatDate(selectedBankForPopup.expenseDateRange.latest)}
                    </p>
                  </div>
                )}
                {selectedBankForPopup.transactionDateRange?.earliest && (
                  <div className="bg-white rounded-lg p-3">
                    <p className="text-sm font-medium text-blue-600 mb-1">Transaction Activity</p>
                    <p className="text-sm text-gray-800">
                      <strong>From:</strong> {formatDate(selectedBankForPopup.transactionDateRange.earliest)}
                    </p>
                    <p className="text-sm text-gray-800">
                      <strong>To:</strong> {formatDate(selectedBankForPopup.transactionDateRange.latest)}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Performance Metrics */}
            {selectedBankForPopup.performanceMetrics && (
              <div className="bg-amber-50 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-amber-800 mb-3 flex items-center gap-2">
                  <FiActivity className="text-amber-600" />
                  Performance Metrics
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-600 mb-1">Transaction Velocity</p>
                    <p className="text-lg font-bold text-gray-900">
                      {selectedBankForPopup.performanceMetrics.transactionVelocity || 0}
                    </p>
                    <p className="text-xs text-gray-500">per day</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-600 mb-1">Expense Velocity</p>
                    <p className="text-lg font-bold text-gray-900">
                      {selectedBankForPopup.performanceMetrics.linkedExpenseVelocity || 0}
                    </p>
                    <p className="text-xs text-gray-500">per day</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-600 mb-1">Account Utilization</p>
                    <p className="text-lg font-bold text-gray-900">
                      {(selectedBankForPopup.performanceMetrics.accountUtilization || 0).toFixed(1)}%
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-600 mb-1">Expense Ratio</p>
                    <p className="text-lg font-bold text-gray-900">
                      {(selectedBankForPopup.performanceMetrics.linkedExpenseRatio || 0).toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Popup Footer */}
          <div className="bg-gray-50 p-4 border-t">
            <div className="flex justify-end">
              <button
                onClick={() => {
                  setShowEntriesPopup(false);
                  setSelectedBankForPopup(null);
                }}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
    </div>
  );
};

export default AdminAnalysis;
