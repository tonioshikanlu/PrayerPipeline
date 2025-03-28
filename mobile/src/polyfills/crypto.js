// Crypto polyfill for web compatibility
import { getRandomValues } from 'crypto-browserify';

// Polyfill crypto for web
if (typeof window !== 'undefined' && !window.crypto) {
  window.crypto = {
    getRandomValues,
    // Basic implementation of randomUUID using getRandomValues
    randomUUID: () => {
      const bytes = new Uint8Array(16);
      getRandomValues(bytes);
      
      // Set version bits
      bytes[6] = (bytes[6] & 0x0f) | 0x40; // Version 4
      bytes[8] = (bytes[8] & 0x3f) | 0x80; // Variant 2
      
      // Convert to string
      const hex = Array.from(bytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      
      return [
        hex.substring(0, 8),
        hex.substring(8, 12),
        hex.substring(12, 16),
        hex.substring(16, 20),
        hex.substring(20, 32)
      ].join('-');
    }
  };
}

// Export for CommonJS compatibility
export default {
  getRandomValues,
  randomUUID: () => {
    return (window.crypto && window.crypto.randomUUID) 
      ? window.crypto.randomUUID()
      : null;
  }
};