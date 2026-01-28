import { API_URL } from './config';

export const getCentresWithDetails = async () => {
  const url = `${API_URL}/api/centres/full`;
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch centres');
  return data;
};
