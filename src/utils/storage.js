const STORAGE_KEYS = {
  PASSWORDS: 'encrypted_passwords',
  MASTER_KEY: 'encrypted_master_key'
};

export const saveToStorage = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Storage save error:', error);
    throw new Error('Failed to save data');
  }
};

export const getFromStorage = (key) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Storage retrieval error:', error);
    throw new Error('Failed to retrieve data');
  }
};

export const removeFromStorage = (key) => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Storage removal error:', error);
    throw new Error('Failed to remove data');
  }
};

export { STORAGE_KEYS }; 