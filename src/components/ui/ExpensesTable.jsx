import { FiSearch, FiEdit2, FiTrash2 } from "react-icons/fi";
import {
  ArrowPathIcon,
  CurrencyRupeeIcon,
  MapPinIcon,
  CalendarDaysIcon,
  XMarkIcon,
  SunIcon,
  MoonIcon,
} from "@heroicons/react/24/outline";
import DateRangePicker from "../DateRangePicker";
import LocationModal from "./LocationModal";
import { adExpenseAPI } from "../../utils/apiServices";


// Helper function to highlight search terms
const highlightText = (text, searchTerm) => {
  if (!searchTerm.trim() || !text) return text;

  const regex = new RegExp(
    `(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
    "gi"
  );
  const parts = text.toString().split(regex);

  return parts.map((part, index) =>
    regex.test(part) ? (
      <mark
        key={index}
        className="bg-yellow-200 text-yellow-900 px-1 rounded"
      >
        {part}
      </mark>
    ) : (
      part
    )
  );
};

const ExpensesTable = ({
  expenses,
  filteredExpenses,
  searchTerm,
  setSearchTerm,
  dateFilter,
  setDateFilter,
  showDateRange,
  setShowDateRange,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  isLoadingExpenses,
  fetchExpenses,
  handleEditExpense,
  handleDeleteExpense,
  showLocationModal,
  setShowLocationModal,
  modalLocationData,
  setModalLocationData,
  modalSearchTerm,
  setModalSearchTerm,
  filteredModalLocations,
}) => {

  // console.log("📦 Expenses from backend:", expenses);

  // 🔒 Show only non-deleted expenses
const activeExpenses = expenses.filter(
  (expense) => expense.isDeleted !== true
);

const activeFilteredExpenses = filteredExpenses.filter(
  (expense) => expense.isDeleted !== true
);

  // Helper function to open location modal
  const openLocationModal = async (expense) => {
  try {
    const response = await adExpenseAPI.getAdExpenseById(expense.id);

    // ✅ VALIDATION: Ensure response matches requested ID
    if (response?.id && response.id !== expense.id) {
      console.error(`❌ CRITICAL: Backend returned wrong expense. Expected: ${expense.id}, Got: ${response.id}`);
      // Still use the original expense data, ignore API response with wrong ID
    }

    // ✅ ALWAYS use the clicked expense data, never use API response data for main fields
    const expenseToSet = {
      id: expense.id,                    // 👈 ALWAYS use clicked expense ID
      expenseDate: expense.expenseDate,
      paidTo: expense.paidTo,
      amount: expense.amount,
      reason: expense.reason,
      verified: expense.verified,
      bankAccount: expense.bankAccount,
      GST: expense.GST,
      TdsAmount: expense.TdsAmount,
      region_ids: expense.region_ids,
      branch_ids: expense.branch_ids,
      centre_ids: expense.centre_ids,
      createdBy: expense.createdBy,
      createdAt: expense.createdAt,
      updatedAt: expense.updatedAt,
      // Only use locations array from API response
      locations: response?.locations || [],
    };

    setModalLocationData({
      expense: expenseToSet,

      regions: (response?.locations || [])
        .filter(l => l.regionId)
        .map(l => ({
          id: l.regionId,
          name: l.regionName,
        })),

      branches: (response?.locations || [])
        .filter(l => l.branchId)
        .map(l => ({
          id: l.branchId,
          name: l.branchName,
        })),

      centres: (response?.locations || [])
        .filter(l => l.centreId)
        .map(l => ({
          id: l.centreId,
          name: l.centreName,
          centreId: l.centreId,
        })),
    });

    setModalSearchTerm("");
    setShowLocationModal(true);
  } catch (err) {
    console.error("❌ Failed to load location details:", err);
  }
};


  // Clear all filters
  const handleClearFilters = () => {
    setDateFilter(new Date().toISOString().split("T")[0]);
    setSearchTerm("");
    setShowDateRange(false);
    setStartDate("");
    setEndDate("");
  };

  return (
    <>
      {/* Expenses Table Section */}
      <div className="py-4 md:py-6 lg:py-8 xl:py-12 w-full max-w-full h-auto xl:border-t-4 border-t border-gray-200">
        {/* Expenses Table */}
        <div className="w-full">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <h2 className="text-lg font-bold text-gray-800">
                Recent Advertising Expenses
              </h2>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 px-3 py-1 bg-green-50 border border-green-200 rounded-lg">
                <CurrencyRupeeIcon className="w-4 h-4 text-green-600" />
                <div className="text-sm">
                  <span className="text-green-600 text-sm font-medium">Total: </span>
                  <span className="text-green-800 text-sm font-bold">
                    ₹{activeFilteredExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0)
  .toLocaleString('en-IN', { minimumFractionDigits: 2 })}

                  </span>
                </div>
              </div>
              <button
                onClick={fetchExpenses}
                disabled={isLoadingExpenses}
                className="flex items-center space-x-2 px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors disabled:opacity-50 text-sm"
              >
                <ArrowPathIcon className={`w-4 h-4 ${isLoadingExpenses ? 'animate-spin' : ''}`} />
                <span>{isLoadingExpenses ? "Refreshing..." : "Refresh"}</span>
              </button>

            </div>
          </div>

          {/* Filter Controls */}
          <div className="mb-4 p-4 bg-gray-50 rounded-lg border">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
              {/* Date Filter */}
              <div className="flex-1 min-w-[200px]">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Filter by Date
                  </label>
                </div>

                <DateRangePicker
                  startDate={showDateRange ? startDate : dateFilter}
                  endDate={showDateRange ? endDate : ''}
                  onStartDateChange={showDateRange ? setStartDate : setDateFilter}
                  onEndDateChange={setEndDate}
                  isRangeMode={showDateRange}
                  onToggleMode={() => setShowDateRange(!showDateRange)}
                  placeholder={showDateRange ? "Select date range" : "Select date"}
                  className="text-black"
                />
              </div>

              {/* Smart Search */}
              <div className="flex-2 min-w-[300px]">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Smart Search
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by amount, paid to, reason, locations, bank accounts, ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-10 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-all duration-200"
                  />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                    <FiSearch />
                  </div>
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm"
                      title="Clear search"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Filter Actions */}
              <div className="flex flex-col gap-2">
                {/* Quick Date Filters */}
                <div className="flex gap-1">
                  <button
                    onClick={() => {
                      setShowDateRange(false);
                      setDateFilter(new Date().toISOString().split("T")[0]);
                    }}
                    className="flex items-center space-x-1 px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs hover:bg-blue-100 transition-colors"
                    title="Today's expenses"
                  >
                    <SunIcon className="w-3 h-3" />
                    <span>Today</span>
                  </button>
                  <button
                    onClick={() => {
                      const yesterday = new Date();
                      yesterday.setDate(yesterday.getDate() - 1);
                      setShowDateRange(false);
                      setDateFilter(yesterday.toISOString().split("T")[0]);
                    }}
                    className="flex items-center space-x-1 px-2 py-1 bg-green-50 text-green-700 rounded text-xs hover:bg-green-100 transition-colors"
                    title="Yesterday's expenses"
                  >
                    <MoonIcon className="w-3 h-3" />
                    <span>Yesterday</span>
                  </button>
                  <button
                    onClick={() => {
                      const today = new Date();
                      const weekAgo = new Date();
                      weekAgo.setDate(today.getDate() - 7);
                      setShowDateRange(true);
                      setStartDate(weekAgo.toISOString().split("T")[0]);
                      setEndDate(today.toISOString().split("T")[0]);
                    }}
                    className="flex items-center space-x-1 px-2 py-1 bg-purple-50 text-purple-700 rounded text-xs hover:bg-purple-100 transition-colors"
                    title="Last 7 days"
                  >
                    <CalendarDaysIcon className="w-3 h-3" />
                    <span>7 Days</span>
                  </button>
                </div>

                {/* Main Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={handleClearFilters}
                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                    title="Clear all filters"
                  >
                    Clear All
                  </button>
                  <div className="px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium">
                    {activeFilteredExpenses.length} of {activeExpenses.length} expenses

                  </div>
                </div>
              </div>
            </div>
          </div>

          {isLoadingExpenses ? (
            <div className="bg-white rounded-lg border p-8 text-center">
              <div className="w-8 h-8 border-2 border-orange-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-500">Loading expenses...</p>
            </div>
          ) : activeExpenses.length === 0 ? (

            <div className="bg-gray-50 rounded-lg border p-8 text-center">
              <p className="text-gray-500">No expenses found</p>
            </div>
          ) : activeFilteredExpenses.length === 0 ? (

            <div className="bg-gray-50 rounded-lg border p-8 text-center">
              <p className="text-gray-500">
                No expenses match your filters
              </p>
              <button
                onClick={handleClearFilters}
                className="mt-2 px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors text-sm"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-lg border overflow-hidden">
              <div className="max-h-[480px] overflow-y-auto overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Paid To
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Bank Account
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Locations
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Reason
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        No Of Day's
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created By
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {activeFilteredExpenses.map((expense, index) => (

                      
                      <tr
                        key={expense.id}
                        className={
                          index % 2 === 0 ? "bg-white" : "bg-gray-50"
                        }
                      >
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {new Date(expense.expenseDate).toLocaleDateString(
                            "en-IN"
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 capitalize">
                          {highlightText(expense.paidTo, searchTerm)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                          {expense.paidTo === "justdial" ? (
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-blue-600 font-medium">
                                  Amount:
                                </span>
                                <span>
                                  {highlightText(
                                    `₹${expense.amount.toLocaleString(
                                      "en-IN",
                                      {
                                        minimumFractionDigits: 2,
                                      }
                                    )}`,
                                    searchTerm
                                  )}
                                </span>
                              </div>
                              {expense.TdsAmount > 0 && (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-orange-600 font-medium">
                                    TDS:
                                  </span>
                                  <span className="text-orange-700">
                                    ₹
                                    {expense.TdsAmount.toLocaleString(
                                      "en-IN",
                                      {
                                        minimumFractionDigits: 2,
                                      }
                                    )}
                                  </span>
                                </div>
                              )}
                              {expense.TdsAmount > 0 && (
                                <div className="flex items-center gap-2 bg-green-50 px-2 py-1 rounded">
                                  <span className="text-xs text-green-600 font-semibold">
                                    Total:
                                  </span>
                                  <span className="font-semibold text-green-700">
                                    ₹
                                    {(
                                      expense.amount - expense.TdsAmount
                                    ).toLocaleString("en-IN", {
                                      minimumFractionDigits: 2,
                                    })}
                                  </span>
                                </div>
                              )}
                              {expense.GST && (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-purple-600 font-medium">
                                    GST:
                                  </span>
                                  <span className="text-purple-700 font-mono text-xs">
                                    {highlightText(expense.GST, searchTerm)}
                                  </span>
                                </div>
                              )}
                            </div>
                          ) : (
                            highlightText(
                              `₹${expense.amount.toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                              })}`,
                              searchTerm
                            )
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {expense.bankAccount ? (
                            <div className="flex flex-col space-y-1">
                              <span className="text-xs font-medium text-blue-700">
                                {expense.bankAccount.accountHolder || "N/A"}
                              </span>
                              <span className="text-xs text-gray-600">
                                {expense.bankAccount.bankName || "N/A"}
                              </span>
                              <span className="text-xs text-gray-500 font-mono">
                                ****
                                {expense.bankAccount.accountNumber?.slice(
                                  -4
                                ) || "****"}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400 italic">
                              No bank account
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          <div className="max-h-24 overflow-y-auto space-y-1">
                            {/* Regions */}
                            {expense.region_ids?.length > 0 && (
  <div>
    <div className="flex items-center justify-between mb-1">
      <div className="text-xs font-medium text-gray-600">
        Regions ({expense.region_ids.length}):
      </div>
      <button
        onClick={() => openLocationModal(expense)}
        className="flex items-center space-x-1 text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded hover:bg-gray-200"
      >
        <MapPinIcon className="w-3 h-3" />
        <span>View All</span>
      </button>
    </div>

    <div className="flex flex-wrap gap-1 mb-2">
      {expense.region_ids.slice(0, 3).map((id) => (
        <span
          key={id}
          className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded"
        >
          {id.slice(0, 6)}…
        </span>
      ))}
    </div>
  </div>
)}

                            {/* Branches */}
                            {expense.branch_ids?.length > 0 && (
  <div>
    <div className="flex items-center justify-between mb-1">
      <div className="text-xs font-medium text-gray-600">
        Areas ({expense.branch_ids.length}):
      </div>
      <button
        onClick={() => openLocationModal(expense)}
        className="flex items-center space-x-1 text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded hover:bg-gray-200"
      >
        <MapPinIcon className="w-3 h-3" />
        <span>View All</span>
      </button>
    </div>

    <div className="flex flex-wrap gap-1 mb-2">
      {expense.branch_ids.slice(0, 3).map((id) => (
        <span
          key={id}
          className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded"
        >
          {id.slice(0, 6)}…
        </span>
      ))}
    </div>
  </div>
)}

                            {/* Centres */}
                            {expense.centre_ids?.length > 0 && (
  <div>
    <div className="flex items-center justify-between mb-1">
      <div className="text-xs font-medium text-gray-600">
        Centres ({expense.centre_ids.length}):
      </div>
      <button
        onClick={() => openLocationModal(expense)}
        className="flex items-center space-x-1 text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded hover:bg-gray-200"
      >
        <MapPinIcon className="w-3 h-3" />
        <span>View All</span>
      </button>
    </div>

    <div className="flex flex-wrap gap-1">
      {expense.centre_ids.slice(0, 3).map((id) => (
        <span
          key={id}
          className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded"
        >
          {id.slice(0, 6)}…
        </span>
      ))}
    </div>
  </div>
)}

                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 max-w-xs">
                          <div className="truncate" title={expense.reason}>
                            {highlightText(expense.reason, searchTerm)}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          <div className="truncate" title={expense.noOfDays}>
                            {highlightText(expense.noOfDays?.toString() || '0', searchTerm)}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${expense.verified
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                              }`}
                          >
                            {expense.createdByName || "—"}

                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {new Date(expense.createdAt).toLocaleDateString(
                            "en-IN"
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              onClick={() => handleEditExpense(expense)}
                              className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-md transition-colors duration-200"
                              title="Edit Expense"
                            >
                              <FiEdit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteExpense(expense)}
                              className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-md transition-colors duration-200"
                              title="Delete Expense"
                            >
                              <FiTrash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      <LocationModal
        showLocationModal={showLocationModal}
        setShowLocationModal={setShowLocationModal}
        modalLocationData={modalLocationData}
        modalSearchTerm={modalSearchTerm}
        setModalSearchTerm={setModalSearchTerm}
        filteredModalLocations={filteredModalLocations}
      />
    </>
  );
};

export default ExpensesTable;
