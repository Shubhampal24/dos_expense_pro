import { FiAlertTriangle } from "react-icons/fi";
import { MapPinIcon, XMarkIcon, CheckIcon } from "@heroicons/react/24/outline";
import Select from "react-select";
import { useEffect, useRef } from "react";

const LocationSelector = ({
  formData,
  setFormData,
  isDataLoading,
  centres,
  filteredBranches,
  filteredCentres,
  currentUser,
  accessDeniedEntries,
  setShowAccessDeniedModal,
}) => {

  const restoredRef = useRef(false);

  useEffect(() => {
  if (restoredRef.current) return;
  if (!centres || centres.length === 0) return;

  const saved = localStorage.getItem("locationSelection");
  if (!saved) return;

  try {
    const parsed = JSON.parse(saved);

    setFormData((prev) => ({
      ...prev,
      regionIds: parsed.regionIds || [],
      branchIds: parsed.branchIds || [],
      centreIds: parsed.centreIds || [],
    }));

    restoredRef.current = true;
  } catch (e) {
    console.error("Invalid locationSelection in localStorage");
  }
}, [centres]);


// console.log("LocationSelector centres 👉", centres);
// useEffect(() => {
//   const saved = localStorage.getItem("locationSelection");
//   if (saved) {
//     try {
//       const parsed = JSON.parse(saved);
//       setFormData((prev) => ({
//         ...prev,
//         regionIds: parsed.regionIds || [],
//         branchIds: parsed.branchIds || [],
//         centreIds: parsed.centreIds || [],
//       }));
//     } catch (e) {
//       console.error("Invalid locationSelection in localStorage");
//     }
//   }
// }, []);

useEffect(() => {
  localStorage.setItem(
    "locationSelection",
    JSON.stringify({
      regionIds: formData.regionIds,
      branchIds: formData.branchIds,
      centreIds: formData.centreIds,
    })
  );
}, [formData.regionIds, formData.branchIds, formData.centreIds]);


  return (
    <div>
      {/* Access Denied Warning */}
      {accessDeniedEntries.length > 0 && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <FiAlertTriangle className="w-4 h-4 text-red-500" />
            <span className="text-sm font-medium text-red-700">
              Import Warning: {accessDeniedEntries.length} locations skipped due to access restrictions
            </span>
          </div>
          <p className="text-xs text-red-600 mt-1">
            Some imported locations were not selected because you don't have access to them.
            <button
              type="button"
              onClick={() => setShowAccessDeniedModal(true)}
              className="underline hover:text-red-800 ml-1"
            >
              View details
            </button>
          </p>
        </div>
      )}

      {/* Quick Center Selection */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-blue-800">
            🎯 Quick Center Selection
          </label>
          <span className="text-xs text-blue-600">
            Select multiple centers to auto-populate regions & areas
          </span>
        </div>
        <Select
          isMulti={true}
          placeholder="🔍 Search and select centers..."
          isSearchable={true}
          isClearable={true}
          closeMenuOnSelect={false}
          value={
            formData.centreIds
              ?.map((centreId) => {
                const centre = centres.find(c => c.id === centreId);
                if (!centre) return null;
                return {
                  value: centre.id,
                  label: `${centre.name} (${centre.centreId}) - ${centre.branchId?.name} - ${centre.regionId?.name}`,
                  centreData: centre
                };
              })
              .filter(Boolean) || []
          }
          onChange={(selectedOptions) => {
            if (selectedOptions && selectedOptions.length > 0) {
              const uniqueRegionIds = new Set();
              const uniqueBranchIds = new Set();
              const uniqueCentreIds = new Set();

              selectedOptions.forEach(option => {
                if (option?.centreData) {
                  const centre = option.centreData;
                  if (centre.regionId?.id) uniqueRegionIds.add(centre.regionId.id);
                  if (centre.branchId?.id) uniqueBranchIds.add(centre.branchId.id);
                  if (centre.id) uniqueCentreIds.add(centre.id);
                }
              });

              setFormData((prev) => ({
                ...prev,
                regionIds: Array.from(uniqueRegionIds),
                branchIds: Array.from(uniqueBranchIds),
                centreIds: Array.from(uniqueCentreIds),
              }));
            } else {
              setFormData((prev) => ({
                ...prev,
                regionIds: [],
                branchIds: [],
                centreIds: [],
              }));
            }
          }}
          options={
            currentUser?.centreIds
              ?.map((centreId) => {
                const centre = centres.find(c => c.id === centreId);
                if (!centre) return null;
                return {
                  value: centre.id,
                  label: `${centre.name} (${centre.centreId}) - ${centre.branchId?.name} - ${centre.regionId?.name}`,
                  centreData: centre
                };
              })
              .filter(Boolean) || []
          }
          styles={{
            control: (base) => ({
              ...base,
              minHeight: '38px',
              borderColor: '#93c5fd',
              '&:hover': { borderColor: '#3b82f6' }
            }),
            option: (base, state) => ({
              ...base,
              backgroundColor: state.isFocused ? '#dbeafe' : state.isSelected ? '#3b82f6' : 'white',
              color: state.isSelected ? 'white' : '#1e40af',
              fontSize: '13px'
            }),
            multiValue: (base) => ({
              ...base,
              backgroundColor: '#dbeafe',
              borderRadius: '4px'
            }),
            multiValueLabel: (base) => ({
              ...base,
              color: '#1e40af',
              fontSize: '12px'
            }),
            multiValueRemove: (base) => ({
              ...base,
              color: '#3b82f6',
              ':hover': {
                backgroundColor: '#3b82f6',
                color: 'white',
              },
            })
          }}
          noOptionsMessage={() => "No centers available"}
        />
        {(formData.regionIds.length > 0 || formData.branchIds.length > 0 || formData.centreIds.length > 0) && (
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-blue-700">
              ✓ Auto-selected:
              {formData.regionIds.length > 0 && ` ${formData.regionIds.length} region(s)`}
              {formData.branchIds.length > 0 && ` ${formData.branchIds.length} area(s)`}
              {formData.centreIds.length > 0 && ` ${formData.centreIds.length} centre(s)`}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const allCentreIds = currentUser?.centreIds || [];
                  const allCentres = allCentreIds
                    .map(id => centres.find(c => c.id === id))
                    .filter(Boolean);

                  const uniqueRegionIds = new Set();
                  const uniqueBranchIds = new Set();

                  allCentres.forEach(centre => {
                    if (centre.regionId?.id) uniqueRegionIds.add(centre.regionId.id);
                    if (centre.branchId?.id) uniqueBranchIds.add(centre.branchId.id);
                  });

                  setFormData((prev) => ({
                    ...prev,
                    regionIds: Array.from(uniqueRegionIds),
                    branchIds: Array.from(uniqueBranchIds),
                    centreIds: allCentreIds,
                  }));
                }}
                className="flex items-center space-x-1 text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                title="Select all centers you have access to"
              >
                <CheckIcon className="w-3 h-3" />
                <span>Select All</span>
              </button>
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
                className="flex items-center space-x-1 text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
              >
                <XMarkIcon className="w-3 h-3" />
                <span>Clear All</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Region/Area/Centre Dropdowns */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-4 lg:gap-6 xl:gap-8 w-full">
        {/* Region Dropdown */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm font-medium text-gray-700">
              Region(s) *
            </label>
            {formData.regionIds.length > 0 && (
              <span className="text-xs text-gray-500">
                ({formData.regionIds.length} selected)
              </span>
            )}
          </div>
          <Select
            isMulti={false}
            isLoading={isDataLoading}
            isDisabled={isDataLoading}
            options={(() => {
              const userRegionIds = currentUser?.regionIds || [];
              const accessibleCentres = centres.filter(
                (c) => c.regionId && userRegionIds.includes(c.regionId.id)
              );
              const allRegions = Array.from(
                new Set(accessibleCentres.map((c) => c.regionId?.id))
              )
                .map((regionId) => {
                  const region = accessibleCentres.find(
                    (c) => c.regionId?.id === regionId
                  )?.regionId;
                  return region
                    ? {
                      value: regionId,
                      label: region.name,
                      regionData: region,
                      isSelected: false,
                    }
                    : null;
                })
                .filter(Boolean);

              const selectedRegions = formData.regionIds
                .map((regionId) => {
                  const region = accessibleCentres.find(
                    (c) => c.regionId?.id === regionId
                  )?.regionId;
                  return region
                    ? {
                      value: regionId,
                      label: region.name,
                      regionData: region,
                      isSelected: true,
                    }
                    : null;
                })
                .filter(Boolean);

              const availableRegions = allRegions.filter(
                (option) => !formData.regionIds.includes(option.value)
              );
              return [...selectedRegions, ...availableRegions];
            })()}
            
            onChange={(selected) => {
              if (selected) {
                if (selected.isSelected) {
                  setFormData((prev) => ({
                    ...prev,
                    regionIds: prev.regionIds.filter((id) => id !== selected.value),
                  }));
                } else {
                  setFormData((prev) => ({
                    ...prev,
                    regionIds: [...prev.regionIds, selected.value],
                  }));
                }
              }
            }}
            placeholder="Search regions..."
            classNamePrefix="react-select"
            isClearable={false}
            isSearchable={true}
            closeMenuOnSelect={false}
            formatOptionLabel={(option) => (
              <div className="flex items-center gap-2">
                {option.isSelected && <span className="text-green-600 text-sm">✓</span>}
                <span className={option.isSelected ? "text-green-700 font-medium" : ""}>
                  {option.label}
                </span>
                {option.isSelected && (
                  <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                    Selected
                  </span>
                )}
              </div>
            )}
            styles={{
              control: (base, state) => ({
                ...base,
                minHeight: 36,
                fontSize: 13,
                borderColor: state.isFocused ? "#f59e0b" : "#d1d5db",
                boxShadow: state.isFocused ? "0 0 0 1px #f59e0b" : "none",
                "&:hover": { borderColor: "#f59e0b" },
              }),
              menu: (base) => ({ ...base, fontSize: 13, maxHeight: 250, zIndex: 9999 }),
              menuList: (base) => ({ ...base, maxHeight: 200, overflowY: "auto" }),
              input: (base) => ({ ...base, color: "#374151" }),
              option: (base, state) => ({
                ...base,
                color: "#374151",
                backgroundColor: state.isFocused ? "#fef3c7" : "#fff",
                cursor: "pointer",
                fontSize: 12,
                padding: "6px 10px",
              }),
              placeholder: (base) => ({ ...base, color: "#9ca3af", fontSize: 13 }),
            }}
            noOptionsMessage={() => isDataLoading ? "Loading regions..." : "No more regions available"}
            loadingMessage={() => "Loading regions..."}
          />
        </div>

        {/* Area Dropdown */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm font-medium text-gray-700">
              Area(s) *
            </label>
            {formData.branchIds.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setFormData((prev) => ({
                      ...prev,
                      branchIds: [],
                      centreIds: [],
                    }));
                  }}
                  className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                >
                  ✕ Clear All
                </button>
                <span className="text-xs text-gray-500">
                  ({formData.branchIds.length} selected)
                </span>
              </div>
            )}
          </div>
          <Select
            isMulti={false}
            isLoading={isDataLoading}
            isDisabled={formData.regionIds.length === 0 || isDataLoading}
            options={(() => {
              if (formData.regionIds.length === 0) return [];
              const userBranchIds = currentUser?.branchIds || [];
              const allowedBranches = filteredBranches.filter(
                (c) =>
                  c.regionId &&
                  c.branchId &&
                  formData.regionIds.includes(c.regionId.id) &&
                  userBranchIds.includes(c.branchId.id)
              );
              const allAreas = Array.from(new Set(allowedBranches.map((c) => c.branchId?.id)))
                .map((branchId) => {
                  const branch = allowedBranches.find((c) => c.branchId?.id === branchId)?.branchId;
                  const region = allowedBranches.find((c) => c.branchId?.id === branchId)?.regionId;
                  return branch
                    ? {
                      value: branchId,
                      label: branch.name,
                      sublabel: region ? `Region: ${region.name}` : "",
                      isSelected: false,
                    }
                    : null;
                })
                .filter(Boolean);

              const selectedAreas = formData.branchIds
                .map((branchId) => {
                  const branch = allowedBranches.find((c) => c.branchId?.id === branchId)?.branchId;
                  const region = allowedBranches.find((c) => c.branchId?.id === branchId)?.regionId;
                  return branch
                    ? {
                      value: branchId,
                      label: branch.name,
                      sublabel: region ? `Region: ${region.name}` : "",
                      isSelected: true,
                    }
                    : null;
                })
                .filter(Boolean);

              const availableAreas = allAreas.filter((option) => !formData.branchIds.includes(option.value));
              const selectAllOption = availableAreas.length > 0
                ? {
                  value: "SELECT_ALL_AREAS",
                  label: `✓ Select All Areas (${availableAreas.length})`,
                  sublabel: "Select all available areas at once",
                  isSelectAll: true,
                  isSelected: false,
                }
                : null;

              return [...(selectAllOption ? [selectAllOption] : []), ...selectedAreas, ...availableAreas];
            })()}
            
            onChange={(selected) => {
              if (selected) {
                if (selected.isSelectAll) {
                  const userBranchIds = currentUser?.branchIds || [];
                  const allowedBranches = filteredBranches.filter(
                    (c) =>
                      c.regionId &&
                      c.branchId &&
                      formData.regionIds.includes(c.regionId.id) &&
                      userBranchIds.includes(c.branchId.id)
                  );
                  const allAreaIds = Array.from(new Set(allowedBranches.map((c) => c.branchId?.id)));
                  setFormData((prev) => ({
                    ...prev,
                    branchIds: [...new Set([...prev.branchIds, ...allAreaIds])],
                  }));
                } else if (selected.isSelected) {
                  setFormData((prev) => ({
                    ...prev,
                    branchIds: prev.branchIds.filter((id) => id !== selected.value),
                  }));
                } else {
                  setFormData((prev) => ({
                    ...prev,
                    branchIds: [...prev.branchIds, selected.value],
                  }));
                }
              }
            }}
            placeholder={formData.regionIds.length === 0 ? "Select a region first..." : "Search areas..."}
            classNamePrefix="react-select"
            isClearable={false}
            isSearchable={true}
            closeMenuOnSelect={false}
            formatOptionLabel={(option) => (
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  {option.isSelected && <span className="text-green-600 text-sm">✓</span>}
                  <span className={option.isSelectAll ? "text-blue-700 font-bold" : option.isSelected ? "text-green-700 font-medium" : ""}>
                    {option.label}
                  </span>
                  {option.isSelected && !option.isSelectAll && (
                    <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">Selected</span>
                  )}
                </div>
                {option.sublabel && (
                  <span className={`text-xs ml-6 ${option.isSelectAll ? "text-blue-500" : "text-gray-500"}`}>
                    {option.sublabel}
                  </span>
                )}
              </div>
            )}
            styles={{
              control: (base, state) => ({
                ...base,
                minHeight: 36,
                fontSize: 13,
                borderColor: state.isFocused ? "#f59e0b" : "#d1d5db",
                boxShadow: state.isFocused ? "0 0 0 1px #f59e0b" : "none",
                "&:hover": { borderColor: "#f59e0b" },
              }),
              menu: (base) => ({ ...base, fontSize: 13, maxHeight: 250, zIndex: 9999 }),
              menuList: (base) => ({ ...base, maxHeight: 200, overflowY: "auto" }),
              input: (base) => ({ ...base, color: "#374151" }),
              option: (base, state) => ({
                ...base,
                color: "#374151",
                backgroundColor: state.isFocused ? "#fef3c7" : "#fff",
                cursor: "pointer",
                fontSize: 12,
                padding: "6px 10px",
              }),
              placeholder: (base) => ({ ...base, color: "#9ca3af", fontSize: 13 }),
            }}
            noOptionsMessage={() =>
              isDataLoading
                ? "Loading areas..."
                : formData.regionIds.length === 0
                  ? "Please select a region first"
                  : "No more areas available"
            }
            loadingMessage={() => "Loading areas..."}
          />
        </div>

        {/* Centre Dropdown */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm font-medium text-gray-700">
              Centre(s) *
            </label>
            {formData.centreIds.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setFormData((prev) => ({ ...prev, centreIds: [] }));
                  }}
                  className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                >
                  ✕ Clear All
                </button>
                <span className="text-xs text-gray-500">
                  ({formData.centreIds.length} selected)
                </span>
              </div>
            )}
          </div>
          <Select
            isMulti={false}
            isLoading={isDataLoading}
            isDisabled={formData.branchIds.length === 0 || isDataLoading}
            options={(() => {
              if (formData.branchIds.length === 0) return [];
              const userCentreIds = currentUser?.centreIds || [];
              const accessibleCentres = filteredCentres.filter((centre) => userCentreIds.includes(centre.id));
              const allCenters = accessibleCentres.map((centre) => ({
                value: centre.id,
                label: `${centre.name} (${centre.centreId})`,
                sublabel: centre.regionId && centre.branchId
                  ? `Region: ${centre.regionId.name} | Area: ${centre.branchId.name}`
                  : "",
                isSelected: false,
              }));

              const selectedCenters = formData.centreIds
                .map((centreId) => {
                  const centre = accessibleCentres.find((c) => c.id === centreId);
                  if (!centre) return null;
                  return {
                    value: centre.id,
                    label: `${centre.name} (${centre.centreId})`,
                    sublabel: centre.regionId && centre.branchId
                      ? `Region: ${centre.regionId.name} | Area: ${centre.branchId.name}`
                      : "",
                    isSelected: true,
                  };
                })
                .filter(Boolean);

              const availableCenters = allCenters.filter((option) => !formData.centreIds.includes(option.value));
              const selectAllOption = availableCenters.length > 0
                ? {
                  value: "SELECT_ALL_CENTRES",
                  label: `✓ Select All Centres (${availableCenters.length})`,
                  sublabel: "Select all available centres at once",
                  isSelectAll: true,
                  isSelected: false,
                }
                : null;

              return [...(selectAllOption ? [selectAllOption] : []), ...selectedCenters, ...availableCenters];
            })()}
            
            onChange={(selected) => {
              if (selected) {
                if (selected.isSelectAll) {
                  const userCentreIds = currentUser?.centreIds || [];
                  const accessibleCentres = filteredCentres.filter((centre) => userCentreIds.includes(centre.id));
                  const allCentreIds = accessibleCentres.map((centre) => centre.id);
                  setFormData((prev) => ({
                    ...prev,
                    centreIds: [...new Set([...prev.centreIds, ...allCentreIds])],
                  }));
                } else if (selected.isSelected) {
                  setFormData((prev) => ({
                    ...prev,
                    centreIds: prev.centreIds.filter((id) => id !== selected.value),
                  }));
                } else {
                  setFormData((prev) => ({
                    ...prev,
                    centreIds: [...prev.centreIds, selected.value],
                  }));
                }
              }
            }}
            placeholder={formData.branchIds.length === 0 ? "Select an area first..." : "Search centres..."}
            classNamePrefix="react-select"
            isClearable={false}
            isSearchable={true}
            closeMenuOnSelect={false}
            formatOptionLabel={(option) => (
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  {option.isSelected && <span className="text-green-600 text-sm">✓</span>}
                  <span className={option.isSelectAll ? "text-blue-700 font-bold" : option.isSelected ? "text-green-700 font-medium" : ""}>
                    {option.label}
                  </span>
                  {option.isSelected && !option.isSelectAll && (
                    <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">Selected</span>
                  )}
                </div>
                {option.sublabel && (
                  <span className={`text-xs ml-6 ${option.isSelectAll ? "text-blue-500" : "text-gray-500"}`}>
                    {option.sublabel}
                  </span>
                )}
              </div>
            )}
            styles={{
              control: (base, state) => ({
                ...base,
                minHeight: 36,
                fontSize: 13,
                borderColor: state.isFocused ? "#f59e0b" : "#d1d5db",
                boxShadow: state.isFocused ? "0 0 0 1px #f59e0b" : "none",
                "&:hover": { borderColor: "#f59e0b" },
              }),
              menu: (base) => ({ ...base, fontSize: 13, maxHeight: 250, zIndex: 9999 }),
              menuList: (base) => ({ ...base, maxHeight: 200, overflowY: "auto" }),
              input: (base) => ({ ...base, color: "#374151" }),
              option: (base, state) => ({
                ...base,
                color: "#374151",
                backgroundColor: state.isFocused ? "#fef3c7" : "#fff",
                cursor: "pointer",
                fontSize: 12,
                padding: "6px 10px",
              }),
              placeholder: (base) => ({ ...base, color: "#9ca3af", fontSize: 13 }),
            }}
            noOptionsMessage={() => {
              if (isDataLoading) return "Loading centres...";
              if (formData.regionIds.length === 0) return "Please select a region first";
              if (formData.branchIds.length === 0) return "Please select an area first";
              return "No more centres available";
            }}
            loadingMessage={() => "Loading centres..."}
          />
        </div>
      </div>
    </div>
  );
};

export default LocationSelector;

