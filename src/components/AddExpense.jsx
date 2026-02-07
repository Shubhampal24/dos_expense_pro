import { useEffect, useState } from "react";

import {
  FiUpload,
  FiX,
  FiAlertTriangle,
} from "react-icons/fi";
import { useNavigate, useLocation } from "react-router-dom";
import ExpenseForm from "./ui/ExpenseForm";
import ExpensesTable from "./ui/ExpensesTable";
import EditExpenseModal from "./ui/EditExpenseModal";
import ReviewModal from "./ui/ReviewModal";
import ExcelImportModal from "./ui/ExcelImportModal";
import DeleteConfirmModal from "./ui/DeleteConfirmModal";
import { adExpenseAPI, authAPI, bankAccountAPI } from "../utils/apiServices";
import { getCentresWithDetails } from "../utils/centresApi";

const AddExpense = ({ currentUser: propCurrentUser, onUserUpdate }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [formData, setFormData] = useState({
    expenseDate: new Date().toISOString().split("T")[0],
    paidTo: "",
    reason: "",
    amount: "",
    GST: "",
    TdsAmount: "",
    verified: false,
    regionIds: [],
    branchIds: [],
    centreIds: [],
    bankAccount: "", // Added bank account field
  });
  const [centres, setCentres] = useState([]);
  const [filteredBranches, setFilteredBranches] = useState([]);
  const [filteredCentres, setFilteredCentres] = useState([]);

  // Bank account related state
  const [bankAccounts, setBankAccounts] = useState([]);
  const [isLoadingBanks, setIsLoadingBanks] = useState(true);
  const [expenses, setExpenses] = useState([]);
  const [isLoadingExpenses, setIsLoadingExpenses] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [modalLocationData, setModalLocationData] = useState(null);
  const [modalSearchTerm, setModalSearchTerm] = useState("");
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [filteredModalLocations, setFilteredModalLocations] = useState({
    regions: [],
    branches: [],
    centres: [],
  });
  const [dateFilter, setDateFilter] = useState(
    new Date().toISOString().split("T")[0]
  ); // Today's date
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [showDateRange, setShowDateRange] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Excel import related state
  const [showExcelImport, setShowExcelImport] = useState(false);
  const [excelFile, setExcelFile] = useState(null);
  const [importPreview, setImportPreview] = useState([]);
  const [importProgress, setImportProgress] = useState(0);
  const [isImporting, setIsImporting] = useState(false);
  const [importResults, setImportResults] = useState(null);
  const [showMismatchModal, setShowMismatchModal] = useState(false);
  const [mismatchedEntries, setMismatchedEntries] = useState([]);
  const [showAccessDeniedModal, setShowAccessDeniedModal] = useState(false);
  const [accessDeniedEntries, setAccessDeniedEntries] = useState([]);

  // Edit expense related state
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState(null);

  // Modal Edit State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editExpenseId, setEditExpenseId] = useState(null);

  // DISABLED: Auto-selection from navigation state
  // User wants locations available but NOT auto-selected
  /*
  useEffect(() => {
    if (location.state?.fromLogin && location.state?.locationSelection) {
      const { regionIds, branchIds, centreIds } = location.state.locationSelection;
      console.log('🔍 AddExpense: Received location data from navigation state:', {
        regionIds: regionIds?.length || 0,
        branchIds: branchIds?.length || 0,
        centreIds: centreIds?.length || 0
      });

      setFormData(prev => ({
        ...prev,
        regionIds: regionIds || [],
        branchIds: branchIds || [],
        centreIds: centreIds || []
      }));
    }
  }, [location.state]);
  */

  useEffect(() => {
    // Get current user data from props first, then fallback to API
    const user = propCurrentUser || authAPI.getCurrentUser();
    setCurrentUser(user);
    setIsDataLoading(true);
    getCentresWithDetails()
      .then((data) => {
        // ✅ NORMALIZE ONCE FOR AddExpense UI
        const normalizedCentres = data.map(({ centre, branch, region }) => ({
          id: centre.id,
          name: centre.name,
          centreId: centre.centreId,

          branchId: {
            id: branch?.id,
            name: branch?.name,
          },

          regionId: {
            id: region?.id,
            name: region?.name,
          },
        }));

        setCentres(normalizedCentres);
      })
      .catch(() => setCentres([]))
      .finally(() => setIsDataLoading(false));

    // Fetch existing expenses
    fetchExpenses();

    // Fetch bank accounts
    fetchBankAccounts();
  }, [propCurrentUser]); // Listen to propCurrentUser changes

  // Token debugging - call when currentUser is set
  useEffect(() => {
    if (typeof logTokenInfo === "function") {
      logTokenInfo();
    }
  }, [currentUser]);

  // Filter branches based on selected regions and user access
  useEffect(() => {
    if (formData.regionIds.length > 0 && currentUser) {
      const userBranchIds = currentUser.branchIds || [];

      // SKIP VALIDATION if currentUser doesn't have branchIds (prevents clearing on login)
      if (userBranchIds.length === 0) {
        console.log('⚠️ Skipping branch validation - currentUser has no branchIds');
        return;
      }

      const branches = centres.filter(
        (centre) =>
          formData.regionIds.includes(centre.regionId?.id) &&
          userBranchIds.includes(centre.branchId?.id)
      );
      setFilteredBranches(branches);

      // Remove any branchIds that are no longer valid
      const validBranchIds = [...new Set(branches.map((c) => c.branchId?.id))];
      const filteredBranchIds = formData.branchIds.filter((branchId) =>
        validBranchIds.includes(branchId)
      );

      if (filteredBranchIds.length !== formData.branchIds.length) {
        setFormData((prev) => ({ ...prev, branchIds: filteredBranchIds }));
      }
    } else {
      setFilteredBranches([]);
    }
  }, [formData.regionIds, centres, currentUser]);

  // Filter centres based on selected branches and user access
  useEffect(() => {
    if (formData.branchIds.length > 0 && currentUser) {
      const userCentreIds = currentUser.centreIds || [];

      // SKIP VALIDATION if currentUser doesn't have centreIds (prevents clearing on login)
      if (userCentreIds.length === 0) {
        console.log('⚠️ Skipping centre validation - currentUser has no centreIds');
        return;
      }

      const centresFiltered = centres.filter(
        (centre) =>
          formData.branchIds.includes(centre.branchId?.id) &&
          userCentreIds.includes(centre.id)
      );
      setFilteredCentres(centresFiltered);

      // Remove any centreIds that are no longer valid
      const validCentreIds = centresFiltered.map((c) => c.id);
      const filteredCentreIds = formData.centreIds.filter((centreId) =>
        validCentreIds.includes(centreId)
      );

      if (filteredCentreIds.length !== formData.centreIds.length) {
        setFormData((prev) => ({ ...prev, centreIds: filteredCentreIds }));
      }
    } else {
      setFilteredCentres([]);
    }
  }, [formData.branchIds, centres, currentUser]);

  // Function to refresh user data (called after UserProfile is closed)
  const refreshUserData = async () => {
    try {
      const user = propCurrentUser || authAPI.getCurrentUser();
      setCurrentUser(user);
      console.log("User data refreshed:", user);
    } catch (error) {
      console.error("Failed to refresh user data:", error);
    }
  };

  // Listen for changes in propCurrentUser (from parent's refreshUserData call)
  useEffect(() => {
    if (propCurrentUser) {
      setCurrentUser(propCurrentUser);
    }
  }, [propCurrentUser]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (error) setError("");
    if (success) setSuccess("");
  };

  // Fetch expenses for the current user
  const fetchExpenses = async () => {
    setIsLoadingExpenses(true);
    try {
      // Get userId from token or currentUser
      let userId = null;
      const token = localStorage.getItem("authToken");
      const decodedToken = token ? decodeToken(token) : null;
      userId =
        decodedToken?.id ||
        decodedToken?.userId ||
        decodedToken?.id ||
        decodedToken?.sub ||
        currentUser?.id;
      if (!userId) {
        setExpenses([]);
        setIsLoadingExpenses(false);
        return;
      }
      // Call the new endpoint
      const response = await adExpenseAPI.getAdExpensesByUserId(userId);

      // ✅ NORMALIZE BACKEND DATA → FRONTEND SHAPE
      const normalizedExpenses = (response || []).map(exp => ({
        ...exp,

        // 🔹 match frontend naming (handle both old camelCase and new lowercase from backend)
        GST: exp.GST ?? exp.gst ?? "",
        TdsAmount: exp.TdsAmount ?? exp.tdsAmount ?? 0,
        noOfDays: exp.noOfDays ?? 0,  // Ensure noOfDays is always a number

        // 🔹 normalize bank account (table expects object)
        bankAccount: exp.bankAccount ?? (
          exp.bankAccountId || exp.bankName
            ? {
              id: exp.bankAccountId,
              bankName: exp.bankName,
            }
            : null
        ),

        // 🔹 safety default (CRITICAL for table rendering)
        isDeleted: exp.isDeleted ?? false,
      }));

      // ✅ IMPORTANT: set BOTH states
      setExpenses(normalizedExpenses);
      setFilteredExpenses(normalizedExpenses);




      // console.log("Fetched expenses:", response);
    } catch (err) {
      console.error("Error fetching expenses:", err);
      setExpenses([]);
    } finally {
      setIsLoadingExpenses(false);
    }
  };

  // Fetch bank accounts for the dropdown
  const fetchBankAccounts = async () => {
    setIsLoadingBanks(true);
    try {
      const response = await bankAccountAPI.getAllBankAccounts();
      setBankAccounts(response.data || response || []);
    } catch (err) {
      console.error("Error fetching bank accounts:", err);
      setBankAccounts([]);
    } finally {
      setIsLoadingBanks(false);
    }
  };

  // Filter expenses based on date and search term
  useEffect(() => {
    let filtered = expenses;

    // Filter by date
    if (showDateRange) {
      // Date range filtering
      if (startDate && endDate) {
        filtered = filtered.filter((expense) => {
          const expenseDate = new Date(expense.expenseDate)
            .toISOString()
            .split("T")[0];
          return expenseDate >= startDate && expenseDate <= endDate;
        });
      } else if (startDate) {
        filtered = filtered.filter((expense) => {
          const expenseDate = new Date(expense.expenseDate)
            .toISOString()
            .split("T")[0];
          return expenseDate >= startDate;
        });
      } else if (endDate) {
        filtered = filtered.filter((expense) => {
          const expenseDate = new Date(expense.expenseDate)
            .toISOString()
            .split("T")[0];
          return expenseDate <= endDate;
        });
      }
    } else {
      // Single date filtering
      if (dateFilter) {
        filtered = filtered.filter((expense) => {
          const expenseDate = new Date(expense.expenseDate)
            .toISOString()
            .split("T")[0];
          return expenseDate === dateFilter;
        });
      }
    }

    // Filter by search term (smart search across multiple fields)
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter((expense) => {
        // Search in basic fields
        const matchesBasic =
          expense.paidTo?.toLowerCase().includes(searchLower) ||
          expense.reason?.toLowerCase().includes(searchLower) ||
          expense.amount?.toString().includes(searchLower) ||
          expense.id?.slice(-6).toLowerCase().includes(searchLower);

        // Search in bank account
        const matchesBank =
          expense.bankAccount &&
          (expense.bankAccount.accountHolder
            ?.toLowerCase()
            .includes(searchLower) ||
            expense.bankAccount.bankName?.toLowerCase().includes(searchLower) ||
            expense.bankAccount.accountNumber
              ?.slice(-4)
              .includes(searchLower) ||
            expense.bankAccount.ifscCode?.toLowerCase().includes(searchLower));

        // Search in locations
        const matchesRegions = expense.region_ids?.some(
          (region) =>
            region.name?.toLowerCase().includes(searchLower)
        );

        const matchesAreas = expense.branch_ids?.some(
          (branch) =>
            branch.name?.toLowerCase().includes(searchLower)
        );

        const matchesCentres = expense.centre_ids?.some(
          (centre) =>
            centre.name?.toLowerCase().includes(searchLower) ||
            centre.centreId?.toLowerCase().includes(searchLower)
        );

        return (
          matchesBasic ||
          matchesBank ||
          matchesRegions ||
          matchesAreas ||
          matchesCentres
        );
      });
    }

    setFilteredExpenses(filtered);
  }, [expenses, dateFilter, searchTerm, showDateRange, startDate, endDate]);

  // Filter modal locations based on search term
  useEffect(() => {
    if (!modalLocationData) {
      setFilteredModalLocations({ regions: [], branches: [], centres: [] });
      return;
    }

    const searchLower = modalSearchTerm.toLowerCase().trim();

    if (!searchLower) {
      // No search term, show all locations
      setFilteredModalLocations({
        regions: modalLocationData.regions || [],
        branches: modalLocationData.branches || [],
        centres: modalLocationData.centres || [],
      });
      return;
    }

    // Filter regions
    const filteredRegions = (modalLocationData.regions || []).filter(
      (region) =>
        region.name?.toLowerCase().includes(searchLower) ||
        region.id?.toLowerCase().includes(searchLower)
    );

    // Filter branches/areas
    const filteredBranches = (modalLocationData.branches || []).filter(
      (branch) =>
        branch.name?.toLowerCase().includes(searchLower) ||
        branch.id?.toLowerCase().includes(searchLower)
    );

    // Filter centres
    const filteredCentres = (modalLocationData.centres || []).filter(
      (centre) =>
        centre.name?.toLowerCase().includes(searchLower) ||
        centre.centreId?.toLowerCase().includes(searchLower) ||
        centre.id?.toLowerCase().includes(searchLower)
    );

    setFilteredModalLocations({
      regions: filteredRegions,
      branches: filteredBranches,
      centres: filteredCentres,
    });
  }, [modalLocationData, modalSearchTerm]);

  // Reset date filter handler
  const handleDateReset = () => {
    setDateFilter(new Date().toISOString().split("T")[0]);
  };

  // Function to decode JWT token
  const decodeToken = (token) => {
    try {
      if (!token) return null;

      // JWT has 3 parts separated by dots
      const parts = token.split(".");
      if (parts.length !== 3) return null;

      // Decode the payload (middle part)
      const payload = parts[1];

      // Add padding if needed
      const paddedPayload =
        payload + "=".repeat((4 - (payload.length % 4)) % 4);

      // Decode from base64
      const decodedPayload = atob(paddedPayload);

      // Parse JSON
      return JSON.parse(decodedPayload);
    } catch (error) {
      console.error("Error decoding token:", error);
      return null;
    }
  };

  // Function to log token information
  const logTokenInfo = () => {
    const token = localStorage.getItem("authToken");
    const user = localStorage.getItem("user");

    if (token) {
      try {
        const decodedToken = decodeToken(token);

        if (decodedToken) {
          // Check if token is expired
          const isExpired =
            decodedToken.exp && decodedToken.exp * 1000 < Date.now();
        }
      } catch (error) {
        console.error("❌ Error decoding token:", error);
      }
    } else {
      console.log("❌ No authentication token found");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validation
    if (!formData.expenseDate || !formData.paidTo || !formData.amount) {
      setError("Please fill in all required fields");
      return;
    }

    if (isNaN(formData.amount) || parseFloat(formData.amount) <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    // Validate location selections - skip validation for Double Tick Api, Spa Jobs, and Spa Advisor
    if (formData.paidTo !== "Double Tick Api" && formData.paidTo !== "Spa Jobs" && formData.paidTo !== "spa advisor") {
      if (formData.regionIds.length === 0) {
        setError("Please select at least one region");
        return;
      }

      if (formData.branchIds.length === 0) {
        setError("Please select at least one area");
        return;
      }

      if (formData.centreIds.length === 0) {
        setError("Please select at least one centre");
        return;
      }
    }

    // Show review modal instead of directly submitting
    setShowReviewModal(true);
  };

  const handleConfirmSubmit = async () => {
    setIsLoading(true);
    setShowReviewModal(false);

    try {
      // Get user ID from token
      const token = localStorage.getItem("authToken");
      const decodedToken = token ? decodeToken(token) : null;
      const userId =
        decodedToken?.id ||
        decodedToken?.userId ||
        decodedToken?.id ||
        decodedToken?.sub ||
        currentUser?.id;

      const expenseData = {
        expenseDate: formData.expenseDate,
        paidTo: formData.paidTo,
        reason: formData.reason || "",
        amount: parseFloat(formData.amount),
        gst: formData.GST || "",  // Backend expects lowercase 'gst'
        tdsAmount: formData.TdsAmount ? parseFloat(formData.TdsAmount) : 0,  // Backend expects lowercase 'tdsAmount'
        noOfDays: formData.noOfDays ? parseInt(formData.noOfDays, 10) : 0,
        verified: formData.verified,
        regionIds: formData.regionIds,
        branchIds: formData.branchIds,
        centreIds: formData.centreIds,
        bankAccount: formData.bankAccount || null,
        ...(isEditMode ? {} : { createdBy: userId }), // Only add createdBy for new expenses
      };

      let response;
      if (isEditMode && editingExpense) {
        response = await adExpenseAPI.updateAdExpense(editingExpense.id, expenseData);
        setSuccess("Expense updated successfully!");
      } else {
        response = await adExpenseAPI.addAdExpense(expenseData);
        setSuccess("Advertising expense added successfully!");
      }

      // Refresh expenses list
      fetchExpenses();

      // Reset form and edit mode
      setFormData({
        expenseDate: new Date().toISOString().split("T")[0],
        paidTo: "",
        reason: "",
        amount: "",
        GST: "",
        TdsAmount: "",
        verified: false,
        regionIds: [],
        branchIds: [],
        centreIds: [],
        bankAccount: "",
      });

      // Reset edit mode
      if (isEditMode) {
        setIsEditMode(false);
        setEditingExpense(null);
      }

      // Auto hide success message
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(
        err.message || `Failed to ${isEditMode ? 'update' : 'add'} advertising expense. Please try again.`
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Edit Expense Functions
  const handleEditExpense = (expense) => {
    setEditExpenseId(expense.id);
    setShowEditModal(true);
  };

  const handleEditModalSave = async (updatedData) => {
    setIsLoading(true);
    try {
      await adExpenseAPI.updateAdExpense(editExpenseId, updatedData);
      setSuccess("Expense updated successfully!");
      setShowEditModal(false);
      setEditExpenseId(null);
      fetchExpenses();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message || "Failed to update expense");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditingExpense(null);
    setFormData({
      expenseDate: new Date().toISOString().split("T")[0],
      paidTo: "",
      reason: "",
      amount: "",
      GST: "",
      TdsAmount: "",
      verified: false,
      regionIds: [],
      branchIds: [],
      centreIds: [],
      bankAccount: "",
    });
    setError("");
    setSuccess("");
  };

  const handleDeleteExpense = (expense) => {
    setExpenseToDelete(expense);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteExpense = async () => {
    if (!expenseToDelete) return;

    setIsLoading(true);
    setError("");

    try {
      await adExpenseAPI.deleteAdExpense(expenseToDelete.id);

      setSuccess("Expense deleted successfully!");
      setShowDeleteConfirm(false);
      setExpenseToDelete(null);

      // Refresh expenses list
      fetchExpenses();

      // Auto hide success message
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message || "Failed to delete expense. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Excel Import Functions
  const handleExcelFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const allowedTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'text/csv',
        'application/csv'
      ];

      const allowedExtensions = ['.xlsx', '.xls', '.csv'];
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));

      if (allowedTypes.includes(file.type) || allowedExtensions.includes(fileExtension)) {
        setExcelFile(file);
        parseExcelFile(file);
      } else {
        setError('Please select a valid file (.xlsx, .xls, or .csv)');
        setExcelFile(null);
        setImportPreview([]);
      }
    }
  };

  const parseExcelFile = async (file) => {
    try {
      setIsImporting(true);
      setImportProgress(25);

      const text = await file.text();
      setImportProgress(50);

      // Parse CSV content
      const lines = text.split('\n').filter(line => line.trim());
      if (lines.length < 2) {
        throw new Error('File must contain at least a header row and one data row');
      }

      // Get headers
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));

      // Validate required headers for expense import
      const requiredHeaders = ['expenseDate', 'paidTo', 'amount', 'regionName', 'branchName', 'centreName'];
      const missingHeaders = requiredHeaders.filter(required =>
        !headers.some(header => header.toLowerCase() === required.toLowerCase())
      );

      if (missingHeaders.length > 0) {
        throw new Error(`Missing required columns: ${missingHeaders.join(', ')}`);
      }

      setImportProgress(75);

      // Parse data rows
      const parsedData = [];
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue; // Skip empty lines

        const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, '')); // Remove surrounding quotes

        // Find column indices (case-insensitive)
        const getColumnIndex = (columnName) => {
          return headers.findIndex(h => h.toLowerCase() === columnName.toLowerCase());
        };

        const rowData = {
          expenseDate: values[getColumnIndex('expenseDate')] || '',
          paidTo: values[getColumnIndex('paidTo')] || '',
          amount: values[getColumnIndex('amount')] || '',
          regionName: values[getColumnIndex('regionName')] || '',
          branchName: values[getColumnIndex('branchName')] || '',
          centreName: values[getColumnIndex('centreName')] || '',
          reason: values[getColumnIndex('reason')] || '',
          verified: values[getColumnIndex('verified')] || 'false'
        };

        // Only add row if it has all required fields
        if (rowData.expenseDate && rowData.paidTo && rowData.amount &&
          rowData.regionName && rowData.branchName && rowData.centreName) {
          parsedData.push(rowData);
        }
      }

      if (parsedData.length === 0) {
        throw new Error('No valid data rows found in the file. Please check your CSV format and ensure it contains all required fields.');
      }

      setImportProgress(100);
      setImportPreview(parsedData);

    } catch (error) {
      setError('Failed to parse CSV file: ' + error.message);
      setImportPreview([]);
    } finally {
      setIsImporting(false);
    }
  };

  const processExcelImport = async () => {
    try {
      if (!excelFile) {
        setError('Please select a file to import');
        return;
      }

      setIsImporting(true);
      setImportProgress(0);

      // Show progress while uploading
      setImportProgress(30);

      // Call the API to import expenses
      const result = await adExpenseAPI.importFromExcel(excelFile);

      setImportProgress(100);

      setImportResults({
        success: true,
        imported: result.insertedCount || importPreview.length,
        errors: [],
        summary: result.message || `Successfully imported ${result.insertedCount || importPreview.length} expense entries.`
      });

      // Refresh expenses list
      await fetchExpenses();

      setSuccess(`Excel import completed! ${result.insertedCount || importPreview.length} expenses imported successfully.`);

      setTimeout(() => {
        setShowExcelImport(false);
        setExcelFile(null);
        setImportPreview([]);
        setImportResults(null);
        setImportProgress(0);
      }, 3000);

    } catch (error) {
      setImportResults({
        success: false,
        imported: 0,
        errors: [error.message],
        summary: 'Import failed: ' + error.message
      });
      setError('Import failed: ' + error.message);
    } finally {
      setIsImporting(false);
    }
  };

  const downloadExcelTemplate = () => {
    // Create a sample CSV content for expense import
    const csvContent = `expenseDate,paidTo,reason,amount,verified,regionName,branchName,centreName
2025-08-06,Google Ads,,20000,false,West,Pune,Hinjewadi
2025-08-07,Meta Ads,,15000,true,West,Pune,Wakad
2025-08-08,JustDial,Monthly subscription,12000,false,North,Delhi,Connaught Place`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'expense_import_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetExcelImport = () => {
    setShowExcelImport(false);
    setExcelFile(null);
    setImportPreview([]);
    setImportResults(null);
    setImportProgress(0);
    setIsImporting(false);
  };

  return (
    <div className="h-screen w-full bg-gradient-to-tr from-white via-gray-100 to-slate-100">
      <div className="w-full h-full bg-white overflow-y-auto">
        {/* Data Loading Overlay */}
        {isDataLoading && (
          <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-orange-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-700 font-medium text-lg">
                Loading locations...
              </p>
              <p className="text-gray-500 text-sm mt-2">
                Please wait while we fetch the data
              </p>
            </div>
          </div>
        )}

        {/* Form Submission Loading Overlay */}
        {isLoading && (
          <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-40">
            <div className="bg-white rounded-lg p-6 text-center ">
              <div className="w-8 h-8 border-3 border-orange-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-700 font-medium">Processing...</p>
              <p className="text-gray-500 text-sm mt-1">Please wait</p>
            </div>
          </div>
        )}

        {/* Form Container */}
        <div className="flex flex-col px-4 md:px-6 lg:px-8 xl:px-12 h-full">
          {/* Add Expense Section */}
          <div className="py-4 md:py-6 lg:py-8 xl:py-12 w-full max-w-full">
            {/* Page Title */}
            <div className="mb-4 flex justify-between items-start">
              <div>
                <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-800 flex items-center gap-1">
                  {isEditMode ? 'Update' : 'Add'} <span className={`${isEditMode ? 'text-blue-500' : 'text-amber-500'}`}>Expense</span>
                </h1>
                <p className="text-sm text-gray-600">
                  {isEditMode ? 'Update existing advertising expense entry' : 'Create new advertising exCreate new advertising expense entries entries'}
                </p>
                {isEditMode && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                      Editing Mode
                    </span>
                  </div>
                )}
              </div>

              {/* Top Right Actions */}
              <div className="flex items-center gap-3">
                {isEditMode ? (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-4 py-2 text-sm font-bold text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors duration-200 flex items-center gap-2 "
                  >
                    <FiX className="w-4 h-4" />
                    Cancel Edit
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowExcelImport(true)}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
                    title="Import regions, branches, and centers from Excel or CSV"
                  >
                    <FiUpload size={16} />
                    Import Excel
                  </button>
                )}
              </div>
            </div>

            {/* Status Messages */}
            {error && (
              <div className="bg-red-100 border border-red-300 rounded-lg p-2 mb-3">
                <p className="text-red-600 text-xs text-center">{error}</p>
              </div>
            )}
            {success && (
              <div className="bg-green-100 border border-green-300 rounded-lg p-2 mb-3">
                <p className="text-green-600 text-xs text-center">{success}</p>
              </div>
            )}
            {/* Main Form */}
            <ExpenseForm
              formData={formData}
              setFormData={setFormData}
              isLoading={isLoading}
              isDataLoading={isDataLoading}
              isEditMode={isEditMode}
              handleInputChange={handleInputChange}
              handleSubmit={handleSubmit}
              handleCancelEdit={handleCancelEdit}
              bankAccounts={bankAccounts}
              isLoadingBanks={isLoadingBanks}
              centres={centres}
              filteredBranches={filteredBranches}
              filteredCentres={filteredCentres}
              currentUser={currentUser}
              accessDeniedEntries={accessDeniedEntries}
              setShowAccessDeniedModal={setShowAccessDeniedModal}
            />
          </div>
          <ExpensesTable
            expenses={expenses}
            filteredExpenses={filteredExpenses}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            dateFilter={dateFilter}
            setDateFilter={setDateFilter}
            showDateRange={showDateRange}
            setShowDateRange={setShowDateRange}
            startDate={startDate}
            setStartDate={setStartDate}
            endDate={endDate}
            setEndDate={setEndDate}
            isLoadingExpenses={isLoadingExpenses}
            fetchExpenses={fetchExpenses}
            handleEditExpense={handleEditExpense}
            handleDeleteExpense={handleDeleteExpense}
            showLocationModal={showLocationModal}
            setShowLocationModal={setShowLocationModal}
            modalLocationData={modalLocationData}
            setModalLocationData={setModalLocationData}
            modalSearchTerm={modalSearchTerm}
            setModalSearchTerm={setModalSearchTerm}
            filteredModalLocations={filteredModalLocations}
          />
        </div>

        <ReviewModal
          showReviewModal={showReviewModal}
          setShowReviewModal={setShowReviewModal}
          formData={formData}
          bankAccounts={bankAccounts}
          centres={centres}
          isLoading={isLoading}
          handleConfirmSubmit={handleConfirmSubmit}
          isEditMode={isEditMode}
        />

        {showEditModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white rounded-lg shadow-xl">
              <button
                onClick={() => setShowEditModal(false)}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 z-10"
              >
                <FiX size={24} />
              </button>
              <EditExpenseModal
                expenseId={editExpenseId}
                onSave={handleEditModalSave}
                onClose={() => setShowEditModal(false)}
                centres={centres}
                currentUser={currentUser}
              />
            </div>
          </div>
        )}

        <ExcelImportModal
          showExcelImport={showExcelImport}
          resetExcelImport={resetExcelImport}
          downloadExcelTemplate={downloadExcelTemplate}
          excelFile={excelFile}
          handleExcelFileChange={handleExcelFileChange}
          isImporting={isImporting}
          importProgress={importProgress}
          importPreview={importPreview}
          importResults={importResults}
          processExcelImport={processExcelImport}
        />

        {/* Minimal Mismatch Modal */}
        {showMismatchModal && (
          <div className="fixed inset-0 bg-black/20/ bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg  max-w-md w-full">
              {/* Simple Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center space-x-2">
                  <FiAlertTriangle className="w-5 h-5 text-orange-500" />
                  <h3 className="font-semibold text-gray-900">
                    {mismatchedEntries.length} Unmatched
                  </h3>
                </div>
                <button
                  onClick={() => setShowMismatchModal(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <FiX className="w-4 h-4 text-gray-500" />
                </button>
              </div>

              {/* Minimal Content */}
              <div className="p-4 max-h-60 overflow-y-auto">
                {mismatchedEntries.map((entry, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div className="flex items-center space-x-2">
                      <span className={`w-2 h-2 rounded-full ${entry.type === 'Region' ? 'bg-blue-400' :
                        entry.type === 'Branch' ? 'bg-green-400' : 'bg-purple-400'
                        }`}></span>
                      <span className="text-sm font-medium text-gray-900">{entry.name}</span>
                    </div>
                    <span className="text-xs text-gray-500 capitalize">{entry.type}</span>
                  </div>
                ))}
              </div>

              {/* Simple Footer */}
              <div className="p-4 border-t bg-gray-50">
                <button
                  onClick={() => setShowMismatchModal(false)}
                  className="w-full px-4 py-2 text-sm font-medium text-white bg-orange-500 rounded-md hover:bg-orange-600 transition-colors"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Access Denied Modal */}
        {showAccessDeniedModal && (
          <div className="fixed inset-0 bg-black/20 bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg  max-w-md w-full">
              {/* Access Denied Header */}
              <div className="flex items-center justify-between p-4 border-b bg-red-50">
                <div className="flex items-center space-x-2">
                  <FiAlertTriangle className="w-5 h-5 text-red-500" />
                  <h3 className="font-semibold text-gray-900">
                    {accessDeniedEntries.length} Access Denied
                  </h3>
                </div>
                <button
                  onClick={() => setShowAccessDeniedModal(false)}
                  className="p-1 hover:bg-red-100 rounded"
                >
                  <FiX className="w-4 h-4 text-gray-500" />
                </button>
              </div>

              {/* Access Denied Content */}
              <div className="p-4 max-h-60 overflow-y-auto">
                <div className="mb-3">
                  <p className="text-sm text-gray-600 mb-2">
                    You don't have permission to access these locations:
                  </p>
                </div>

                {accessDeniedEntries.map((entry, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div className="flex items-center space-x-2">
                      <span className={`w-2 h-2 rounded-full ${entry.type === 'Region' ? 'bg-red-400' :
                        entry.type === 'Branch' ? 'bg-red-400' : 'bg-red-400'
                        }`}></span>
                      <span className="text-sm font-medium text-gray-900">{entry.name}</span>
                    </div>
                    <span className="text-xs text-red-600 capitalize">{entry.type}</span>
                  </div>
                ))}

                {/* Access Help */}
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <h4 className="text-sm font-medium text-amber-800 mb-1">🔒 Access Required</h4>
                  <p className="text-xs text-amber-700">
                    Contact your administrator to get access to these locations or import only the locations you have permission to access.
                  </p>
                </div>
              </div>

              {/* Access Denied Footer */}
              <div className="p-4 border-t bg-gray-50">
                <button
                  onClick={() => setShowAccessDeniedModal(false)}
                  className="w-full px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-md hover:bg-red-600 transition-colors"
                >
                  Understood
                </button>
              </div>
            </div>
          </div>
        )}
        <DeleteConfirmModal
          showDeleteConfirm={showDeleteConfirm}
          expenseToDelete={expenseToDelete}
          setShowDeleteConfirm={setShowDeleteConfirm}
          setExpenseToDelete={setExpenseToDelete}
          isLoading={isLoading}
          confirmDeleteExpense={confirmDeleteExpense}
        />
      </div>
    </div>
  );
};

export default AddExpense;
