// Mock implementation of crypto functions for React Native
// This uses crypto-browserify which is a polyfill for the Node.js crypto module

import { scrypt as scryptCallback, randomBytes, timingSafeEqual } from 'crypto-browserify';
import { promisify } from 'util';

const scrypt = promisify(scryptCallback);

/**
 * Hash a password with scrypt
 * @param password The password to hash
 * @returns A string in the format `hash.salt` where hash is the hex-encoded hash and salt is the hex-encoded salt
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = await scrypt(password, salt, 64) as Buffer;
  return `${derivedKey.toString('hex')}.${salt}`;
}

/**
 * Compare a password with a stored hash
 * @param supplied The supplied password to check
 * @param stored The stored hash in the format produced by hashPassword
 * @returns Whether the password matches
 */
export async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  try {
    const [hashed, salt] = stored.split('.');
    const hashedBuf = Buffer.from(hashed, 'hex');
    const suppliedBuf = await scrypt(supplied, salt, 64) as Buffer;
    return timingSafeEqual(hashedBuf, suppliedBuf);
  } catch (error) {
    console.error('Error comparing passwords:', error);
    return false;
  }
}

/**
 * Generate a random token (e.g., for reset passwords)
 * @param length The length of the token in bytes (output will be twice this in hex)
 * @returns A hex-encoded random string
 */
export function generateToken(length: number = 32): string {
  return randomBytes(length).toString('hex');
}