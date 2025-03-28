/**
 * Mock implementation of crypto for React Native
 * Used for password hashing and comparison functions
 */

// Buffer implementation for React Native
class Buffer {
  private data: string;

  constructor(data: string, encoding?: string) {
    this.data = data;
  }

  toString(encoding: string): string {
    return this.data;
  }

  static from(data: string, encoding?: string): Buffer {
    return new Buffer(data, encoding);
  }
}

// Mock scrypt implementation
export function scrypt(password: string, salt: string, keylen: number, callback: Function): void {
  // Simple mock implementation - in production would use a proper crypto library
  const hash = `mock_hash_${password}_${salt}_${keylen}`;
  const buffer = Buffer.from(hash);
  callback(null, buffer);
}

// Mock randomBytes implementation
export function randomBytes(size: number): { toString: (encoding: string) => string } {
  // Generate a random string of specified length
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < size * 2; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return {
    toString: (encoding: string) => result
  };
}

// Mock timingSafeEqual implementation
export function timingSafeEqual(a: Buffer, b: Buffer): boolean {
  return a.toString('hex') === b.toString('hex');
}

export default {
  scrypt,
  randomBytes,
  timingSafeEqual
};