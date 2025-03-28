// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Override the resolver to handle node modules in browser
config.resolver = {
  ...config.resolver,
  extraNodeModules: {
    // Use crypto-browserify as a polyfill for the Node.js crypto module
    crypto: require.resolve('crypto-browserify')
  }
};

module.exports = config;