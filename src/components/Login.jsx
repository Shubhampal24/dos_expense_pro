import { useState } from 'react';
import { FiEye, FiEyeOff, FiHash, FiLock, FiUser } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../utils/apiServices';
import { APP_CONFIG } from '../utils/config';
import { isValidLoginId, isValidPin } from '../utils/helpers';

const Login = () => {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({ loginId: '', pin: '' });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (error) setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.loginId || !formData.pin) {
            setError('Please fill in all fields');
            return;
        }
        if (!isValidLoginId(formData.loginId)) {
            setError('Please enter a valid login ID');
            return;
        }
        if (!isValidPin(formData.pin)) {
            setError('Please enter a valid numeric PIN');
            return;
        }

        const loginData = {
            loginId: formData.loginId.trim(),
            pin: formData.pin.trim()
        };

        setIsLoading(true);

        try {
            const response = await authAPI.login(loginData);
            console.log("LOGIN RESPONSE USER:", response?.user);

            if (!APP_CONFIG.SUPPORTED_ROLES.includes(response.user?.role)) {
                setError(`Access denied. Only ${APP_CONFIG.SUPPORTED_ROLES.join(', ')} users are allowed. Your role: ${response.user?.role || 'Unknown'}`);
                authAPI.logout();
                return;
            }

            // Auto-populate locationSelection with user's assigned centres
            // Option 2: Call getUserCentreHierarchy API to get complete data
            if (response.user) {
                try {
                    const userId = response.user.id || response.user.userId;

                    // Call the getUserCentreHierarchy API endpoint
                    const hierarchyUrl = `${import.meta.env.VITE_API_BASE_URL || 'https://backend.st9.in'}/api/auth/${userId}/centre-hierarchy`;
                    const hierarchyResponse = await fetch(hierarchyUrl, {
                        headers: {
                            'Authorization': `Bearer ${response.token || localStorage.getItem('authToken')}`
                        }
                    });

                    if (hierarchyResponse.ok) {
                        const hierarchyData = await hierarchyResponse.json();

                        // 🔍 DEBUG LOG - See exact API response
                        console.log('🔍 getUserCentreHierarchy API Response:', {
                            fullResponse: hierarchyData,
                            centresArray: hierarchyData.centres,
                            firstCentre: hierarchyData.centres?.[0]
                        });

                        const centres = hierarchyData.centres || [];

                        // Extract unique IDs from hierarchy
                        const regionIds = [...new Set(
                            centres
                                .map(c => c.region?.id)
                                .filter(Boolean)
                        )];

                        const branchIds = [...new Set(
                            centres
                                .map(c => c.branch?.id)
                                .filter(Boolean)
                        )];

                        const centreIds = centres
                            .map(c => c.id)
                            .filter(Boolean);

                        // Store in locationSelection
                        localStorage.setItem('locationSelection', JSON.stringify({
                            regionIds,
                            branchIds,
                            centreIds
                        }));

                        console.log('✅ Stored in locationSelection:', {
                            regionIds: regionIds.length,
                            branchIds: branchIds.length,
                            centreIds: centreIds.length
                        });

                        // CRITICAL: Also update user object with location IDs
                        // This prevents AddExpense from clearing the data
                        const storedUser = localStorage.getItem('user');
                        if (storedUser) {
                            try {
                                const userObj = JSON.parse(storedUser);
                                userObj.regionIds = regionIds;
                                userObj.branchIds = branchIds;
                                userObj.centreIds = centreIds;
                                localStorage.setItem('user', JSON.stringify(userObj));
                                console.log('✅ Updated user object with location IDs');
                            } catch (e) {
                                console.error('Failed to update user object:', e);
                            }
                        }
                    } else {
                        console.warn('⚠️ getUserCentreHierarchy API failed:', hierarchyResponse.status);
                    }
                } catch (apiError) {
                    console.error('❌ Error calling getUserCentreHierarchy:', apiError);
                }
            }

            // 🔍 VERIFY: Check if locationSelection is still set before navigation
            const verifySelection = localStorage.getItem('locationSelection');
            console.log('🔍 BEFORE NAVIGATION - locationSelection:', verifySelection);

            // Parse the stored data to pass through navigation state
            let locationData = { regionIds: [], branchIds: [], centreIds: [] };
            try {
                if (verifySelection) {
                    locationData = JSON.parse(verifySelection);
                }
            } catch (e) {
                console.error('Failed to parse locationSelection:', e);
            }

            // Navigate with location data in state
            navigate('/expenses', {
                state: {
                    locationSelection: locationData,
                    fromLogin: true
                }
            });
        } catch (err) {
            setError(err.message || 'Login failed. Please check your credentials and try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-tr from-white via-gray-100 to-slate-100 flex items-center justify-center px-4">
            <div className="w-full max-w-md bg-white  rounded-3xl p-8 border border-gray-200">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-r from-orange-400 to-amber-400 rounded-2xl flex items-center justify-center mx-auto mb-4 ">
                        <FiUser className="text-2xl text-white" />
                    </div>
                    <h1 className="text-2xl font-bold flex justify-center items-center gap-1 text-gray-800 mb-1">Welcome To <span className="text-amber-500 text-3xl font-bold">DOS</span></h1>
                    <p className="text-sm text-gray-500">Sign in to your account</p>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-100 border border-red-300 rounded-lg p-4 mb-6">
                        <p className="text-red-600 text-sm text-center">{error}</p>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Login ID */}
                    <div>
                        <label className="text-sm font-medium text-gray-700">Login ID</label>
                        <div className="relative mt-2">
                            <FiHash className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                name="loginId"
                                value={formData.loginId}
                                onChange={handleInputChange}
                                placeholder="Enter your login ID"
                                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
                            />
                        </div>
                    </div>

                    {/* PIN */}
                    <div>
                        <label className="text-sm font-medium text-gray-700">PIN</label>
                        <div className="relative mt-2">
                            <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                name="pin"
                                value={formData.pin}
                                onChange={handleInputChange}
                                placeholder="Enter your PIN"
                                maxLength="6"
                                pattern="[0-9]*"
                                inputMode="numeric"
                                className="w-full pl-12 pr-12 py-3 bg-white border border-gray-300 rounded-xl text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showPassword ? <FiEyeOff /> : <FiEye />}
                            </button>
                        </div>
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3 bg-gradient-to-r from-orange-400 to-amber-400 text-white font-semibold rounded-xl hover:from-orange-500 hover:to-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all duration-200 disabled:opacity-50"
                    >
                        {isLoading ? (
                            <div className="flex items-center justify-center">
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                Signing in...
                            </div>
                        ) : (
                            'Sign In'
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;
