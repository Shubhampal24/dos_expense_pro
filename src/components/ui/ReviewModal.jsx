import { FiSave } from "react-icons/fi";
import { XMarkIcon } from "@heroicons/react/24/outline";

const ReviewModal = ({
  showReviewModal,
  setShowReviewModal,
  formData,
  bankAccounts,
  centres,
  isLoading,
  handleConfirmSubmit,
  isEditMode = false,
}) => {
  if (!showReviewModal) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          setShowReviewModal(false);
        }
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          setShowReviewModal(false);
        }
      }}
      tabIndex={0}
    >
      <div className="bg-white text-zinc-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-200 bg-amber-50">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-amber-800">
              Review Expense Entry
            </h3>
            <span className="text-xs bg-amber-200 text-amber-700 px-2 py-1 rounded">
              Please confirm details
            </span>
          </div>
          <button
            onClick={() => setShowReviewModal(false)}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Basic Details */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <h4 className="text-sm font-semibold text-gray-800 mb-3">
              Basic Details
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600 block">Date:</span>
                <div className="font-medium">
                  {new Date(formData.expenseDate).toLocaleDateString("en-IN")}
                </div>
              </div>
              <div>
                <span className="text-gray-600 block">Paid To:</span>
                <div className="font-medium capitalize">
                  {formData.paidTo}
                </div>
              </div>
              <div className="col-span-2">
                <span className="text-gray-600 block">Amount:</span>
                <div className="font-bold text-lg text-green-700">
                  ₹
                  {parseFloat(formData.amount || 0).toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
              </div>
              {formData.bankAccount &&
                bankAccounts.find((acc) => acc.id === formData.bankAccount) && (
                  <div className="col-span-2">
                    <span className="text-gray-600 block">Bank Account:</span>
                    {(() => {
                      const selectedAccount = bankAccounts.find(
                        (acc) => acc.id === formData.bankAccount
                      );
                      return (
                        <div className="font-medium text-blue-700 bg-blue-50 p-2 rounded border">
                          <div className="font-semibold">
                            {selectedAccount.accountHolder}
                          </div>
                          <div className="text-xs text-blue-600 mt-1">
                            {selectedAccount.bankName} | ****
                            {selectedAccount.accountNumber.slice(-4)} |
                            Balance: ₹
                            {selectedAccount.balance.toLocaleString("en-IN", {
                              minimumFractionDigits: 2,
                            })}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              {formData.paidTo === "justdial" &&
                (formData.GST || formData.TdsAmount) && (
                  <>
                    <div>
                      <span className="text-gray-600 block">GST Number:</span>
                      <div className="font-medium text-blue-700">
                        {formData.GST
                          ? formData.GST.toUpperCase()
                          : "Not provided"}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600 block">TDS Amount:</span>
                      <div className="font-medium text-blue-700">
                        ₹
                        {parseFloat(formData.TdsAmount || 0).toLocaleString(
                          "en-IN",
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }
                        )}
                      </div>
                    </div>
                    <div className="col-span-2 bg-blue-100 p-2 rounded">
                      <span className="text-blue-600 block font-semibold">
                        Total (Amount - TDS):
                      </span>
                      <div className="font-bold text-lg text-blue-900">
                        ₹
                        {(
                          parseFloat(formData.amount || 0) -
                          parseFloat(formData.TdsAmount || 0)
                        ).toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </div>
                    </div>
                  </>
                )}
              {formData.reason && (
                <div className="col-span-2">
                  <span className="text-gray-600 block">Reason:</span>
                  <div className="font-medium bg-white p-2 rounded border">
                    {formData.reason}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Location Details */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-800 mb-3">
              Selected Locations
            </h4>

            {/* Regions */}
            {formData.regionIds.length > 0 && (
              <div className="mb-3">
                <div className="text-xs font-medium text-amber-700 mb-2">
                  Regions ({formData.regionIds.length}):
                </div>
                <div className="flex flex-wrap gap-1">
                  {formData.regionIds.map((regionId) => {
                    const region = centres
                      .map((c) => c.regionId)
                      .find((r) => r && r.id === regionId);
                    return region ? (
                      <span
                        key={region.id}
                        className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded"
                      >
                        {region.name}
                      </span>
                    ) : (
                      <span
                        key={regionId}
                        className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
                      >
                        Region ID: {regionId}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Areas */}
            {formData.branchIds.length > 0 && (
              <div className="mb-3">
                <div className="text-xs font-medium text-blue-700 mb-2">
                  Areas ({formData.branchIds.length}):
                </div>
                <div className="flex flex-wrap gap-1">
                  {formData.branchIds.map((branchId) => {
                    const branch = centres
                      .map((c) => c.branchId)
                      .find((b) => b && b.id === branchId);
                    return branch ? (
                      <span
                        key={branch.id}
                        className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded"
                      >
                        {branch.name}
                      </span>
                    ) : (
                      <span
                        key={branchId}
                        className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
                      >
                        Area ID: {branchId}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Centres */}
            {formData.centreIds.length > 0 && (
              <div>
                <div className="text-xs font-medium text-green-700 mb-2">
                  Centres ({formData.centreIds.length}):
                </div>
                <div className="flex flex-wrap gap-1">
                  {formData.centreIds.map((centreId) => {
                    const centre = centres.find((c) => c.id === centreId);
                    return centre ? (
                      <span
                        key={centre.id}
                        className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded"
                        title={`Centre: ${centre.name} | Short Code: ${centre.shortCode}`}
                      >
                        {centre.name} - {centre.centreId || centre.shortCode}
                      </span>
                    ) : (
                      <span
                        key={centreId}
                        className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
                      >
                        Centre ID: {centreId}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg p-4 mt-4 border border-orange-200">
            <h4 className="text-sm font-semibold text-orange-800 mb-2">
              Summary
            </h4>
            <div className="text-sm text-orange-700">
              <div className="flex justify-between items-center">
                <span>Total Locations:</span>
                <span className="font-medium">
                  {formData.regionIds.length +
                    formData.branchIds.length +
                    formData.centreIds.length}
                  ({formData.regionIds.length}R + {formData.branchIds.length}A +{" "}
                  {formData.centreIds.length}C)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-zinc-200 p-4 bg-gray-50">
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setShowReviewModal(false)}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Edit Details
            </button>
            <button
  onClick={() => {
    console.log("REVIEW MODAL formData 👉", formData);
    handleConfirmSubmit();
  }}
  disabled={isLoading}
  className={`px-6 py-2 ${
    isEditMode
      ? "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 focus:ring-blue-400"
      : "bg-gradient-to-r from-orange-400 to-amber-400 hover:from-orange-500 hover:to-amber-500 focus:ring-amber-400"
  } text-white font-semibold rounded-lg focus:outline-none focus:ring-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2`}
>

              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>{isEditMode ? "Updating..." : "Adding..."}</span>
                </>
              ) : (
                <>
                  <FiSave className="text-sm" />
                  <span>
                    {isEditMode ? "Confirm & Update Expense" : "Confirm & Add Expense"}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewModal;
