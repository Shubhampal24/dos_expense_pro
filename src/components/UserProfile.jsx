import React, { useState, useEffect } from "react";
import {
  FiX,
  FiUser,
  FiEdit3,
  FiSave,
  FiXCircle,
  FiCheck,
  FiMapPin,
  FiHome,
  FiGlobe,
  FiFilter,
  FiChevronDown,
  FiChevronRight,
} from "react-icons/fi";
import { authAPI, locationAPI } from "../utils/apiServices";
import { getCentresWithDetails } from "../utils/centresApi";

const UserProfile = ({ isOpen, onClose, currentUser }) => {
  const [userDetails, setUserDetails] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedUser, setEditedUser] = useState({});

  // Available options for dropdowns
  const [availableCentres, setAvailableCentres] = useState([]);
  const [availableBranches, setAvailableBranches] = useState([]);
  const [availableRegions, setAvailableRegions] = useState([]);

  // Store all data for hierarchical filtering
  const [allBranches, setAllBranches] = useState([]);
  const [allCentres, setAllCentres] = useState([]);

  // Hierarchical selection state
  const [selectedRegionId, setSelectedRegionId] = useState("");
  const [selectedBranchId, setSelectedBranchId] = useState("");

  // Search filters
  const [centreFilter, setCentreFilter] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [regionFilter, setRegionFilter] = useState("");

  // Collapse/expand state for groups
  const [collapsedGroups, setCollapsedGroups] = useState({});

  useEffect(() => {
    if (isOpen && currentUser) {
      fetchUserDetails();
      loadAvailableOptionsNew();
    } else if (isOpen) {
      console.log(
        "⚠️ Profile opened but no currentUser, checking localStorage..."
      );
      // If no currentUser but modal is open, try to get user from localStorage
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUserDetails(parsedUser);
          setEditedUser({
            name: parsedUser.name,
            loginId: parsedUser.loginId,
            role: parsedUser.role,
            centreIds: parsedUser.centreIds || [],
            branchIds: parsedUser.branchIds || [],
            regionIds: parsedUser.regionIds || [],
          });
          loadAvailableOptionsNew();
        } catch (error) {
          console.error("Error parsing stored user:", error);
        }
      }
    }
  }, [isOpen, currentUser]);

  // Filter branches based on selected regions (similar to AddExpense)
  useEffect(() => {
    if (selectedRegionId && allBranches.length > 0) {
      const filteredBranches = allBranches.filter(
        (branch) => branch.regionId === selectedRegionId
      );
      setAvailableBranches(filteredBranches);
    } else if (!selectedRegionId) {
      setAvailableBranches(allBranches);
    }
  }, [selectedRegionId, allBranches]);

  // Filter centres based on selected branches (similar to AddExpense)
  useEffect(() => {
    if (selectedBranchId && allCentres.length > 0) {
      const filteredCentres = allCentres.filter(
        (centre) => centre.branchId === selectedBranchId
      );
      setAvailableCentres(filteredCentres);
    } else if (selectedRegionId && !selectedBranchId) {
      // Show all centres for the selected region
      const filteredCentres = allCentres.filter(
        (centre) => centre.regionId === selectedRegionId
      );
      setAvailableCentres(filteredCentres);
    } else if (!selectedRegionId && !selectedBranchId) {
      setAvailableCentres(allCentres);
    }
  }, [selectedBranchId, selectedRegionId, allCentres]);

  const fetchUserDetails = async () => {

    if (!currentUser?.userId) {
      // Try to get user from localStorage as fallback
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUserDetails(parsedUser);
          setEditedUser({
            name: parsedUser.name,
            loginId: parsedUser.loginId,
            role: parsedUser.role,
            centreIds: parsedUser.centreIds || [],
            branchIds: parsedUser.branchIds || [],
            regionIds: parsedUser.regionIds || [],
          });
          return;
        } catch (error) {
          console.error("Error parsing stored user:", error);
        }
      }
      return;
    }

    setIsLoading(true);
    try {
      const userData = await authAPI.fetchCurrentUserDetails();

      if (userData && !userData.error) {
        setUserDetails(userData);
        setEditedUser({
          name: userData.name,
          loginId: userData.loginId,
          role: userData.role,
          centreIds: userData.centreIds || [],
          branchIds: userData.branchIds || [],
          regionIds: userData.regionIds || [],
        });
      } else {
        // Fallback to localStorage
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUserDetails(parsedUser);
          setEditedUser({
            name: parsedUser.name,
            loginId: parsedUser.loginId,
            role: parsedUser.role,
            centreIds: parsedUser.centreIds || [],
            branchIds: parsedUser.branchIds || [],
            regionIds: parsedUser.regionIds || [],
          });
        }
      }
    } catch (error) {
      console.error("❌ Error fetching user details:", error);
      // Fallback to localStorage
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
        
          setUserDetails(parsedUser);
          setEditedUser({
            name: parsedUser.name,
            loginId: parsedUser.loginId,
            role: parsedUser.role,
            centreIds: parsedUser.centreIds || [],
            branchIds: parsedUser.branchIds || [],
            regionIds: parsedUser.regionIds || [],
          });
        } catch (parseError) {
          console.error(
            "Error parsing stored user after API error:",
            parseError
          );
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loadAvailableOptions = async () => {
    try {

      // Strategy 1: Try to use dedicated API endpoints first
      try {

        // Fetch regions, branches, and centres separately
        const [regionsData, branchesData, centresData] =
          await Promise.allSettled([
            locationAPI.getRegions(),
            locationAPI.getBranches(),
            locationAPI.getCentres(),
          ]);

        // Process regions
        if (regionsData.status === "fulfilled" && regionsData.value) {
          const regions = Array.isArray(regionsData.value)
            ? regionsData.value
            : [regionsData.value];
          setAvailableRegions(
            regions.map((region) => ({
              id: region._id || region.id,
              _id: region._id || region.id,
              name: region.name,
              short_code: region.short_code || region.shortCode,
              shortCode: region.shortCode || region.short_code,
            }))
          );
        }

        // Process branches
        if (branchesData.status === "fulfilled" && branchesData.value) {
          const branches = Array.isArray(branchesData.value)
            ? branchesData.value
            : [branchesData.value];
          setAvailableBranches(
            branches.map((branch) => ({
              id: branch._id || branch.id,
              _id: branch._id || branch.id,
              name: branch.name,
              shortCode: branch.shortCode || branch.short_code,
              regionId: branch.regionId?._id || branch.regionId,
              regionName: branch.regionName,
            }))
          );
        }

        // Process centres
        if (centresData.status === "fulfilled" && centresData.value) {
          const centres = Array.isArray(centresData.value)
            ? centresData.value
            : [centresData.value];
          setAvailableCentres(
            centres.map((centre) => ({
              id: centre._id || centre.id,
              _id: centre._id || centre.id,
              name: centre.name,
              shortCode: centre.shortCode || centre.short_code,
              branchId: centre.branchId?._id || centre.branchId,
              regionId: centre.regionId?._id || centre.regionId,
              branchName: centre.branchName,
              regionName: centre.regionName,
            }))
          );
        }

        // If at least one API call succeeded, return
        if (
          regionsData.status === "fulfilled" ||
          branchesData.status === "fulfilled" ||
          centresData.status === "fulfilled"
        ) {
          return;
        }
      } catch (strategy1Error) {
        console.log("⚠️ Strategy 1 failed:", strategy1Error);
      }

      // Strategy 2: Try centres with details API
      try {
        const centresDetailData = await locationAPI.getCentresWithDetails();

        if (centresDetailData && Array.isArray(centresDetailData)) {
          await processDetailedCentresData(centresDetailData);
          return;
        }
      } catch (strategy2Error) {
        console.log("⚠️ Strategy 2 failed:", strategy2Error);
      }

      // Strategy 3: Try the original centres API
      try {
        const centresData = await getCentresWithDetails();

        if (centresData && Array.isArray(centresData)) {
          await processDetailedCentresData(centresData);
          return;
        }
      } catch (strategy3Error) {
        console.log("⚠️ Strategy 3 failed:", strategy3Error);
      }

      // Strategy 4: Fallback to mock data
      await loadMockData();
    } catch (error) {
      console.error("❌ Error loading options from API:", error);
      // Final fallback to mock data
      await loadMockData();
    }
  };

  // Hierarchical filtering functions (similar to AddExpense)
  const handleRegionChange = (regionId) => {
    setSelectedRegionId(regionId);
    setSelectedBranchId(""); // Reset branch selection

    if (regionId) {
      // Filter branches by selected region
      const filteredBranches = allBranches.filter(
        (branch) => branch.regionId === regionId
      );
      setAvailableBranches(filteredBranches);

      // Reset centres to all centres for this region
      const filteredCentres = allCentres.filter(
        (centre) => centre.regionId === regionId
      );
      setAvailableCentres(filteredCentres);
    } else {
      // Show all branches and centres when no region is selected
      setAvailableBranches(allBranches);
      setAvailableCentres(allCentres);
    }
  };

  const handleBranchChange = (branchId) => {
    setSelectedBranchId(branchId);

    if (branchId) {
      // Filter centres by selected branch
      const filteredCentres = allCentres.filter(
        (centre) => centre.branchId === branchId
      );
      setAvailableCentres(filteredCentres);
    } else if (selectedRegionId) {
      // Show all centres for the selected region
      const filteredCentres = allCentres.filter(
        (centre) => centre.regionId === selectedRegionId
      );
      setAvailableCentres(filteredCentres);
    } else {
      // Show all centres
      setAvailableCentres(allCentres);
    }
  };

  // Enhanced loadAvailableOptions using only getCentresWithDetails
  const loadAvailableOptionsNew = async () => {
    try {
      setIsLoading(true);

      // Use getCentresWithDetails API exclusively
      const centresData = await getCentresWithDetails();

      if (centresData && Array.isArray(centresData)) {
        await processDetailedCentresDataWithFiltering(centresData);
      } else {
        await loadMockData();
      }
    } catch (error) {
      console.error("❌ Error loading data:", error);
      // Fallback to mock data
      await loadMockData();
    } finally {
      setIsLoading(false);
    }
  };

  const processDetailedCentresDataWithFiltering = async (centresData) => {
  
    // Process centers data
    const centres = centresData.map((centre) => ({
      id: centre._id || centre.id,
      _id: centre._id || centre.id,
      name: centre.name,
      centreId: centre.centreId,
      shortCode: centre.shortCode || centre.short_code,
      branchId: centre.branchId?._id || centre.branchId,
      regionId: centre.regionId?._id || centre.regionId,
      branchName: centre.branchName || centre.branchId?.name,
      regionName: centre.regionName || centre.regionId?.name,
    }));

    // Store all centres for filtering
    setAllCentres(centres);
    setAvailableCentres(centres);

    // Extract unique branches
    const branchesMap = new Map();
    centresData.forEach((centre) => {
      const branchId = centre.branchId?._id || centre.branchId;
      const branchName = centre.branchName || centre.branchId?.name;
      const branchShortCode =
        centre.branchId?.shortCode || centre.branchId?.short_code;
      const regionId = centre.regionId?._id || centre.regionId;

      if (branchId && branchName) {
        branchesMap.set(branchId, {
          id: branchId,
          _id: branchId,
          name: branchName,
          shortCode: branchShortCode,
          regionId: regionId,
        });
      }
    });
    const branches = Array.from(branchesMap.values());

    // Store all branches for filtering
    setAllBranches(branches);
    setAvailableBranches(branches);

    // Extract unique regions
    const regionsMap = new Map();
    centresData.forEach((centre) => {
      const regionId = centre.regionId?._id || centre.regionId;
      const regionName = centre.regionName || centre.regionId?.name;
      const regionShortCode =
        centre.regionId?.short_code || centre.regionId?.shortCode;

      if (regionId && regionName) {
        regionsMap.set(regionId, {
          id: regionId,
          _id: regionId,
          name: regionName,
          short_code: regionShortCode,
          shortCode: regionShortCode,
        });
      }
    });
    const regions = Array.from(regionsMap.values());
    setAvailableRegions(regions);
  };

  const loadMockData = async () => {
    const mockCentres = [
      { id: 1, name: "Mumbai Central", regionId: 1, branchId: 1 },
      { id: 2, name: "Delhi Central", regionId: 2, branchId: 3 },
      { id: 3, name: "Bangalore Central", regionId: 3, branchId: 4 },
      { id: 4, name: "Pune Central", regionId: 1, branchId: 2 },
      { id: 5, name: "Hyderabad Central", regionId: 3, branchId: 5 },
    ];

    const mockBranches = [
      { id: 1, name: "Mumbai Branch 1", regionId: 1 },
      { id: 2, name: "Mumbai Branch 2", regionId: 1 },
      { id: 3, name: "Delhi Branch 1", regionId: 2 },
      { id: 4, name: "Bangalore Branch 1", regionId: 3 },
      { id: 5, name: "Pune Branch 1", regionId: 3 },
    ];

    const mockRegions = [
      { id: 1, name: "Western Region" },
      { id: 2, name: "Northern Region" },
      { id: 3, name: "Southern Region" },
      { id: 4, name: "Eastern Region" },
    ];

    setAvailableCentres(mockCentres);
    setAllCentres(mockCentres);

    setAvailableBranches(mockBranches);
    setAllBranches(mockBranches);

    setAvailableRegions(mockRegions);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (userDetails) {
      setEditedUser({
        name: userDetails.name,
        loginId: userDetails.loginId,
        role: userDetails.role,
        centreIds: userDetails.centreIds || [],
        branchIds: userDetails.branchIds || [],
        regionIds: userDetails.regionIds || [],
      });
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // API call to update user access
      
      const userId = userDetails.userId || userDetails._id;
      if (!userId) {
        throw new Error("User ID not found");
      }

      const updateData = {
        branchIds: editedUser.branchIds || [],
        centreIds: editedUser.centreIds || [],
        regionIds: editedUser.regionIds || []
      };


      // Make API call to update user
      const token = localStorage.getItem('token');
      const apiUrl = `${import.meta.env.VITE_API_BASE_URL || 'https://backend.st9.in'}/api/users/${userId}`;
    

      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });


      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("API Error Response:", errorData);
        throw new Error(errorData.error || errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      // Update local state with the server response
      const updatedUserData = {
        ...userDetails,
        ...editedUser,
        centreIds: updateData.centreIds,
        branchIds: updateData.branchIds,
        regionIds: updateData.regionIds
      };
      
      setUserDetails(updatedUserData);
      
      // Also update localStorage if it exists
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          const updatedStoredUser = {
            ...parsedUser,
            centreIds: updateData.centreIds,
            branchIds: updateData.branchIds,
            regionIds: updateData.regionIds
          };
          localStorage.setItem('user', JSON.stringify(updatedStoredUser));
        } catch (e) {
          console.log("Could not update localStorage:", e);
        }
      }
      
      setIsEditing(false);
      
      // Show success message
      alert("User access updated successfully!");
    } catch (error) {
      console.error("Error updating user access:", error);
      // More detailed error message
      alert(`Error updating user: ${error.message}\n\nPlease check the console for more details.`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAccessChange = (type, id, checked) => {
    setEditedUser((prev) => {
      const field = `${type}Ids`;
      const currentIds = prev[field] || [];

      let newIds;
      if (checked) {
        newIds = [...currentIds, id];
      } else {
        newIds = currentIds.filter((existingId) => existingId !== id);
      }

      const updatedUser = {
        ...prev,
        [field]: newIds,
      };

      // Apply hierarchical filtering
      setTimeout(() => {
        applyHierarchicalFiltering(type, newIds, updatedUser);
      }, 0);

      return updatedUser;
    });
  };

  // Helper function to select all filtered items
  const handleSelectAll = (type, filteredOptions) => {
    setEditedUser((prev) => {
      const field = `${type}Ids`;
      const currentIds = prev[field] || [];
      const newIds = filteredOptions.map((option) => option._id || option.id);
      const combinedIds = [...new Set([...currentIds, ...newIds])];

      const updatedUser = {
        ...prev,
        [field]: combinedIds,
      };

      // Trigger hierarchical filtering after selecting all
      setTimeout(() => {
        applyHierarchicalFiltering(type, combinedIds, updatedUser);
      }, 0);

      return updatedUser;
    });
  };

  // Helper function to deselect all filtered items
  const handleDeselectAll = (type, filteredOptions) => {
    setEditedUser((prev) => {
      const field = `${type}Ids`;
      const currentIds = prev[field] || [];
      const idsToRemove = filteredOptions.map(
        (option) => option._id || option.id
      );
      const remainingIds = currentIds.filter((id) => !idsToRemove.includes(id));

      const updatedUser = {
        ...prev,
        [field]: remainingIds,
      };

      // Trigger hierarchical filtering after deselecting all
      setTimeout(() => {
        applyHierarchicalFiltering(type, remainingIds, updatedUser);
      }, 0);

      return updatedUser;
    });
  };

  // Centralized hierarchical filtering function
  const applyHierarchicalFiltering = (type, newIds, updatedUser) => {
    if (type === 'region') {
      // When region selection changes, filter branches and centres
      const remainingRegionIds = newIds;
      
      if (remainingRegionIds.length === 0) {
        // No regions selected - show all branches and centres
        setSelectedRegionId('');
        setSelectedBranchId('');
        setAvailableBranches(allBranches);
        setAvailableCentres(allCentres);
      } else {
        // One or more regions selected - show branches and centres for all selected regions
        const filteredBranches = allBranches.filter(branch => 
          remainingRegionIds.includes(branch.regionId)
        );
        setAvailableBranches(filteredBranches);
        
        const filteredCentres = allCentres.filter(centre => 
          remainingRegionIds.includes(centre.regionId)
        );
        setAvailableCentres(filteredCentres);
        
        // Reset branch selection when region selection changes
        setSelectedBranchId('');
        
      }
    } else if (type === 'branch') {
      // When branch selection changes, filter centres
      const remainingBranchIds = newIds;
      
      if (remainingBranchIds.length === 0) {
        // No branches selected - show centres based on region selection
        setSelectedBranchId('');
        const selectedRegionIds = updatedUser.regionIds || [];
        
        if (selectedRegionIds.length > 0) {
          const filteredCentres = allCentres.filter(centre => 
            selectedRegionIds.includes(centre.regionId)
          );
          setAvailableCentres(filteredCentres);
        } else {
          setAvailableCentres(allCentres);
        }
      } else {
        // One or more branches selected - show centres for all selected branches
        const filteredCentres = allCentres.filter(centre => 
          remainingBranchIds.includes(centre.branchId)
        );
        setAvailableCentres(filteredCentres);
      }
    }
  };

  const renderAccessSection = (title, type, options, filter, setFilter) => {
    // Apply only search filtering on the provided options
    const filteredOptions = options.filter((option) => {
      const searchTerm = filter.toLowerCase();
      const name = (option.name || "").toLowerCase();
      const shortCode = (
        option.shortCode ||
        option.short_code ||
        ""
      ).toLowerCase();
      const centreId = (option.centreId || "").toLowerCase();

      return name.includes(searchTerm) || shortCode.includes(searchTerm) || centreId.includes(searchTerm);
    });

    // Get count of assigned items for this type
    const assignedCount = editedUser[`${type}Ids`]?.length || 0;
    const assignedIds = editedUser[`${type}Ids`] || [];

    // Toggle group collapse/expand
    const toggleGroup = (groupKey) => {
      setCollapsedGroups(prev => ({
        ...prev,
        [`${type}-${groupKey}`]: !prev[`${type}-${groupKey}`]
      }));
    };

    const isGroupCollapsed = (groupKey) => {
      return collapsedGroups[`${type}-${groupKey}`] || false;
    };

    // Group selected items for hierarchical display
    const getSelectedItemsGrouped = () => {
      if (type === 'branch' && assignedIds.length > 0) {
        // Group branches by region
        const selectedBranches = options.filter(branch => assignedIds.includes(branch._id || branch.id));
        const groupedByRegion = {};
        
        selectedBranches.forEach(branch => {
          const region = availableRegions.find(r => (r._id || r.id) === branch.regionId);
          const regionName = region ? region.name : 'Unknown Region';
          const regionCode = region ? (region.shortCode || region.short_code || '') : '';
          const displayName = regionCode ? `${regionName} (${regionCode})` : regionName;
          
          if (!groupedByRegion[displayName]) {
            groupedByRegion[displayName] = [];
          }
          groupedByRegion[displayName].push(branch);
        });
        
        return groupedByRegion;
      } else if (type === 'centre' && assignedIds.length > 0) {
        // Group centres by branch and region
        const selectedCentres = options.filter(centre => assignedIds.includes(centre._id || centre.id));
        const groupedByBranch = {};
        
        selectedCentres.forEach(centre => {
          const branch = allBranches.find(b => (b._id || b.id) === centre.branchId);
          const region = availableRegions.find(r => (r._id || r.id) === centre.regionId);
          
          const branchName = branch ? branch.name : 'Unknown Branch';
          const regionName = region ? region.name : 'Unknown Region';
          const branchCode = branch ? (branch.shortCode || branch.short_code || '') : '';
          const regionCode = region ? (region.shortCode || region.short_code || '') : '';
          
          const groupKey = `${regionName}${regionCode ? ` (${regionCode})` : ''} > ${branchName}${branchCode ? ` (${branchCode})` : ''}`;
          
          if (!groupedByBranch[groupKey]) {
            groupedByBranch[groupKey] = [];
          }
          groupedByBranch[groupKey].push(centre);
        });
        
        return groupedByBranch;
      }
      return {};
    };

    const selectedGrouped = getSelectedItemsGrouped();
    const hasSelectedItems = assignedIds.length > 0;

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-700">
            {title} (Assigned: {assignedCount}, Available: {filteredOptions.length})
          </h4>
          {isEditing && (
            <input
              type="text"
              placeholder={type === 'centre' ? `Search ${title.toLowerCase()}... (name, code, ID)` : `Search ${title.toLowerCase()}...`}
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className={`px-2 py-1 text-xs border text-black border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white ${type === 'centre' ? 'w-48' : 'w-32'}`}
            />
          )}
        </div>

        {/* Select All / Deselect All Controls */}
        {isEditing && filteredOptions.length > 0 && (
          <div className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg border">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleSelectAll(type, filteredOptions)}
                className="px-3 py-1 text-xs bg-gray-700 text-white rounded-full hover:bg-gray-800 transition-colors font-medium"
              >
                Select All ({filteredOptions.length})
              </button>
              <button
                onClick={() => handleDeselectAll(type, filteredOptions)}
                className="px-3 py-1 text-xs bg-gray-500 text-white rounded-full hover:bg-gray-600 transition-colors font-medium"
              >
                Deselect All
              </button>
              {assignedCount > 0 && (
                <button
                  onClick={() => {
                    const allAssignedIds = editedUser[`${type}Ids`] || [];
                    setEditedUser(prev => ({
                      ...prev,
                      [`${type}Ids`]: []
                    }));
                    // Apply hierarchical filtering
                    setTimeout(() => {
                      applyHierarchicalFiltering(type, [], { ...editedUser, [`${type}Ids`]: [] });
                    }, 0);
                  }}
                  className="px-3 py-1 text-xs bg-gray-600 text-white rounded-full hover:bg-gray-700 transition-colors font-medium"
                >
                  Clear All ({assignedCount})
                </button>
              )}
            </div>
          </div>
        )}

        {/* Show Selected Items Grouped (when not editing and has selections) */}
        {!isEditing && hasSelectedItems && (type === 'branch' || type === 'centre') && (
          <div className="space-y-3 mb-4">
            <h5 className="text-xs font-semibold text-gray-600 uppercase tracking-wide flex items-center">
              <div className="w-2 h-2 bg-gray-400 rounded-full mr-2"></div>
              Selected {title} by {type === 'branch' ? 'Region' : 'Branch & Region'}
            </h5>
            {Object.entries(selectedGrouped).map(([groupName, items]) => (
              <div key={groupName} className="border border-green-200 rounded-lg bg-50-100 p-3">
                <div className="flex items-center justify-between mb-2">
                  <h6 className="text-sm text-zinc-700 flex items-center">
                    <div className="w-3 h-3 bg-green-100 rounded mr-2"></div>
                    {groupName}
                  </h6>
                  <span className="text-xs bg-green-200 text-green-700 px-2 py-1 rounded-full font-medium">
                    {items.length} {items.length === 1 ? 'item' : 'items'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {items.map((item) => (
                    <div key={item._id || item.id} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-600 ">
                      <FiCheck className="text-green-500 text-sm flex-shrink-0 mr-1" />
                      <span className="truncate max-w-20" title={item.name}>
                        {item.name}
                      </span>
                      {(type === 'centre' && (item.centreId || item.shortCode || item.short_code)) && (
                        <span className="ml-1 text-xs text-green-600">
                          {[item.centreId, item.shortCode || item.short_code].filter(Boolean).join(' - ')}
                        </span>
                      )}
                      {(type !== 'centre' && (item.shortCode || item.short_code)) && (
                        <span className="ml-1 text-xs text-green-600">
                          {item.shortCode || item.short_code}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Show Selected Items (for regions or when editing) */}
        {!isEditing && hasSelectedItems && type === 'region' && (
          <div className="space-y-1 mb-4 border border-green-200 rounded-md p-2 bg-zinc-50">
            <h5 className="text-xs font-medium text-green-700 uppercase tracking-wide">Selected {title}</h5>
            <div className="flex flex-wrap gap-1">
              {options.filter(option => assignedIds.includes(option._id || option.id)).map((option) => (
                <div key={option._id || option.id} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-600 ">
                  <FiCheck className="text-green-500 text-xs flex-shrink-0 mr-1" />
                  <span className="truncate max-w-20" title={option.name}>
                    {option.name}
                  </span>
                  {(option.shortCode || option.short_code) && (
                    <span className="ml-1 text-xs text-green-600">
                      ({option.shortCode || option.short_code})
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filter info */}
        {isEditing && (selectedRegionId || selectedBranchId) && (
          <div className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
            {selectedRegionId &&
              !selectedBranchId &&
              type === "branch" &&
              `Showing branches in ${
                availableRegions.find((r) => r.id === selectedRegionId)?.name ||
                "selected region"
              }`}
            {selectedBranchId &&
              type === "centre" &&
              `Showing centres in ${
                availableBranches.find((b) => b.id === selectedBranchId)
                  ?.name || "selected branch"
              }`}
            {selectedRegionId &&
              !selectedBranchId &&
              type === "centre" &&
              `Showing centres in ${
                availableRegions.find((r) => r.id === selectedRegionId)?.name ||
                "selected region"
              }`}
          </div>
        )}

        {/* Available Options (when editing) */}
        {isEditing && (
          <div className="space-y-4">
            {/* Available Options List - Capsule Design with Grouping */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h5 className="text-xs font-medium text-gray-600 uppercase tracking-wide flex items-center">
                  <span>Available {title} {filter && `(filtered)`}</span>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full ml-2">
                    {filteredOptions.length} available
                  </span>
                </h5>
                {(type === 'branch' || type === 'centre') && filteredOptions.length > 0 && (
                  <button
                    onClick={() => {
                      const grouped = {};
                      if (type === 'branch') {
                        filteredOptions.forEach(branch => {
                          const region = availableRegions.find(r => (r._id || r.id) === branch.regionId);
                          const regionName = region ? region.name : 'Unknown Region';
                          const regionCode = region ? (region.shortCode || region.short_code || '') : '';
                          const groupKey = regionCode ? `${regionName} (${regionCode})` : regionName;
                          if (!grouped[groupKey]) grouped[groupKey] = [];
                        });
                      } else if (type === 'centre') {
                        filteredOptions.forEach(centre => {
                          const branch = allBranches.find(b => (b._id || b.id) === centre.branchId);
                          const region = availableRegions.find(r => (r._id || r.id) === centre.regionId);
                          const branchName = branch ? branch.name : 'Unknown Branch';
                          const regionName = region ? region.name : 'Unknown Region';
                          const branchCode = branch ? (branch.shortCode || branch.short_code || '') : '';
                          const regionCode = region ? (region.shortCode || region.short_code || '') : '';
                          const groupKey = `${regionName}${regionCode ? ` (${regionCode})` : ''} > ${branchName}${branchCode ? ` (${branchCode})` : ''}`;
                          if (!grouped[groupKey]) grouped[groupKey] = [];
                        });
                      }
                      
                      const groupKeys = Object.keys(grouped);
                      const allCollapsed = groupKeys.every(key => isGroupCollapsed(key));
                      
                      const newCollapsedState = { ...collapsedGroups };
                      groupKeys.forEach(key => {
                        newCollapsedState[`${type}-${key}`] = !allCollapsed;
                      });
                      setCollapsedGroups(newCollapsedState);
                    }}
                    className="text-xs text-gray-600 hover:text-gray-800 flex items-center space-x-1"
                  >
                    <span>
                      {(() => {
                        const grouped = {};
                        if (type === 'branch') {
                          filteredOptions.forEach(branch => {
                            const region = availableRegions.find(r => (r._id || r.id) === branch.regionId);
                            const regionName = region ? region.name : 'Unknown Region';
                            const regionCode = region ? (region.shortCode || region.short_code || '') : '';
                            const groupKey = regionCode ? `${regionName} (${regionCode})` : regionName;
                            if (!grouped[groupKey]) grouped[groupKey] = [];
                          });
                        } else if (type === 'centre') {
                          filteredOptions.forEach(centre => {
                            const branch = allBranches.find(b => (b._id || b.id) === centre.branchId);
                            const region = availableRegions.find(r => (r._id || r.id) === centre.regionId);
                            const branchName = branch ? branch.name : 'Unknown Branch';
                            const regionName = region ? region.name : 'Unknown Region';
                            const branchCode = branch ? (branch.shortCode || branch.short_code || '') : '';
                            const regionCode = region ? (region.shortCode || region.short_code || '') : '';
                            const groupKey = `${regionName}${regionCode ? ` (${regionCode})` : ''} > ${branchName}${branchCode ? ` (${branchCode})` : ''}`;
                            if (!grouped[groupKey]) grouped[groupKey] = [];
                          });
                        }
                        
                        const groupKeys = Object.keys(grouped);
                        const allCollapsed = groupKeys.every(key => isGroupCollapsed(key));
                        return allCollapsed ? 'Expand All' : 'Collapse All';
                      })()}
                    </span>
                  </button>
                )}
              </div>
              
              {filteredOptions.length === 0 ? (
                <div className="text-xs text-gray-500 text-center py-4 border border-dashed border-gray-300 rounded-lg">
                  {filter
                    ? `No ${title.toLowerCase()} found for "${filter}"`
                    : selectedRegionId || selectedBranchId
                    ? `No ${title.toLowerCase()} in selected filter`
                    : `No ${title.toLowerCase()} available`}
                </div>
              ) : (
                <div className="border rounded-lg p-2 bg-white max-h-80 overflow-y-auto">
                  {(type === 'branch' || type === 'centre') ? (
                    // Grouped display for branches and centres
                    (() => {
                      const grouped = {};
                      
                      if (type === 'branch') {
                        filteredOptions.forEach(branch => {
                          const region = availableRegions.find(r => (r._id || r.id) === branch.regionId);
                          const regionName = region ? region.name : 'Unknown Region';
                          const regionCode = region ? (region.shortCode || region.short_code || '') : '';
                          const groupKey = regionCode ? `${regionName} (${regionCode})` : regionName;
                          
                          if (!grouped[groupKey]) grouped[groupKey] = [];
                          grouped[groupKey].push(branch);
                        });
                      } else if (type === 'centre') {
                        filteredOptions.forEach(centre => {
                          const branch = allBranches.find(b => (b._id || b.id) === centre.branchId);
                          const region = availableRegions.find(r => (r._id || r.id) === centre.regionId);
                          
                          const branchName = branch ? branch.name : 'Unknown Branch';
                          const regionName = region ? region.name : 'Unknown Region';
                          const branchCode = branch ? (branch.shortCode || branch.short_code || '') : '';
                          const regionCode = region ? (region.shortCode || region.short_code || '') : '';
                          
                          const groupKey = `${regionName}${regionCode ? ` (${regionCode})` : ''} > ${branchName}${branchCode ? ` (${branchCode})` : ''}`;
                          
                          if (!grouped[groupKey]) grouped[groupKey] = [];
                          grouped[groupKey].push(centre);
                        });
                      }
                      
                      return Object.entries(grouped).map(([groupName, groupItems]) => (
                        <div key={groupName} className="mb-3 last:mb-0">
                          <div 
                            className="flex items-center justify-between mb-1 cursor-pointer hover:bg-gray-50 p-1 rounded"
                            onClick={() => toggleGroup(groupName)}
                          >
                            <h6 className="text-xs font-medium text-gray-600 flex items-center">
                              <div className="w-2 h-2 bg-gray-400 rounded mr-1"></div>
                              {groupName}
                              {isGroupCollapsed(groupName) ? (
                                <FiChevronRight className="ml-2 w-3 h-3 text-gray-400" />
                              ) : (
                                <FiChevronDown className="ml-2 w-3 h-3 text-gray-400" />
                              )}
                            </h6>
                            <span className="text-xs text-gray-500">
                              {groupItems.length}
                            </span>
                          </div>
                          {!isGroupCollapsed(groupName) && (
                            <div className="flex flex-wrap gap-1">
                              {groupItems.map((option) => {
                                const optionId = option._id || option.id;
                                const isSelected = assignedIds.includes(optionId);
                                const displayName = option.name;
                                const shortCode = (type === 'centre' && (option.centreId || option.shortCode || option.short_code)) 
                                  ? `${option.centreId || option.shortCode || option.short_code}` 
                                  : (option.shortCode || option.short_code || '');

                                return (
                                  <label 
                                    key={optionId} 
                                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium cursor-pointer transition-all duration-200 border ${
                                      isSelected 
                                        ? 'bg-gray-700 text-white border-gray-700 ' 
                                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 hover:border-gray-300'
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={(e) => handleAccessChange(type, optionId, e.target.checked)}
                                      className="sr-only"
                                    />
                                    <span className="truncate max-w-24" title={displayName}>
                                      {displayName}
                                    </span>
                                    {shortCode && (
                                      <span className={`ml-1 text-xs ${isSelected ? 'text-gray-300' : 'text-gray-400'}`}>
                                        {shortCode}
                                      </span>
                                    )}
                                  </label>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      ));
                    })()
                  ) : (
                    // Simple flat display for regions
                    <div className="flex flex-wrap gap-1">
                      {filteredOptions.map((option) => {
                        const optionId = option._id || option.id;
                        const isSelected = assignedIds.includes(optionId);
                        const displayName = option.name;
                        const shortCode = option.shortCode || option.short_code || '';

                        return (
                          <label 
                            key={optionId} 
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium cursor-pointer transition-all duration-200 border ${
                              isSelected 
                                ? 'bg-gray-700 text-white border-gray-700 ' 
                                : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 hover:border-gray-300'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => handleAccessChange(type, optionId, e.target.checked)}
                              className="sr-only"
                            />
                            <span className="truncate max-w-24" title={displayName}>
                              {displayName}
                            </span>
                            {shortCode && (
                              <span className={`ml-1 text-xs ${isSelected ? 'text-gray-300' : 'text-gray-400'}`}>
                                {shortCode}
                              </span>
                            )}
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Show Selected Items Grouped (in edit mode) - Compact Design */}
            {hasSelectedItems && (type === 'branch' || type === 'centre') && (
              <div className="space-y-2">
                <h5 className="text-xs font-semibold text-gray-600 uppercase tracking-wide flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-gray-400 rounded-full mr-2"></div>
                    Selected {title} by {type === 'branch' ? 'Region' : 'Branch & Region'}
                  </div>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                    {assignedCount} selected
                  </span>
                </h5>
                {Object.entries(selectedGrouped).map(([groupName, items]) => (
                  <div key={groupName} className="border border-gray-200 rounded-lg bg-gray-50 p-2 ">
                    <div className="flex items-center justify-between mb-1">
                      <h6 className="text-xs font-medium text-gray-700 flex items-center">
                        <div className="w-2 h-2 bg-gray-400 rounded mr-1"></div>
                        {groupName}
                      </h6>
                      <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                        {items.length}
                      </span>
                    </div>
                    {/* Compact Capsule design for selected items */}
                    <div className="flex flex-wrap gap-1">
                      {items.map((item) => {
                        const optionId = item._id || item.id;
                        const isSelected = assignedIds.includes(optionId);
                        const displayName = item.name;
                        const shortCode = (type === 'centre' && (item.centreId || item.shortCode || item.short_code)) 
                          ? `${item.centreId || item.shortCode || item.short_code}` 
                          : (item.shortCode || item.short_code || '');
                        
                        return (
                          <label 
                            key={optionId} 
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium cursor-pointer transition-all duration-200 border bg-green-100 text-green-700 border-green-600  hover:bg-green-200"
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => handleAccessChange(type, optionId, e.target.checked)}
                              className="sr-only"
                            />
                            <span className="truncate max-w-20" title={displayName}>
                              {displayName}
                            </span>
                            {shortCode && (
                              <span className="ml-1 text-xs text-green-600">
                                {shortCode}
                              </span>
                            )}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Selected Items for Regions (compact capsule design) */}
            {hasSelectedItems && type === 'region' && (
              <div className="space-y-2">
                <h5 className="text-xs font-semibold text-gray-600 uppercase tracking-wide flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    Selected {title}
                  </div>
                  <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
                    {assignedCount} selected
                  </span>
                </h5>
                <div className="border border-green-600 rounded-lg bg-green-100 p-2">
                  <div className="flex flex-wrap gap-1">
                    {options.filter(option => assignedIds.includes(option._id || option.id)).map((option) => {
                      const optionId = option._id || option.id;
                      const displayName = option.name;
                      const shortCode = option.shortCode || option.short_code || '';
                      
                      return (
                        <label 
                          key={optionId} 
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium cursor-pointer transition-all duration-200 border bg-green-100 text-green-700 border-green-600  hover:bg-green-200"
                        >
                          <input
                            type="checkbox"
                            checked={true}
                            onChange={(e) => handleAccessChange(type, optionId, e.target.checked)}
                            className="sr-only"
                          />
                          <span className="truncate max-w-20" title={displayName}>
                            {displayName}
                          </span>
                          {shortCode && (
                            <span className="ml-1 text-xs text-green-600">
                              {shortCode}
                            </span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {isEditing && filteredOptions.length > 0 && (
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>
              Assigned: {assignedCount} | Showing: {filteredOptions.length}
              {options.length !==
                (type === "region"
                  ? availableRegions.length
                  : type === "branch"
                  ? allBranches.length
                  : allCentres.length) && ` (of ${options.length} filtered)`}
            </span>
            <div className="flex items-center space-x-2">
              {filter && (
                <button
                  onClick={() => setFilter("")}
                  className="text-gray-600 hover:text-gray-800"
                >
                  Clear search
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50 p-2">
      <div className="bg-white rounded-lg  w-[98%] max-w-[1400px] max-h-[98vh] min-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
              <FiUser className="text-gray-600 text-lg" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                User Profile
              </h2>
              <p className="text-sm text-gray-500">
                Manage user details and access
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {!isEditing && (
              <button
                onClick={handleEdit}
                className="px-3 py-1.5 text-sm bg-gray-700 text-white rounded-md hover:bg-gray-800 flex items-center space-x-1"
              >
                <FiEdit3 className="text-xs" />
                <span>Edit</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <FiX className="text-xl" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto min-h-[78vh] max-h-[calc(95vh-140px)]">
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : userDetails ? (
            <div className="space-y-6">
              {/* Access Management */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-6">
                <div className="flex items-center space-x-2 mb-4">
                  <h3 className="text-md font-medium text-gray-900">
                    Access Management
                  </h3>
                  {isEditing && (
                    <span className="text-xs text-gray-600 bg-gray-200 px-2 py-1 rounded">
                      Edit Mode
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Regions */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-3">
                      <FiGlobe className="text-gray-500" />
                      <span className="font-medium text-gray-700">Regions</span>
                    </div>
                    {renderAccessSection(
                      "Regions",
                      "region",
                      availableRegions,
                      regionFilter,
                      setRegionFilter
                    )}
                  </div>

                  {/* Branches */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-3">
                      <FiHome className="text-gray-500" />
                      <span className="font-medium text-gray-700">
                        Branches
                      </span>
                    </div>
                    {renderAccessSection(
                      "Branches",
                      "branch",
                      availableBranches,
                      branchFilter,
                      setBranchFilter
                    )}
                  </div>

                  {/* Centres */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-3">
                      <FiMapPin className="text-gray-500" />
                      <span className="font-medium text-gray-700">Centres</span>
                    </div>
                    {renderAccessSection(
                      "Centres",
                      "centre",
                      availableCentres,
                      centreFilter,
                      setCentreFilter
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="space-y-4">
                <FiUser className="mx-auto text-gray-400 text-4xl" />
                <div>
                  <p className="text-gray-500 text-lg font-medium">
                    No user data available
                  </p>
                  <p className="text-gray-400 text-sm mt-2">
                    Please try refreshing the page or logging in again
                  </p>
                </div>
                <button
                  onClick={fetchUserDetails}
                  className="px-4 py-2 bg-gray-700 text-white text-sm rounded-md hover:bg-gray-800"
                >
                  Retry Loading
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {isEditing && (
          <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center space-x-1"
            >
              <FiXCircle className="text-xs" />
              <span>Cancel</span>
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 text-sm bg-gray-700 text-white rounded-md hover:bg-gray-800 disabled:opacity-50 flex items-center space-x-1"
            >
              {isSaving ? (
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
              ) : (
                <FiSave className="text-xs" />
              )}
              <span>{isSaving ? "Saving..." : "Save Changes"}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;
