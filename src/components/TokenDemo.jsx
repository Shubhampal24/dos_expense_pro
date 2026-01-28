import { useState } from 'react';
import { decodeJWT, getUserFromToken, formatTokenExpiry } from '../utils/helpers';
import { authAPI } from '../utils/apiServices';
import { FiCode, FiUser, FiKey, FiClock } from 'react-icons/fi';

const TokenDemo = () => {
  const [tokenData, setTokenData] = useState(null);

  const handleDecodeToken = () => {
    const token = localStorage.getItem('authToken');
    if (token) {
      const decoded = decodeJWT(token);
      const userFromToken = getUserFromToken();
      const enhancedUser = authAPI.getEnhancedUserDetails();
      
      setTokenData({
        rawToken: token,
        decodedPayload: decoded,
        userFromToken: userFromToken,
        enhancedUser: enhancedUser,
        tokenValid: !!userFromToken,
        expiryFormatted: decoded?.exp ? formatTokenExpiry(decoded.exp) : 'N/A'
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-xl  p-6">
        <div className="flex items-center gap-3 mb-6">
          <FiCode className="text-orange-500 text-2xl" />
          <h2 className="text-2xl font-bold text-gray-800">JWT Token Decoder Demo</h2>
        </div>
        
        <button
          onClick={handleDecodeToken}
          className="mb-6 px-6 py-3 bg-gradient-to-r from-orange-400 to-amber-400 text-white rounded-lg hover:from-orange-500 hover:to-amber-500 transition-all duration-200 font-medium flex items-center gap-2"
        >
          <FiKey />
          Decode Current Token
        </button>

        {tokenData && (
          <div className="space-y-6">
            {/* Token Status */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                <FiClock className="text-gray-600" />
                Token Status
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-500">Status:</span>
                  <p className={`font-medium ${tokenData.tokenValid ? 'text-green-600' : 'text-red-600'}`}>
                    {tokenData.tokenValid ? 'Valid' : 'Invalid/Expired'}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Time Remaining:</span>
                  <p className="font-medium text-gray-800">{tokenData.expiryFormatted}</p>
                </div>
              </div>
            </div>

            {/* User Data from Token */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                <FiUser className="text-blue-600" />
                User Data from Token
              </h3>
              <pre className="text-sm bg-white p-3 rounded border overflow-x-auto">
                {JSON.stringify(tokenData.userFromToken, null, 2)}
              </pre>
            </div>

            {/* Enhanced User Details */}
            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-2">Enhanced User Details</h3>
              <pre className="text-sm bg-white p-3 rounded border overflow-x-auto">
                {JSON.stringify(tokenData.enhancedUser, null, 2)}
              </pre>
            </div>

            {/* Decoded Token Payload */}
            <div className="bg-purple-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-2">Full Token Payload</h3>
              <pre className="text-sm bg-white p-3 rounded border overflow-x-auto">
                {JSON.stringify(tokenData.decodedPayload, null, 2)}
              </pre>
            </div>

            {/* Raw Token */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-2">Raw JWT Token</h3>
              <div className="bg-gray-800 p-3 rounded overflow-x-auto">
                <code className="text-green-400 text-xs font-mono break-all">
                  {tokenData.rawToken}
                </code>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TokenDemo;
