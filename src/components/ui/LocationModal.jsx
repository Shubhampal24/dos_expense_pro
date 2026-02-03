import { FiSearch } from "react-icons/fi";
import { XMarkIcon } from "@heroicons/react/24/outline";

// Helper function to highlight search terms
const highlightText = (text, searchTerm) => {
  if (!searchTerm?.trim() || !text) return text;

  const regex = new RegExp(
    `(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
    "gi",
  );
  const parts = text.toString().split(regex);

  return parts.map((part, index) =>
    regex.test(part) ? (
      <mark key={index} className="bg-yellow-200 text-yellow-900 px-1 rounded">
        {part}
      </mark>
    ) : (
      part
    ),
  );
};

const LocationModal = ({
  showLocationModal,
  setShowLocationModal,
  modalLocationData,
  modalSearchTerm,
  setModalSearchTerm,
  filteredModalLocations,
}) => {
  if (!showLocationModal || !modalLocationData) return null;

  const handleClose = () => {
    setShowLocationModal(false);
    setModalSearchTerm("");
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          handleClose();
        }
      }}
      tabIndex={0}
    >
      <div className="bg-white text-zinc-800 rounded-lg w-full max-w-[75vw] max-h-[90vh] overflow-hidden flex flex-col">
        {/* Compact Header */}
        <div className="flex items-center justify-between p-3 border-b border-zinc-200 bg-gray-50">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-gray-800">
              Location Details
            </h3>
            <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">
              #{modalLocationData.expense.id?.slice(-6)}
            </span>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Compact Content */}
        <div className="flex-1 overflow-y-auto p-3">
          {/* Expense Summary - Compact */}
          <div className="bg-gray-50 rounded-lg p-2 mb-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            <div>
              <span className="text-gray-600 block">Date</span>
              <div className="font-medium">
                {new Date(
                  modalLocationData.expense.expenseDate,
                ).toLocaleDateString("en-IN")}
              </div>
            </div>
            <div>
              <span className="text-gray-600 block">Paid To</span>
              <div className="font-medium capitalize">
                {modalLocationData.expense.paidTo}
              </div>
            </div>
            <div>
              <span className="text-gray-600 block">Amount</span>
              <div className="font-medium">
                ₹
                {modalLocationData.expense.amount.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                })}
              </div>
            </div>
            <div>
              <span className="text-gray-600 block">Status</span>
              <span
                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  modalLocationData.expense.verified
                    ? "bg-green-100 text-green-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {modalLocationData.expense.verified ? "Verified" : "Pending"}
              </span>
            </div>
          </div>

          {/* Compact Search */}
          <div className="flex gap-2 items-center mb-3">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search locations..."
                value={modalSearchTerm}
                onChange={(e) => setModalSearchTerm(e.target.value)}
                className="w-full pl-8 pr-8 py-1.5 bg-white border border-gray-300 rounded text-xs placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
              />
              <FiSearch className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
              {modalSearchTerm && (
                <button
                  onClick={() => setModalSearchTerm("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                >
                  <XMarkIcon className="w-3 h-3" />
                </button>
              )}
            </div>
            <div className="px-2 py-1 bg-white border rounded text-xs font-medium">
              {(filteredModalLocations.regions?.length || 0) +
                (filteredModalLocations.branches?.length || 0) +
                (filteredModalLocations.centres?.length || 0)}{" "}
              locations
            </div>
          </div>

          {/* Compact Location Lists */}
          <div className="space-y-2">
            {/* Regions */}
            {filteredModalLocations.regions?.length > 0 && (
              <div>
                <div className="font-medium text-amber-900 mb-1 text-xs">
                  Regions ({filteredModalLocations.regions.length}
                  {modalSearchTerm &&
                    modalLocationData.regions?.length !==
                      filteredModalLocations.regions.length &&
                    ` of ${modalLocationData.regions.length}`}
                  )
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-10 gap-1">
                  {filteredModalLocations.regions.map((region) => (
                    <div
                      key={region.id}
                      className="bg-amber-50 border border-amber-200 rounded p-2 text-xs"
                    >
                      <div
                        className="font-semibold truncate"
                        title={region.name}
                      >
                        {highlightText(region.name, modalSearchTerm)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Areas */}
            {filteredModalLocations.branches?.length > 0 && (
              <div>
                <div className="font-medium text-blue-900 mb-1 text-xs">
                  Areas ({filteredModalLocations.branches.length}
                  {modalSearchTerm &&
                    modalLocationData.branches?.length !==
                      filteredModalLocations.branches.length &&
                    ` of ${modalLocationData.branches.length}`}
                  )
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-10 gap-1">
                  {filteredModalLocations.branches.map((branch) => (
                    <div
                      key={branch.id}
                      className="bg-blue-50 border border-blue-200 rounded p-2 text-xs"
                    >
                      <div
                        className="font-semibold truncate"
                        title={branch.name}
                      >
                        {highlightText(branch.name, modalSearchTerm)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Centres */}
            {filteredModalLocations.centres?.length > 0 && (
              <div>
                <div className="font-medium text-green-900 mb-1 text-xs">
                  Centres ({filteredModalLocations.centres.length}
                  {modalSearchTerm &&
                    modalLocationData.centres?.length !==
                      filteredModalLocations.centres.length &&
                    ` of ${modalLocationData.centres.length}`}
                  )
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-10 gap-1">
                  {filteredModalLocations.centres.map((centre) => (
                    <div
                      key={centre.id}
                      className="bg-green-50 border border-green-200 rounded p-2 text-xs"
                    >
                      <div
                        className="font-semibold truncate"
                        title={centre.name}
                      >
                        {highlightText(centre.name, modalSearchTerm)}
                      </div>
                      <div className="text-green-700 truncate">
                        Code: {highlightText(centre.shortCode, modalSearchTerm)}
                      </div>
                      <div className="text-green-600 truncate text-[10px]">
                        Centre ID:{" "}
                        {highlightText(centre.centreId, modalSearchTerm)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* No Results */}
          {modalSearchTerm &&
            filteredModalLocations.regions?.length === 0 &&
            filteredModalLocations.branches?.length === 0 &&
            filteredModalLocations.centres?.length === 0 && (
              <div className="text-center py-8 bg-gray-50 rounded">
                <div className="text-gray-400 text-2xl mb-2">🔍</div>
                <div className="text-xs text-gray-800 mb-1">
                  No locations found
                </div>
                <div className="text-xs text-gray-600 mb-2">
                  No locations match "
                  <span className="font-medium">{modalSearchTerm}</span>"
                </div>
                <button
                  onClick={() => setModalSearchTerm("")}
                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-xs"
                >
                  Clear Search
                </button>
              </div>
            )}

          {/* Reason - Compact */}
          {modalLocationData.expense.reason && (
            <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
              <div className="font-medium text-gray-800 mb-1">Reason</div>
              <div className="text-gray-700">
                {modalLocationData.expense.reason}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LocationModal;
