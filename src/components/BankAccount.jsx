import React, { useState, useEffect } from 'react';
import { 
  FiPlus, 
  FiEdit2, 
  FiTrash2, 
  FiSave, 
  FiX, 
  FiDollarSign, 
  FiUser, 
  FiCreditCard, 
  FiMapPin, 
  FiSearch,
  FiRefreshCw,
  FiEye,
  FiEyeOff
} from 'react-icons/fi';
import { bankAccountAPI } from '../utils/apiServices';

const BankAccount = ({ currentUser }) => {
  const [accounts, setAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showBalances, setShowBalances] = useState(false);

  const [formData, setFormData] = useState({
    accountHolder: '',
    accountNumber: '',
    ifscCode: '',
    bankName: '',
    branchName: '',
    balance: '',
    isActive: true
  });

  useEffect(() => {
    fetchBankAccounts();
  }, []);

  const fetchBankAccounts = async () => {
    setIsLoading(true);
    try {
      const data = await bankAccountAPI.getAllBankAccounts();
      setAccounts(data);
      setError('');
    } catch (error) {
      console.error('Error fetching bank accounts:', error);
      setError('Error fetching bank accounts: ' + (error.message || 'Unknown error'));
      // Keep empty array on error instead of mock data
      setAccounts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    let processedValue = value;
    
    // Special processing for specific fields
    if (name === 'ifscCode') {
      processedValue = value.toUpperCase().replace(/[^A-Z0-9]/g, ''); // Only allow alphanumeric
      if (processedValue.length > 11) {
        processedValue = processedValue.slice(0, 11); // IFSC is max 11 characters
      }
    } else if (name === 'accountNumber') {
      processedValue = value.replace(/[^0-9]/g, ''); // Only allow numbers
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : processedValue
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    // Validation
    if (!formData.accountHolder.trim()) {
      setError('Account holder name is required');
      setIsSubmitting(false);
      return;
    }
    if (!formData.accountNumber.trim()) {
      setError('Account number is required');
      setIsSubmitting(false);
      return;
    }
    if (formData.accountNumber.length < 8 || formData.accountNumber.length > 18) {
      setError('Account number must be between 8 and 18 digits');
      setIsSubmitting(false);
      return;
    }
    if (!formData.ifscCode.trim()) {
      setError('IFSC code is required');
      setIsSubmitting(false);
      return;
    }
    if (formData.ifscCode.length !== 11) {
      setError('IFSC code must be exactly 11 characters');
      setIsSubmitting(false);
      return;
    }
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(formData.ifscCode)) {
      setError('Invalid IFSC code format (e.g., HDFC0000123)');
      setIsSubmitting(false);
      return;
    }
    if (!formData.bankName.trim()) {
      setError('Bank name is required');
      setIsSubmitting(false);
      return;
    }

    try {
      const submitData = {
        ...formData,
        ifscCode: formData.ifscCode.toUpperCase(), // Ensure IFSC is uppercase
        balance: parseFloat(formData.balance) || 0,
        userId: currentUser?.userId || currentUser?._id
      };

      let result;
      if (editingAccount) {
        result = await bankAccountAPI.updateBankAccount(editingAccount._id, submitData);
        setSuccess('Bank account updated successfully!');
        setAccounts(prev => prev.map(acc => 
          acc._id === editingAccount._id ? result : acc
        ));
      } else {
        result = await bankAccountAPI.addBankAccount(submitData);
        setSuccess('Bank account added successfully!');
        setAccounts(prev => [result, ...prev]);
      }
      
      handleCancelForm();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error saving bank account:', error);
      setError(error.message || 'Error saving bank account');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (account) => {
    setEditingAccount(account);
    setFormData({
      accountHolder: account.accountHolder,
      accountNumber: account.accountNumber,
      ifscCode: account.ifscCode,
      bankName: account.bankName,
      branchName: account.branchName,
      balance: account.balance.toString(),
      isActive: account.isActive
    });
    setShowAddForm(true);
  };

  const handleDelete = async (accountId) => {
    if (!window.confirm('Are you sure you want to delete this bank account?')) {
      return;
    }

    try {
      await bankAccountAPI.deleteBankAccount(accountId);
      setAccounts(prev => prev.filter(acc => acc._id !== accountId));
      setSuccess('Bank account deleted successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error deleting bank account:', error);
      setError(error.message || 'Failed to delete bank account');
    }
  };

  const handleCancelForm = () => {
    setShowAddForm(false);
    setEditingAccount(null);
    setFormData({
      accountHolder: '',
      accountNumber: '',
      ifscCode: '',
      bankName: '',
      branchName: '',
      balance: '',
      isActive: true
    });
    setError('');
  };

  const filteredAccounts = accounts.filter(account =>
    account.accountHolder.toLowerCase().includes(searchTerm.toLowerCase()) ||
    account.bankName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    account.accountNumber.includes(searchTerm) ||
    account.ifscCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalBalance = accounts.reduce((sum, account) => sum + (account.balance || 0), 0);

  return (
    <div className="h-screen w-full bg-gradient-to-tr from-white via-gray-100 to-slate-100">
      <div className="w-full h-full bg-white overflow-y-auto">
        <div className="flex flex-col px-4 md:px-6 lg:px-8 xl:px-12 h-full">
          <div className="py-4 md:py-6 lg:py-8 xl:py-12 w-full max-w-full">
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-800 flex items-center gap-2">
                    <FiCreditCard className="text-amber-500" />
                    Bank <span className="text-amber-500">Accounts</span>
                  </h1>
                  <p className="text-sm text-gray-600">
                    Manage your bank accounts and balances
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowBalances(!showBalances)}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
                    title={showBalances ? "Hide balances" : "Show balances"}
                  >
                    {showBalances ? <FiEyeOff /> : <FiEye />}
                    {showBalances ? "Hide" : "Show"} Balances
                  </button>
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-400 to-amber-400 text-white font-semibold rounded-lg hover:from-orange-500 hover:to-amber-500 transition-all duration-200"
                  >
                    <FiPlus />
                    Add Bank Account
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                      <FiCreditCard className="text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-blue-600 font-medium">Total Accounts</p>
                      <p className="text-2xl font-bold text-blue-800">{accounts.length}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                      <FiDollarSign className="text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-green-600 font-medium">Total Balance</p>
                      <p className="text-2xl font-bold text-green-800">
                        {showBalances 
                          ? `₹${totalBalance.toLocaleString('en-IN')}`
                          : '••••••••'
                        }
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-amber-50 to-amber-100 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center">
                      <FiUser className="text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-amber-600 font-medium">Active Accounts</p>
                      <p className="text-2xl font-bold text-amber-800">
                        {accounts.filter(acc => acc.isActive).length}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Messages */}
            {error && (
              <div className="bg-red-100 border border-red-300 rounded-lg p-3 mb-4">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}
            {success && (
              <div className="bg-green-100 border border-green-300 rounded-lg p-3 mb-4">
                <p className="text-green-600 text-sm">{success}</p>
              </div>
            )}

            {/* Add/Edit Form Modal */}
            {showAddForm && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                  <div className="flex items-center justify-between p-6 border-b">
                    <h2 className="text-lg font-semibold text-gray-800">
                      {editingAccount ? 'Edit Bank Account' : 'Add New Bank Account'}
                    </h2>
                    <button
                      onClick={handleCancelForm}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <FiX size={24} />
                    </button>
                  </div>

                  <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Account Holder Name *
                        </label>
                        <div className="relative mt-1">
                          <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                          <input
                            type="text"
                            name="accountHolder"
                            value={formData.accountHolder}
                            onChange={handleInputChange}
                            required
                            className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
                            placeholder="Enter account holder name"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Account Number *
                        </label>
                        <div className="relative mt-1">
                          <FiCreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                          <input
                            type="text"
                            name="accountNumber"
                            value={formData.accountNumber}
                            onChange={handleInputChange}
                            required
                            maxLength="18"
                            className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
                            placeholder="Enter account number (digits only)"
                          />
                        </div>
                        {formData.accountNumber && (
                          <p className={`text-xs mt-1 ${
                            formData.accountNumber.length >= 8 && formData.accountNumber.length <= 18
                              ? 'text-green-600' 
                              : 'text-red-600'
                          }`}>
                            {formData.accountNumber.length >= 8 && formData.accountNumber.length <= 18
                              ? '✓ Valid account number length' 
                              : `${formData.accountNumber.length}/18 digits (min: 8, max: 18)`
                            }
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          IFSC Code *
                        </label>
                        <div className="relative mt-1">
                          <FiMapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                          <input
                            type="text"
                            name="ifscCode"
                            value={formData.ifscCode}
                            onChange={handleInputChange}
                            required
                            maxLength="11"
                            className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
                            placeholder="e.g., HDFC0000123"
                            style={{ textTransform: 'uppercase' }}
                          />
                        </div>
                        {formData.ifscCode && formData.ifscCode.length > 0 && (
                          <p className={`text-xs mt-1 ${
                            /^[A-Z]{4}0[A-Z0-9]{6}$/.test(formData.ifscCode) && formData.ifscCode.length === 11
                              ? 'text-green-600' 
                              : 'text-red-600'
                          }`}>
                            {/^[A-Z]{4}0[A-Z0-9]{6}$/.test(formData.ifscCode) && formData.ifscCode.length === 11
                              ? '✓ Valid IFSC format' 
                              : `${formData.ifscCode.length}/11 characters - Format: BANK0BRANCH`
                            }
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Bank Name *
                        </label>
                        <div className="relative mt-1">
                          <FiCreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                          <input
                            type="text"
                            name="bankName"
                            value={formData.bankName}
                            onChange={handleInputChange}
                            required
                            className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
                            placeholder="Enter bank name"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Branch Name
                        </label>
                        <div className="relative mt-1">
                          <FiMapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                          <input
                            type="text"
                            name="branchName"
                            value={formData.branchName}
                            onChange={handleInputChange}
                            className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
                            placeholder="Enter branch name (optional)"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Initial Balance (₹)
                        </label>
                        <div className="relative mt-1">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">
                            ₹
                          </span>
                          <input
                            type="number"
                            name="balance"
                            value={formData.balance}
                            onChange={handleInputChange}
                            min="0"
                            step="0.01"
                            className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        name="isActive"
                        checked={formData.isActive}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
                      />
                      <label className="ml-2 block text-sm text-gray-700">
                        Account is active
                      </label>
                    </div>

                    <div className="flex gap-3 pt-4 border-t">
                      <button
                        type="button"
                        onClick={handleCancelForm}
                        className="flex-1 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-400 to-amber-400 text-white font-semibold rounded-lg hover:from-orange-500 hover:to-amber-500 disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            {editingAccount ? 'Updating...' : 'Adding...'}
                          </>
                        ) : (
                          <>
                            <FiSave />
                            {editingAccount ? 'Update Account' : 'Add Account'}
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Search and Filters */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <div className="flex-1">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search by account holder, bank name, account number, or IFSC..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-10 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
                    />
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <FiX />
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={fetchBankAccounts}
                    disabled={isLoading}
                    className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    <FiRefreshCw className={isLoading ? 'animate-spin' : ''} />
                    Refresh
                  </button>
                  <div className="px-3 py-2 bg-white border rounded-lg text-sm font-medium">
                    {filteredAccounts.length} of {accounts.length} accounts
                  </div>
                </div>
              </div>
            </div>

            {/* Bank Accounts Table */}
            {isLoading ? (
              <div className="bg-white rounded-lg border p-8 text-center">
                <div className="w-8 h-8 border-2 border-orange-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-500">Loading bank accounts...</p>
              </div>
            ) : filteredAccounts.length === 0 ? (
              <div className="bg-gray-50 rounded-lg border p-8 text-center">
                <FiCreditCard className="mx-auto text-gray-400 text-4xl mb-4" />
                <p className="text-gray-500 text-lg mb-2">
                  {searchTerm ? 'No accounts match your search' : 'No bank accounts found'}
                </p>
                <p className="text-gray-400 text-sm mb-4">
                  {searchTerm ? 'Try adjusting your search terms' : 'Add your first bank account to get started'}
                </p>
                {searchTerm ? (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
                  >
                    Clear Search
                  </button>
                ) : (
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="px-4 py-2 bg-gradient-to-r from-orange-400 to-amber-400 text-white rounded-lg hover:from-orange-500 hover:to-amber-500"
                  >
                    Add First Account
                  </button>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-lg border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Account Details
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Bank Information
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Balance
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredAccounts.map((account, index) => (
                        <tr key={account._id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                          <td className="px-4 py-4">
                            <div>
                              <div className="font-medium text-gray-900">
                                {account.accountHolder}
                              </div>
                              <div 
                                className="text-sm text-gray-500 font-mono cursor-pointer hover:text-gray-700 transition-colors"
                                title={`Full Account Number: ${account.accountNumber}`}
                              >
                                ••••••••{account.accountNumber.slice(-4)}
                              </div>
                              {account.userId && (
                                <div className="text-xs text-blue-600 mt-1">
                                  {account.userId.name || account.userId.email}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div>
                              <div className="font-medium text-gray-900">
                                {account.bankName}
                              </div>
                              <div className="text-sm text-gray-500">
                                {account.branchName && `${account.branchName} • `}
                                <span className="font-mono">{account.ifscCode}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="font-medium text-gray-900">
                              {showBalances 
                                ? `₹${(account.balance || 0).toLocaleString('en-IN')}`
                                : '••••••••'
                              }
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              account.isActive
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {account.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-500">
                            {new Date(account.createdAt).toLocaleDateString('en-IN')}
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleEdit(account)}
                                className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded"
                                title="Edit account"
                              >
                                <FiEdit2 size={16} />
                              </button>
                              <button
                                onClick={() => handleDelete(account._id)}
                                className="p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded"
                                title="Delete account"
                              >
                                <FiTrash2 size={16} />
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
      </div>
    </div>
  );
};

export default BankAccount;
