const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Opt into Metro's Node file watcher by default so the repo does not depend on a
// Watchman install being present. Set METRO_USE_WATCHMAN=true to use Watchman locally.
config.resolver.useWatchman = process.env.METRO_USE_WATCHMAN === 'true';

module.exports = config;
