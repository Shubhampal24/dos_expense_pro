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

  const dedupeLocations = (items, getKey) => {
    const unique = new Map();
    items.forEach((item) => {
      const key = getKey(item);
      if (!key) return;
      if (!unique.has(key)) {
        unique.set(key, item);
      }
    });
    return Array.from(unique.values());
  };

  const baseRegions =
    modalLocationData.expense?.region_names?.length > 0
      ? modalLocationData.expense.region_names.map((name) => ({
          id: name,
          name,
        }))
      : filteredModalLocations.regions || [];

  const baseBranches =
    modalLocationData.expense?.branch_names?.length > 0
      ? modalLocationData.expense.branch_names.map((name) => ({
          id: name,
          name,
        }))
      : filteredModalLocations.branches || [];

  const baseCentres =
    modalLocationData.expense?.centre_names?.length > 0
      ? modalLocationData.expense.centre_names.map((name, index) => ({
          id: modalLocationData.expense.centre_ids?.[index] || name,
          name,
          centreId: modalLocationData.expense.centre_ids?.[index] || "",
        }))
      : filteredModalLocations.centres || [];

  const searchLower = modalSearchTerm.toLowerCase().trim();

  const filteredRegionsLocal = searchLower
    ? baseRegions.filter(
        (region) =>
          region.name?.toLowerCase().includes(searchLower) ||
          region.id?.toLowerCase().includes(searchLower)
      )
    : baseRegions;

  const filteredBranchesLocal = searchLower
    ? baseBranches.filter(
        (branch) =>
          branch.name?.toLowerCase().includes(searchLower) ||
          branch.id?.toLowerCase().includes(searchLower)
      )
    : baseBranches;

  const filteredCentresLocal = searchLower
    ? baseCentres.filter(
        (centre) =>
          centre.name?.toLowerCase().includes(searchLower) ||
          centre.centreId?.toLowerCase().includes(searchLower) ||
          centre.id?.toLowerCase().includes(searchLower)
      )
    : baseCentres;

  const uniqueRegions = dedupeLocations(
    filteredRegionsLocal,
    (region) => (region.id || region.name || "").toString().toLowerCase()
  );

  const uniqueBranches = dedupeLocations(
    filteredBranchesLocal,
    (branch) => (branch.id || branch.name || "").toString().toLowerCase()
  );

  const uniqueCentres = dedupeLocations(
    filteredCentresLocal,
    (centre) =>
      (
        centre.centreId ||
        centre.id ||
        centre.name ||
        ""
      ).toString().toLowerCase()
  );

  const totalLocations =
    uniqueRegions.length + uniqueBranches.length + uniqueCentres.length;

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
              {totalLocations} locations
            </div>
          </div>

          {/* Compact Location Lists */}
          <div className="space-y-2 max-h-[45vh] overflow-y-auto pr-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {/* Regions */}
            {uniqueRegions.length > 0 && (
              <div>
                <div className="font-medium text-amber-900 mb-1 text-xs">
                  Regions ({uniqueRegions.length}
                  {modalSearchTerm &&
                    modalLocationData.regions?.length !==
                      uniqueRegions.length &&
                    ` of ${modalLocationData.regions.length}`}
                  )
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-8 gap-2">
                  {uniqueRegions.map((region) => (
                    <div
                      key={region.id}
                      className="bg-amber-50 border border-amber-200 rounded p-2 text-xs min-w-[96px]"
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
            {uniqueBranches.length > 0 && (
              <div>
                <div className="font-medium text-blue-900 mb-1 text-xs">
                  Areas ({uniqueBranches.length}
                  {modalSearchTerm &&
                    modalLocationData.branches?.length !==
                      uniqueBranches.length &&
                    ` of ${modalLocationData.branches.length}`}
                  )
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-8 gap-2">
                  {uniqueBranches.map((branch) => (
                    <div
                      key={branch.id}
                      className="bg-blue-50 border border-blue-200 rounded p-2 text-xs min-w-[96px]"
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
            {uniqueCentres.length > 0 && (
              <div>
                <div className="font-medium text-green-900 mb-1 text-xs">
                  Centres ({uniqueCentres.length}
                  {modalSearchTerm &&
                    modalLocationData.centres?.length !==
                      uniqueCentres.length &&
                    ` of ${modalLocationData.centres.length}`}
                  )
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {uniqueCentres.map((centre) => (
                    <div
                      key={centre.id}
                      className="bg-green-50 border border-green-200 rounded p-1.5 text-xs min-w-0"
                    >
                      <div
                        className="font-semibold truncate"
                        title={centre.name}
                      >
                        {highlightText(centre.name, modalSearchTerm)}
                      </div>
                      {centre.shortCode && (
                        <div className="text-green-700 truncate">
                          Code: {highlightText(centre.shortCode, modalSearchTerm)}
                        </div>
                      )}
                      {(centre.regionName || centre.branchName) && (
                        <div className="text-green-700 truncate text-[10px]">
                          {centre.regionName && (
                            <span>
                              Region:{" "}
                              {highlightText(centre.regionName, modalSearchTerm)}
                            </span>
                          )}
                          {centre.regionName && centre.branchName && " | "}
                          {centre.branchName && (
                            <span>
                              Area:{" "}
                              {highlightText(centre.branchName, modalSearchTerm)}
                            </span>
                          )}
                        </div>
                      )}
                      <div className="text-green-600 break-words text-[10px]">
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
            uniqueRegions.length === 0 &&
            uniqueBranches.length === 0 &&
            uniqueCentres.length === 0 && (
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
