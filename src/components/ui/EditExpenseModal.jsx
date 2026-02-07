import { useState, useEffect } from "react";
import { FiUser, FiFileText } from "react-icons/fi";
import Select from "react-select";
import LocationSelector from "./LocationSelector";
import SelectedLocationsDisplay from "./SelectedLocationsDisplay";
import { bankAccountAPI, adExpenseAPI } from "../../utils/apiServices";
import CustomDatePicker from "../CustomDatePicker";

const paidToOptions = [
  "social media",
  "website",
  "you tube",
  "sms",
  "justdial",
  "google ads",
  "meta ads",
  "double tick api",
  "influencer",
  "spa jobs",
  "spa advisor",
];

const EditExpenseModal = ({ expenseId, onSave, onClose, centres, currentUser }) => {
  const [formData, setFormData] = useState({
    expenseDate: "",
    paidTo: "",
    reason: "",
    amount: "",
    GST: "",
    tdsAmount: "",
    noOfDays: "",
    verified: false,
    regionIds: [],
    branchIds: [],
    centreIds: [],
    bankAccount: "",
    createdBy: "",
  });

  const [loading, setLoading] = useState(true);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [loadingBanks, setLoadingBanks] = useState(false);
  const [filteredBranches, setFilteredBranches] = useState([]);
  const [filteredCentres, setFilteredCentres] = useState([]);

  useEffect(() => {
    const loadExpense = async () => {
      try {
        const expense = await adExpenseAPI.getAdExpenseById(expenseId);

        // Normalize PaidTo to match dropdown option values
        const paidToNormalized = expense.paidTo
          ? expense.paidTo.toLowerCase()
          : "";

        setFormData({
          expenseDate: expense.expenseDate.split("T")[0],
          paidTo: paidToNormalized,
          reason: expense.reason || "",
          amount: expense.amount.toString(),
          GST: expense.gst || "",
          tdsAmount: expense.tdsAmount?.toString() || "",
          noOfDays: expense.noOfDays?.toString() || "",
          verified: expense.verified,
          regionIds: expense.region_ids.map((r) =>
            typeof r === "object" ? r.id : r
          ),
          branchIds: expense.branch_ids.map((b) =>
            typeof b === "object" ? b.id : b
          ),
          centreIds: expense.centre_ids.map((c) =>
            typeof c === "object" ? c.id : c
          ),
          bankAccount: expense.bankAccountId || "",
          createdBy: expense.createdBy || "",
        });

        setLoading(false);
      } catch (error) {
        console.error("Failed to load expense:", error);
        setLoading(false);
      }
    };

    if (expenseId) loadExpense();
  }, [expenseId]);

  // Fetch bank accounts
  useEffect(() => {
    const fetchBankAccounts = async () => {
      setLoadingBanks(true);
      try {
        const response = await bankAccountAPI.getAllBankAccounts();
        setBankAccounts(response.data || response || []);
      } catch (err) {
        console.error("Error fetching bank accounts:", err);
      } finally {
        setLoadingBanks(false);
      }
    };
    fetchBankAccounts();
  }, []);

  // Filter branches based on selected regions and user access
  useEffect(() => {
    if (formData.regionIds.length > 0 && currentUser) {
      const userBranchIds = currentUser.branchIds || [];
      const branches = centres.filter(
        (centre) =>
          formData.regionIds.includes(centre.regionId?.id) &&
          userBranchIds.includes(centre.branchId?.id)
      );
      setFilteredBranches(branches);
    } else {
      setFilteredBranches([]);
    }
  }, [formData.regionIds, centres, currentUser]);

  // Filter centres based on selected branches and user access
  useEffect(() => {
    if (formData.branchIds.length > 0 && currentUser) {
      const userCentreIds = currentUser.centreIds || [];
      const centresFiltered = centres.filter(
        (centre) =>
          formData.branchIds.includes(centre.branchId?.id) &&
          userCentreIds.includes(centre.id)
      );
      setFilteredCentres(centresFiltered);
    } else {
      setFilteredCentres([]);
    }
  }, [formData.branchIds, centres, currentUser]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const processedData = {
      ...formData,
      amount: parseFloat(formData.amount),
      gst: formData.GST || "",  // Map GST to lowercase gst for backend
      tdsAmount: formData.tdsAmount ? parseFloat(formData.tdsAmount) : 0,
      noOfDays: formData.noOfDays ? parseInt(formData.noOfDays, 10) : 0,
      bankAccountId: formData.bankAccount,
      createdBy: formData.createdBy,
    };
    onSave(processedData);
  };

  if (loading) return <div className="p-6 text-center">Loading expense...</div>;

  return (
    <div className="bg-white p-6 rounded-lg max-w-3xl mx-auto">
      <h2 className="text-lg font-bold mb-4">Edit Expense</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Date, Paid To, Amount */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date *
            </label>
            <div className="mt-1">
              <CustomDatePicker
                value={formData.expenseDate}
                onChange={(value) =>
                  setFormData((prev) => ({ ...prev, expenseDate: value }))
                }
                placeholder="Select expense date"
                disabled={loading}
                className="text-black"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Paid To *</label>
            <div className="relative mt-1">
              <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
              <select
                name="paidTo"
                value={formData.paidTo}
                onChange={handleChange}
                disabled={loading}
                className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-all duration-200 appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">Select source</option>
                {paidToOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt
                      .split(" ")
                      .map((w) => w[0].toUpperCase() + w.slice(1))
                      .join(" ")}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount (₹) *
            </label>
            <div className="relative mt-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">
                ₹
              </span>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                placeholder="0.00"
                step="0.01"
                min="0"
                className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-all duration-200"
              />
            </div>
          </div>
        </div>

        {/* Bank Account Field */}
        <div className="w-full">
          <label className="text-sm font-medium text-gray-700">
            Bank Account
          </label>
          <div className="relative mt-1">
            <Select
              isLoading={loadingBanks}
              isDisabled={loadingBanks}
              options={bankAccounts.map((account) => ({
                value: account.id,
                label: `${account.accountHolder} - ${account.bankName} (****${account.accountNumber.slice(-4)})`,
                account: account,
              }))}
              value={
                bankAccounts
                  .map((account) => ({
                    value: account.id,
                    label: `${account.accountHolder} - ${account.bankName} (****${account.accountNumber.slice(-4)})`,
                    account: account,
                  }))
                  .find(
                    (option) => option.value === formData.bankAccount
                  ) || null
              }
              onChange={(selected) => {
                setFormData((prev) => ({
                  ...prev,
                  bankAccount: selected ? selected.value : "",
                }));
              }}
              placeholder="Select a bank account"
              classNamePrefix="react-select"
              isClearable={true}
              isSearchable={true}
              formatOptionLabel={(option) => (
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-800">
                      {option.account.accountHolder}
                    </span>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                      {option.account.bankName}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    Account: ****{option.account.accountNumber.slice(-4)} | IFSC:{" "}
                    {option.account.ifscCode}
                  </div>
                </div>
              )}
              styles={{
                control: (base, state) => ({
                  ...base,
                  minHeight: 42,
                  fontSize: 14,
                  borderColor: state.isFocused ? "#f59e0b" : "#d1d5db",
                  boxShadow: state.isFocused ? "0 0 0 1px #f59e0b" : "none",
                  "&:hover": {
                    borderColor: "#f59e0b",
                  },
                }),
                menu: (base) => ({
                  ...base,
                  zIndex: 9999,
                }),
              }}
            />
          </div>
        </div>

        {/* Justdial Specific Fields */}
        {formData.paidTo === "justdial" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">GST Number</label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">
                  #
                </span>
                <select
                  name="GST"
                  value={formData.GST}
                  onChange={handleChange}
                  disabled={loading}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed appearance-none uppercase"
                >
                  <option value="">Select GST Number</option>
                  <option value="27BVDPM3913M1ZB">27BVDPM3913M1ZB</option>
                  <option value="27AGJPJ1251B1ZW">27AGJPJ1251B1ZW</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                TDS Amount (₹)
              </label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">
                  ₹
                </span>
                <input
                  type="number"
                  name="tdsAmount"
                  value={formData.tdsAmount}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">No of Days</label>
              <select
                name="noOfDays"
                value={formData.noOfDays || ""}
                onChange={handleChange}
                disabled={loading}
                className="w-full pl-3 pr-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-all duration-200 mt-1"
              >
                <option value="" disabled>Select number of days</option>
                <option value="90">90</option>
                <option value="180">180</option>
                <option value="360">360</option>
              </select>
            </div>
          </div>
        )}

        {/* Calculation Summary */}
        {formData.paidTo === "justdial" && formData.amount && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 w-full">
            <h4 className="text-sm font-semibold text-blue-800 mb-2">Calculation Summary</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-blue-600 block">Base Amount:</span>
                <div className="font-medium text-blue-800">
                  ₹{parseFloat(formData.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <div>
                <span className="text-blue-600 block">GST Number:</span>
                <div className="font-medium text-blue-800">{formData.GST ? formData.GST.toUpperCase() : "Not provided"}</div>
              </div>
              <div>
                <span className="text-blue-600 block">TDS:</span>
                <div className="font-medium text-blue-800">
                  ₹{parseFloat(formData.tdsAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <div className="bg-blue-100 p-2 rounded">
                <span className="text-blue-600 block font-semibold">Total (Amount - TDS):</span>
                <div className="font-bold text-lg text-blue-900">
                  ₹{(parseFloat(formData.amount || 0) - parseFloat(formData.tdsAmount || 0)).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Location Section */}
        {formData.paidTo !== "double tick api" && formData.paidTo !== "spa jobs" && formData.paidTo !== "spa advisor" && (
          <>
            <LocationSelector
              formData={formData}
              setFormData={setFormData}
              isDataLoading={false}
              centres={centres}
              filteredBranches={filteredBranches}
              filteredCentres={filteredCentres}
              currentUser={currentUser}
              accessDeniedEntries={[]}
              setShowAccessDeniedModal={() => { }}
              disableLocalStorage={true}
            />
            <SelectedLocationsDisplay
              formData={formData}
              setFormData={setFormData}
              isDataLoading={false}
              centres={centres}
            />
          </>
        )}

        {/* Reason */}
        <div>
          <label className="text-sm font-medium text-gray-700">
            Reason *
          </label>
          <div className="relative mt-1">
            <FiFileText className="absolute left-3 top-3 text-gray-400 text-sm" />
            <textarea
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              disabled={loading}
              placeholder="Describe the advertising expense purpose..."
              rows="3"
              className="w-full pl-9 pr-3 py-3 bg-white border border-gray-300 rounded-lg text-gray-700 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-all duration-200 resize-none disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700"
          >
            Update Expense
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditExpenseModal;