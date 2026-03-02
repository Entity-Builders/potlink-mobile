const { getPostHogExpoConfig } = require('posthog-react-native/metro');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

// getPostHogExpoConfig wraps getDefaultConfig and injects PostHog's
// debug ID into bundles — required for source map upload to work.
const config = getPostHogExpoConfig(projectRoot);

// Extend (don't replace) Expo's default watchFolders to include monorepo root
// This lets Metro hot-reload on shared package changes without breaking Expo defaults
config.watchFolders = [...(config.watchFolders ?? []), monorepoRoot];

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

module.exports = config;
