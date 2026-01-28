import { FiBarChart2, FiLogOut, FiPlus, FiUser, FiSettings, FiCreditCard, FiUserPlus } from 'react-icons/fi';
import { NavLink, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { authAPI } from '../utils/apiServices';
import { hasAdminRole, ROLES, getUserFromToken } from '../utils/helpers';
import UserProfile from './UserProfile';

const Navigation = ({ currentUser, onLogout, onUserUpdate }) => {
    const navigate = useNavigate();
    const [showUserProfile, setShowUserProfile] = useState(false);
    const [user, setUser] = useState(currentUser);

    // Effect to handle user data loading and refresh scenarios
    useEffect(() => {
        if (currentUser) {
            setUser(currentUser);
        } else {
            // Fallback: try to get user from token if currentUser is not available
            const tokenUser = getUserFromToken();
            if (tokenUser) {
                setUser(tokenUser);
            }
        }
    }, [currentUser]);

    const handleLogout = async () => {
        // Add confirmation dialog
        const confirmLogout = window.confirm('Are you sure you want to logout?');
        if (!confirmLogout) {
            return;''
        }

        try {
            // Close profile modal if open
            setShowUserProfile(false);
            
            // Call the parent logout handler if provided
            if (onLogout) {
                onLogout();
            }
            
            // Clear all authentication data
            authAPI.logout();
            
            // Force navigation to login page
            navigate('/', { replace: true });
            
            // Optional: Force page reload to clear any cached state
            setTimeout(() => {
                window.location.reload();
            }, 100);
        } catch (error) {
            // Even if there's an error, try to clear local data and navigate
            localStorage.clear();
            navigate('/', { replace: true });
            window.location.reload();
        }
    };

    const navItems = [
        {
            to: '/expenses',
            icon: FiPlus,
            label: 'Add Expense',
            activeClass: 'bg-orange-100 text-orange-700 border-orange-200',
            inactiveClass: 'text-gray-600 hover:text-orange-600 hover:bg-orange-50'
        }
    ];

    // Add bank accounts link only for ADDHEAD users (admin role)
    if (user?.role === ROLES.ADDHEAD) {
        navItems.push({
            to: '/bank-accounts',
            icon: FiCreditCard,
            label: 'Bank Accounts',
            activeClass: 'bg-green-100 text-green-700 border-green-200',
            inactiveClass: 'text-gray-600 hover:text-green-600 hover:bg-green-50'
        });
    }

    // Add Head User management link only for ADDHEAD users (admin role)
    if (user?.role === ROLES.ADDHEAD) {
        navItems.push({
            to: '/head-user-management',
            icon: FiUserPlus,
            label: 'Head Users',
            activeClass: 'bg-blue-100 text-blue-700 border-blue-200',
            inactiveClass: 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
        });
    }

    // Add admin analysis link only for ADDHEAD users (admin role)
    // Use local user state which handles refresh scenarios
    if (user?.role === ROLES.ADDHEAD) {
        navItems.push({
            to: '/admin-analysis',
            icon: FiSettings,
            label: 'Admin Analysis',
            activeClass: 'bg-purple-100 text-purple-700 border-purple-200',
            inactiveClass: 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
        });
    }

    return (
        <nav className="bg-white border-b border-gray-200 px-4 md:px-6 lg:px-8 xl:px-12">
            <div className="flex items-center justify-between h-16">
                {/* Logo/Brand */}
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-amber-500 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-sm">DE</span>
                    </div>
                    <h1 className="text-xl font-bold text-gray-800">
                        <span className="text-orange-500">Digital</span> Expenses
                    </h1>
                </div>

                {/* Navigation Links */}
                <div className="flex items-center space-x-1">
                    {navItems.map((item) => {
                        const IconComponent = item.icon;
                        return (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                className={({ isActive }) =>
                                    `flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 border ${
                                        isActive ? item.activeClass + ' border' : item.inactiveClass + ' border-transparent'
                                    }`
                                }
                            >
                                <IconComponent className="text-lg" />
                                <span className="hidden sm:block">{item.label}</span>
                            </NavLink>
                        );
                    })}
                </div>

                {/* User Info & Actions */}
                <div className="flex items-center space-x-3">
                    {/* Desktop Profile Button */}
                    {user && (
                        <button
                            onClick={() => setShowUserProfile(true)}
                            className="hidden md:flex items-center gap-3 px-3 py-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-gray-200 group"
                            title="View Profile Details"
                        >
                            <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full flex items-center justify-center group-hover:scale-105 transition-transform">
                                <FiUser className="text-white text-sm" />
                            </div>
                            <div className="text-left">
                                <p className="text-sm font-medium text-gray-800 group-hover:text-orange-600 transition-colors">{user.name}</p>
                                <p className="text-xs text-gray-500">{user.role}</p>
                            </div>
                            <FiUser className="text-gray-400 group-hover:text-orange-500 transition-colors ml-1" size={16} />
                        </button>
                    )}
                    
                    {/* Mobile Profile Button */}
                    <button
                        onClick={() => setShowUserProfile(true)}
                        className="md:hidden p-2 text-gray-500 hover:text-orange-500 hover:bg-orange-50 rounded-xl transition-all duration-200"
                        title="View Profile"
                    >
                        <FiUser className="text-xl" />
                    </button>
                    
                    <button
                        onClick={handleLogout}
                        className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all duration-200"
                        title="Logout"
                    >
                        <FiLogOut className="text-xl" />
                    </button>
                </div>
            </div>
            
            {/* User Profile Modal */}
            <UserProfile 
                isOpen={showUserProfile}
                onClose={() => {
                    setShowUserProfile(false);
                    // Refresh user data after closing profile
                    if (onUserUpdate) {
                        onUserUpdate();
                    }
                }}
                currentUser={user || currentUser}
            />
        </nav>
    );
};

export default Navigation;
