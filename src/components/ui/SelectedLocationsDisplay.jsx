import { MapPinIcon, XMarkIcon } from "@heroicons/react/24/outline";

const SelectedLocationsDisplay = ({
  formData,
  setFormData,
  isDataLoading,
  centres,
}) => {
  // Loading state
  if (isDataLoading) {
    return (
      <div className="mb-6 p-4 lg:p-6 xl:p-8 bg-gray-50 rounded-lg border w-full">
        <div className="flex items-center justify-between mb-4">
          <div className="h-4 bg-gray-300 rounded w-32 animate-pulse"></div>
          <div className="h-3 bg-gray-300 rounded w-16 animate-pulse"></div>
        </div>
        <div className="space-y-3">
          <div className="h-20 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-16 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  // No selections
  if (formData.regionIds.length === 0 && formData.branchIds.length === 0 && formData.centreIds.length === 0) {
    return null;
  }

  return (
    <div className="mb-6 p-4 lg:p-6 xl:p-8 bg-gray-50 rounded-lg border w-full max-h-64 md:max-h-80 xl:max-h-96 overflow-y-auto">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-700">
          Selected Locations
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">
            {formData.regionIds.length}R, {formData.branchIds.length}A, {formData.centreIds.length}C
          </span>
          <button
            type="button"
            onClick={() => {
              setFormData((prev) => ({
                ...prev,
                regionIds: [],
                branchIds: [],
                centreIds: [],
              }));
            }}
            className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
          >
            ✕ Clear All
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {/* Selected Regions Display */}
        {formData.regionIds.map((regionId) => {
          const region = centres.find((c) => c.regionId?.id === regionId)?.regionId;
          if (!region) return null;

          const branchesInRegion = centres
            .filter((centre) => centre.regionId?.id === regionId)
            .reduce((acc, centre) => {
              if (centre.branchId && !acc.find((b) => b.id === centre.branchId.id)) {
                acc.push(centre.branchId);
              }
              return acc;
            }, []);

          const selectedBranches = branchesInRegion.filter((branch) => formData.branchIds.includes(branch.id));
          const centresInRegion = centres.filter((centre) => centre.regionId?.id === regionId);
          const selectedCentres = centresInRegion.filter((centre) => formData.centreIds.includes(centre.id));

          return (
            <div key={regionId} className="border border-gray-200 rounded p-2 bg-white">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center px-2 py-1 bg-amber-100 text-amber-800 text-xs font-medium rounded">
                    <MapPinIcon className="w-3 h-3 mr-1" />
                    {region.name}
                  </span>
                  <span className="text-xs text-gray-600">
                    {selectedBranches.length}/{branchesInRegion.length}A, {selectedCentres.length}/{centresInRegion.length}C
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setFormData((prev) => ({
                      ...prev,
                      regionIds: prev.regionIds.filter((id) => id !== regionId),
                    }));
                  }}
                  className="text-amber-600 hover:text-amber-800 text-sm"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>

              {/* Areas Display */}
              {selectedBranches.length > 0 && (
                <div className="ml-2 mt-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 max-h-40 overflow-y-auto">
                    {selectedBranches.map((branch) => {
                      const centresInBranch = centresInRegion.filter((centre) => centre.branchId?.id === branch.id);
                      const selectedCentresInBranch = centresInBranch.filter((centre) => formData.centreIds.includes(centre.id));

                      return (
                        <div key={branch.id} className="border border-blue-200 rounded-lg p-2 bg-blue-50">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-1">
                              <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                                🏢 {branch.name}
                              </span>
                              <span className="text-xs text-gray-500 bg-white px-1 rounded">
                                {selectedCentresInBranch.length}/{centresInBranch.length}C
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setFormData((prev) => ({
                                  ...prev,
                                  branchIds: prev.branchIds.filter((id) => id !== branch.id),
                                }));
                              }}
                              className="text-blue-600 hover:text-blue-800 hover:bg-blue-200 rounded px-1"
                            >
                              <XMarkIcon className="w-3 h-3" />
                            </button>
                          </div>

                          {/* Centers Display */}
                          {selectedCentresInBranch.length > 0 && (
                            <div className="space-y-1 max-h-24 overflow-y-auto">
                              {selectedCentresInBranch.map((centre) => (
                                <div key={centre.id} className="flex items-center justify-between bg-white rounded px-2 py-1 border border-gray-200">
                                  <div className="flex items-center gap-1 min-w-0 flex-1">
                                    <span className="text-green-600 text-xs">🏪</span>
                                    <span className="text-xs font-medium text-gray-800 truncate">{centre.name}</span>
                                    <span className="text-xs text-gray-500 bg-gray-100 px-1 rounded">{centre.centreId}</span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setFormData((prev) => ({
                                        ...prev,
                                        centreIds: prev.centreIds.filter((id) => id !== centre.id),
                                      }));
                                    }}
                                    className="text-red-500 hover:text-red-700 hover:bg-red-100 rounded-full w-4 h-4 flex items-center justify-center text-xs ml-1"
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SelectedLocationsDisplay;
