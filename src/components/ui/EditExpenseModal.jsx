import { useState, useEffect } from "react";
import { FiUser } from "react-icons/fi"; // Added import
import LocationSelector from "./LocationSelector";
import { adExpenseAPI } from "../../utils/apiServices";

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
    TdsAmount: "",
    noOfDays: "",
    verified: false,
    regionIds: [],
    branchIds: [],
    centreIds: [],
    bankAccount: "",
  });

  const [loading, setLoading] = useState(true);
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
          TdsAmount: expense.tdsAmount?.toString() || "",
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
        });

        setLoading(false);
      } catch (error) {
        console.error("Failed to load expense:", error);
        setLoading(false);
      }
    };

    if (expenseId) loadExpense();
  }, [expenseId]);

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

      const validBranchIds = [...new Set(branches.map((c) => c.branchId?.id))];
      const filteredBranchIds = formData.branchIds.filter((branchId) =>
        validBranchIds.includes(branchId)
      );

      if (filteredBranchIds.length !== formData.branchIds.length) {
        setFormData((prev) => ({ ...prev, branchIds: filteredBranchIds }));
      }
    } else {
      setFilteredBranches([]);
      setFormData((prev) => ({ ...prev, branchIds: [], centreIds: [] }));
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

      const validCentreIds = centresFiltered.map((c) => c.id);
      const filteredCentreIds = formData.centreIds.filter((centreId) =>
        validCentreIds.includes(centreId)
      );

      if (filteredCentreIds.length !== formData.centreIds.length) {
        setFormData((prev) => ({ ...prev, centreIds: filteredCentreIds }));
      }
    } else {
      setFilteredCentres([]);
      setFormData((prev) => ({ ...prev, centreIds: [] }));
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
    onSave(formData);
  };

  if (loading) return <div className="p-6 text-center">Loading expense...</div>;

  return (
    <div className="bg-white p-6 rounded-lg max-w-3xl mx-auto">
      <h2 className="text-lg font-bold mb-4">Edit Expense</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              type="date"
              name="expenseDate"
              value={formData.expenseDate}
              onChange={handleChange}
              className="w-full p-2 border rounded text-black"
            />
          </div>

          {/* Paid To Dropdown */}
          <div>
            <label className="text-sm font-medium text-gray-700">Paid To *</label>
            <div className="relative mt-1">
              <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
              <select
                name="paidTo"
                value={formData.paidTo}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, paidTo: e.target.value }))
                }
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
              Amount
            </label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              className="w-full p-2 border rounded text-black"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason
            </label>
            <input
              type="text"
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              className="w-full p-2 border rounded text-black"
            />
          </div>
        </div>

        <LocationSelector
          formData={formData}
          setFormData={setFormData}
          isDataLoading={false}
          centres={centres}
          filteredBranches={filteredBranches}
          filteredCentres={filteredCentres}
          currentUser={currentUser}
          accessDeniedEntries={[]}
          setShowAccessDeniedModal={() => {}}
          disableLocalStorage={true}
        />

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