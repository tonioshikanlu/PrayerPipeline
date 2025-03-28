// Mock implementation of expo-secure-store
// This uses localStorage on web as a fallback

/**
 * Save a key-value pair to secure storage
 */
export async function setItemAsync(key: string, value: string): Promise<void> {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(`secure_${key}`, value);
    } else {
      console.warn('localStorage not available, secure storage not persisted');
    }
  } catch (error) {
    console.error('Error saving to secure storage:', error);
    throw error;
  }
}

/**
 * Get a value for a key from secure storage
 */
export async function getItemAsync(key: string): Promise<string | null> {
  try {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(`secure_${key}`);
    } else {
      console.warn('localStorage not available, secure storage not available');
      return null;
    }
  } catch (error) {
    console.error('Error retrieving from secure storage:', error);
    throw error;
  }
}

/**
 * Delete a key-value pair from secure storage
 */
export async function deleteItemAsync(key: string): Promise<void> {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(`secure_${key}`);
    } else {
      console.warn('localStorage not available, secure storage not available');
    }
  } catch (error) {
    console.error('Error deleting from secure storage:', error);
    throw error;
  }
}

/**
 * Check if a key exists in secure storage
 */
export async function isAvailableAsync(): Promise<boolean> {
  return typeof localStorage !== 'undefined';
}