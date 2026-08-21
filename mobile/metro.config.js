const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];
config.resolver.sourceExts = ['esm.js', ...config.resolver.sourceExts];

module.exports = config;
