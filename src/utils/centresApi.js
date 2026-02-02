import { API_URL } from './config';

export const getCentresWithDetails = async () => {
  const url = `${API_URL}/api/centres/with-details/all`;
  const token = localStorage.getItem('authToken');

  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.message || 'Failed to fetch centres');
  }

  // ✅ THIS is the actual data
  const centres = result.data;


  return centres;
};
