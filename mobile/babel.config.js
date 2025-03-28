module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Add polyfill plugins as needed
      ['module-resolver', {
        alias: {
          '@components': './src/components',
          '@screens': './src/screens',
          '@context': './src/context',
          '@navigation': './src/navigation',
          '@assets': './src/assets',
          '@hooks': './src/hooks',
          '@api': './src/api',
          '@utils': './src/utils',
          '@polyfills': './src/polyfills',
        },
      }],
    ],
  };
};