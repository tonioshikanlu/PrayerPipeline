// API configuration settings
export const API_BASE_URL = 'https://1be80d58-5bd9-4bb0-9e08-9cd460deef64.id.replit.dev';

/**
 * For local development with Expo on a physical device, you would need:
 * 1. The local IP address of your machine (e.g., 192.168.1.100)
 * 2. The port your server is running on
 * 
 * Example:
 * export const API_BASE_URL = 'http://192.168.1.100:3000';
 * 
 * For Expo Go development, make sure to update this to the correct URL:
 * - Mobile device on same wifi: Use local IP of the PC running the server
 * - Running in an emulator: Use 10.0.2.2:PORT for Android, localhost:PORT for iOS 
 * - Web development: Use relative paths if on same origin, or full URL if cross-origin
 * 
 * For production, use the deployed URL:
 * export const API_BASE_URL = 'https://your-app-name.replit.app';
 */