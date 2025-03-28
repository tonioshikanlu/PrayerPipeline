/**
 * Mock implementation of expo-secure-store for React Native
 * Used for storing authentication tokens and other sensitive data
 */

// In-memory storage to simulate secure storage
const secureStore: Record<string, string> = {};

// Mock setItemAsync implementation
export async function setItemAsync(key: string, value: string, options?: object): Promise<void> {
  secureStore[key] = value;
}

// Mock getItemAsync implementation
export async function getItemAsync(key: string, options?: object): Promise<string | null> {
  return secureStore[key] || null;
}

// Mock deleteItemAsync implementation
export async function deleteItemAsync(key: string, options?: object): Promise<void> {
  delete secureStore[key];
}

// Mock isAvailableAsync implementation
export async function isAvailableAsync(): Promise<boolean> {
  return true;
}

export default {
  setItemAsync,
  getItemAsync,
  deleteItemAsync,
  isAvailableAsync,
};