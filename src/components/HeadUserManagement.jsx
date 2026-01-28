import React, { useState, useEffect } from 'react';
import { 
  FiUser, 
  FiPlus, 
  FiEdit3, 
  FiTrash2, 
  FiMail, 
  FiPhone, 
  FiCreditCard,
  FiEye,
  FiEyeOff,
  FiSave,
  FiX,
  FiUserPlus,
  FiRefreshCw,
  FiEdit2,
  FiLock
} from 'react-icons/fi';
import { authAPI, userAPI } from '../utils/apiServices';
import { ROLES } from '../utils/helpers';
import { API_URL } from '../utils/config';

const HeadUserManagement = () => {
  const [headUsers, setHeadUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showPins, setShowPins] = useState(false);
  const [individualPinVisibility, setIndividualPinVisibility] = useState({});
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobileNumber: '',
    aadharOrPanNumber: '',
    status: 'Active',
    loginId: '',
    pin: ''
  });

  const [formErrors, setFormErrors] = useState({});

  // Load Head Users on component mount
  useEffect(() => {
    fetchHeadUsers();
  }, []);

  const fetchHeadUsers = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Try the new specific endpoint first since you've implemented it
      try {
        console.log('Trying the new /api/users/by-role?role=HEAD endpoint');
        const response = await fetch(`${API_URL}/api/users/by-role?role=HEAD`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const headUsers = await response.json();
          setHeadUsers(headUsers);
          console.log(`Successfully fetched ${headUsers.length} HEAD users using by-role endpoint`);
          return;
        } else if (response.status === 404) {
          console.log('by-role endpoint not found, trying fallback methods');
        } else {
          const errorText = await response.text();
          console.log(`by-role endpoint failed: ${response.status} ${response.statusText} - ${errorText}`);
        }
      } catch (roleEndpointError) {
        console.log('by-role endpoint error:', roleEndpointError.message);
      }
      
      // Fallback to userAPI.getAllUsers
      try {
        console.log('Trying userAPI.getAllUsers as fallback');
        const users = await userAPI.getAllUsers();
        const headUsers = users.filter(user => user.role === 'HEAD');
        setHeadUsers(headUsers);
        console.log(`Successfully fetched ${headUsers.length} HEAD users using userAPI.getAllUsers fallback`);
        return;
      } catch (userAPIError) {
        console.log('userAPI.getAllUsers failed, trying direct fetch endpoints:', userAPIError.message);
      }
      
      // Final fallback to direct API calls with better error handling
      const endpoints = [
        `${API_URL}/api/users`, // Try the base users endpoint
        `${API_URL}/api/users/all` // All users endpoint
      ];
      
      let headUsers = [];
      let lastError = '';
      let successfulEndpoint = '';
      
      for (const endpoint of endpoints) {
        try {
          console.log(`Trying fallback endpoint: ${endpoint}`);
          const response = await fetch(endpoint, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
              const data = await response.json();
              console.log('Response data from fallback endpoint:', data);
              
              // Handle different response formats
              let users = [];
              if (Array.isArray(data)) {
                users = data;
              } else if (data.users && Array.isArray(data.users)) {
                users = data.users;
              } else if (data.data && Array.isArray(data.data)) {
                users = data.data;
              } else if (data.message && data.message.includes('No users found')) {
                users = []; // Empty array for no users found
              }
              
              // Filter for HEAD users since these are fallback endpoints
              headUsers = users.filter(user => user && user.role === 'HEAD');
              
              successfulEndpoint = endpoint;
              console.log(`Successfully fetched ${headUsers.length} HEAD users from fallback ${endpoint}`);
              break; // Success, exit the loop
            } else {
              const textResponse = await response.text();
              lastError = `Endpoint ${endpoint} returned non-JSON response: ${textResponse.substring(0, 100)}...`;
              console.log(lastError);
            }
          } else if (response.status === 404) {
            lastError = `Endpoint ${endpoint} not found (404)`;
            console.log(lastError);
            continue;
          } else {
            const errorText = await response.text();
            lastError = `Endpoint ${endpoint} failed: ${response.status} ${response.statusText} - ${errorText.substring(0, 100)}`;
            console.log(lastError);
          }
        } catch (fetchError) {
          lastError = `Error with endpoint ${endpoint}: ${fetchError.message}`;
          console.log(lastError);
          continue; // Try next endpoint
        }
      }
      
      setHeadUsers(headUsers);
      
      // If no endpoints worked and we don't have any users, show error
      if (headUsers.length === 0 && lastError) {
        console.error('All HEAD users fetch attempts failed. Last error:', lastError);
        setError(`Unable to fetch HEAD users. Please verify the backend endpoints are working correctly. Last error: ${lastError}`);
      } else if (successfulEndpoint) {
        // Clear any previous errors if we succeeded
        setError('');
      }
    } catch (err) {
      console.error('Unexpected error in fetchHeadUsers:', err);
      setError('Unexpected error loading Head Users: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }
    
    if (!formData.mobileNumber.trim()) {
      errors.mobileNumber = 'Mobile number is required';
    } else if (!/^\d{10}$/.test(formData.mobileNumber)) {
      errors.mobileNumber = 'Mobile number must be 10 digits';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear specific field error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleCreateHeadUser = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const userData = {
        ...formData,
        role: 'HEAD',
        branchIds: [], // Head users don't need specific location assignments
        centreIds: [],
        regionIds: []
      };

      // Use direct authenticated API call to the correct endpoint
      const response = await fetch(`${API_URL}/api/users/register`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });

      if (response.ok) {
        const result = await response.json();
        setSuccess(`Head User created successfully! Login ID: ${result.user?.loginId || result.loginId || 'Generated'}, PIN: ${result.user?.pin || result.pin || 'Generated'}`);
        setFormData({
          name: '',
          email: '',
          mobileNumber: '',
          aadharOrPanNumber: '',
          status: 'Active',
          loginId: '',
          pin: ''
        });
        setShowCreateForm(false);
        fetchHeadUsers(); // Refresh the list
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to create Head User');
      }
    } catch (err) {
      setError('Error creating Head User: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to delete Head User "${userName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setSuccess('Head User deleted successfully');
        fetchHeadUsers();
      } else {
        setError('Failed to delete Head User');
      }
    } catch (err) {
      setError('Error deleting Head User: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      mobileNumber: user.mobileNumber,
      aadharOrPanNumber: user.aadharOrPanNumber || '',
      status: user.status,
      loginId: user.loginId || '',
      pin: user.pin || ''
    });
    setShowCreateForm(true);
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      // Use PATCH method for partial updates
      const response = await fetch(`${API_URL}/api/users/update/${editingUser._id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const result = await response.json();
        setSuccess('Head User updated successfully');
        setFormData({
          name: '',
          email: '',
          mobileNumber: '',
          aadharOrPanNumber: '',
          status: 'Active',
          loginId: '',
          pin: ''
        });
        setShowCreateForm(false);
        setEditingUser(null);
        fetchHeadUsers();
      } else {
        const errorData = await response.json();
        setError(errorData.message || errorData.error || 'Failed to update Head User');
      }
    } catch (err) {
      setError('Error updating Head User: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      mobileNumber: '',
      aadharOrPanNumber: '',
      status: 'Active',
      loginId: '',
      pin: ''
    });
    setFormErrors({});
    setShowCreateForm(false);
    setEditingUser(null);
    setError('');
  };

  const toggleIndividualPinVisibility = (userId) => {
    setIndividualPinVisibility(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  // Auto-hide success message after 5 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

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
                    <FiUserPlus className="text-amber-500" />
                    Head User <span className="text-amber-500">Management</span>
                  </h1>
                  <p className="text-sm text-gray-600">
                    Create and manage Head Users in the system
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowPins(!showPins)}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
                    title={showPins ? "Hide PINs" : "Show PINs"}
                  >
                    {showPins ? <FiEyeOff /> : <FiEye />}
                    {showPins ? "Hide" : "Show"} PINs
                  </button>
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-400 to-amber-400 text-white font-semibold rounded-lg hover:from-orange-500 hover:to-amber-500 transition-all duration-200"
                  >
                    <FiPlus />
                    Add Head User
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                      <FiUser className="text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-blue-600 font-medium">Total Head Users</p>
                      <p className="text-2xl font-bold text-blue-800">{headUsers.length}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                      <FiUserPlus className="text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-green-600 font-medium">Active Users</p>
                      <p className="text-2xl font-bold text-green-800">
                        {headUsers.filter(user => user.status === 'Active').length}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-amber-50 to-amber-100 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center">
                      <FiCreditCard className="text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-amber-600 font-medium">With Login Credentials</p>
                      <p className="text-2xl font-bold text-amber-800">
                        {headUsers.filter(user => user.loginId && user.pin).length}
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

            {/* Create/Edit Form Modal */}
            {showCreateForm && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                  <div className="flex items-center justify-between p-6 border-b">
                    <h2 className="text-lg font-semibold text-gray-800">
                      {editingUser ? 'Edit Head User' : 'Add New Head User'}
                    </h2>
                    <button
                      onClick={resetForm}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <FiX size={24} />
                    </button>
                  </div>

                  <form onSubmit={editingUser ? handleUpdateUser : handleCreateHeadUser} className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Name */}
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Full Name *
                        </label>
                        <div className="relative mt-1">
                          <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                          <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            required
                            className={`w-full pl-9 pr-3 py-2 bg-white border rounded-lg text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 ${
                              formErrors.name ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="Enter full name"
                          />
                        </div>
                        {formErrors.name && (
                          <p className="text-red-600 text-xs mt-1">{formErrors.name}</p>
                        )}
                      </div>

                      {/* Email */}
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Email Address *
                        </label>
                        <div className="relative mt-1">
                          <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            required
                            className={`w-full pl-9 pr-3 py-2 bg-white border rounded-lg text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 ${
                              formErrors.email ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="Enter email address"
                          />
                        </div>
                        {formErrors.email && (
                          <p className="text-red-600 text-xs mt-1">{formErrors.email}</p>
                        )}
                      </div>

                      {/* Mobile Number */}
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Mobile Number *
                        </label>
                        <div className="relative mt-1">
                          <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                          <input
                            type="tel"
                            name="mobileNumber"
                            value={formData.mobileNumber}
                            onChange={handleInputChange}
                            required
                            maxLength="10"
                            className={`w-full pl-9 pr-3 py-2 bg-white border rounded-lg text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 ${
                              formErrors.mobileNumber ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="Enter 10-digit mobile number"
                          />
                        </div>
                        {formErrors.mobileNumber && (
                          <p className="text-red-600 text-xs mt-1">{formErrors.mobileNumber}</p>
                        )}
                      </div>

                      {/* Aadhar/PAN */}
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Aadhar/PAN Number
                        </label>
                        <div className="relative mt-1">
                          <FiCreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                          <input
                            type="text"
                            name="aadharOrPanNumber"
                            value={formData.aadharOrPanNumber}
                            onChange={handleInputChange}
                            className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
                            placeholder="Enter Aadhar or PAN number (optional)"
                          />
                        </div>
                      </div>

                      {/* Status */}
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Status
                        </label>
                        <select
                          name="status"
                          value={formData.status}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 mt-1"
                        >
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                        </select>
                      </div>

                      {/* Login ID - Only show in edit mode */}
                      {editingUser && (
                        <div>
                          <label className="text-sm font-medium text-gray-700">
                            Login ID
                          </label>
                          <div className="relative mt-1">
                            <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                            <input
                              type="text"
                              name="loginId"
                              value={formData.loginId}
                              onChange={handleInputChange}
                              className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
                              placeholder="Enter login ID (optional)"
                            />
                          </div>
                        </div>
                      )}

                      {/* PIN - Only show in edit mode */}
                      {editingUser && (
                        <div>
                          <label className="text-sm font-medium text-gray-700">
                            PIN
                          </label>
                          <div className="relative mt-1">
                            <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                            <input
                              type="text"
                              name="pin"
                              value={formData.pin}
                              onChange={handleInputChange}
                              maxLength="4"
                              className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
                              placeholder="Enter 4-digit PIN (optional)"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* {editingUser && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-blue-800 mb-2">Edit Mode - Additional Fields</h3>
                        <p className="text-xs text-blue-600">
                          You can update the Login ID and PIN for this user. Leave fields empty to keep current values.
                        </p>
                      </div>
                    )} */}

                    <div className="flex gap-3 pt-4 border-t">
                      <button
                        type="button"
                        onClick={resetForm}
                        className="flex-1 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-400 to-amber-400 text-white font-semibold rounded-lg hover:from-orange-500 hover:to-amber-500 disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {loading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            {editingUser ? 'Updating...' : 'Adding...'}
                          </>
                        ) : (
                          <>
                            <FiSave />
                            {editingUser ? 'Update User' : 'Add User'}
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Refresh Button */}
            <div className="mb-6 flex justify-end">
              <button
                onClick={fetchHeadUsers}
                disabled={loading}
                className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <FiRefreshCw className={loading ? 'animate-spin' : ''} />
                Refresh
              </button>
            </div>

            {/* Head Users List */}
            {loading ? (
              <div className="bg-white rounded-lg border p-8 text-center">
                <div className="w-8 h-8 border-2 border-orange-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-500">Loading Head Users...</p>
              </div>
            ) : headUsers.length === 0 ? (
              <div className="bg-gray-50 rounded-lg border p-8 text-center">
                <FiUserPlus className="mx-auto text-gray-400 text-4xl mb-4" />
                <p className="text-gray-500 text-lg mb-2">No Head Users found</p>
                <p className="text-gray-400 text-sm mb-4">Add your first Head User to get started</p>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="px-4 py-2 bg-gradient-to-r from-orange-400 to-amber-400 text-white rounded-lg hover:from-orange-500 hover:to-amber-500"
                >
                  Add First Head User
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-lg border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User Details
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Login Credentials
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {headUsers.map((user, index) => (
                        <tr key={user._id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <FiUser className="text-blue-600" />
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">{user.name}</div>
                                <div className="text-sm text-gray-500">{user.email}</div>
                                {user.mobileNumber && (
                                  <div className="text-xs text-gray-400">{user.mobileNumber}</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="space-y-1">
                              <div>
                                <span className="text-xs text-gray-500">Login ID:</span>
                                <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium font-mono inline-block ml-1">
                                  {user.loginId || 'N/A'}
                                </div>
                              </div>
                              <div>
                                <span className="text-xs text-gray-500">PIN:</span>
                                <div className="flex items-center gap-1">
                                  <div className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium font-mono">
                                    {(showPins || individualPinVisibility[user._id]) ? (user.pin || 'N/A') : '••••'}
                                  </div>
                                  <button
                                    onClick={() => toggleIndividualPinVisibility(user._id)}
                                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                                    title={(showPins || individualPinVisibility[user._id]) ? "Hide PIN" : "Show PIN"}
                                  >
                                    {(showPins || individualPinVisibility[user._id]) ? 
                                      <FiEyeOff size={12} /> : 
                                      <FiEye size={12} />
                                    }
                                  </button>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              user.status === 'Active'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {user.status}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleEditUser(user)}
                                className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded"
                                title="Edit user"
                              >
                                <FiEdit2 size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteUser(user._id, user.name)}
                                className="p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded"
                                title="Delete user"
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

export default HeadUserManagement;
