#!/usr/bin/env node
/**
 * ota-production.js
 *
 * Publishes an OTA update to the production channel AND uploads
 * PostHog source maps so error stack traces stay readable.
 *
 * Usage:
 *   yarn ota:production
 *   yarn ota:production "fix: crash on pot deletion"   ← custom message
 *
 * Requirements:
 *   - POSTHOG_CLI_PROJECT_ID  set in env or .env.local
 *   - POSTHOG_CLI_API_KEY     set in env or .env.local
 *   - posthog-cli installed:  npm install -g @posthog/cli
 *   - eas-cli installed:      npm install -g eas-cli
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// ── Config ───────────────────────────────────────────────────────────────────
const POSTHOG_HOST = 'https://us.i.posthog.com';
const DIST_DIR = path.resolve(__dirname, '../dist');

// ── Helpers ──────────────────────────────────────────────────────────────────
const run = (cmd, opts = {}) => {
  console.log(`\n▶ ${cmd}`);
  execSync(cmd, { stdio: 'inherit', ...opts });
};

const loadEnvFile = (filePath) => {
  if (!fs.existsSync(filePath)) return;
  const lines = fs.readFileSync(filePath, 'utf8').split('\n');
  for (const line of lines) {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length && !process.env[key.trim()]) {
      process.env[key.trim()] = valueParts.join('=').trim();
    }
  }
};

// ── Main ─────────────────────────────────────────────────────────────────────
const main = () => {
  const appDir = path.resolve(__dirname, '..');

  // Load .env.local for PostHog credentials if not already in environment
  loadEnvFile(path.join(appDir, '.env.local'));

  const { POSTHOG_CLI_PROJECT_ID, POSTHOG_CLI_API_KEY } = process.env;

  if (!POSTHOG_CLI_PROJECT_ID || !POSTHOG_CLI_API_KEY) {
    console.error(`
❌  Missing PostHog credentials.

Add these to .env.local (git-ignored):
  POSTHOG_CLI_PROJECT_ID=<your-project-id>
  POSTHOG_CLI_API_KEY=<your-api-key>

Or export them before running:
  POSTHOG_CLI_PROJECT_ID=xxx POSTHOG_CLI_API_KEY=yyy yarn ota:production
    `);
    process.exit(1);
  }

  // Custom commit message or auto-generated from last git commit
  const message =
    process.argv[2] ||
    execSync('git log -1 --pretty=%s', { encoding: 'utf8' }).trim();

  console.log('\n🌿 Potlink — OTA Production Deploy');
  console.log('──────────────────────────────────');
  console.log(`📝 Message : ${message}`);
  console.log(`📡 Channel : production`);
  console.log('──────────────────────────────────\n');

  // Step 1: Publish OTA
  run(
    `eas update --channel production --message "${message}" --non-interactive`,
    {
      cwd: appDir,
    },
  );

  // Step 2: Export bundle + source maps
  console.log('\n📦 Exporting bundle with source maps...');
  if (fs.existsSync(DIST_DIR)) {
    fs.rmSync(DIST_DIR, { recursive: true });
  }
  run(`npx expo export --dump-sourcemap --output-dir dist`, { cwd: appDir });

  // Step 3: Upload source maps to PostHog
  console.log('\n🗺️  Uploading source maps to PostHog...');
  run(`posthog-cli exp hermes upload --directory dist`, {
    cwd: appDir,
    env: {
      ...process.env,
      POSTHOG_CLI_HOST: POSTHOG_HOST,
      POSTHOG_CLI_PROJECT_ID,
      POSTHOG_CLI_API_KEY,
    },
  });

  console.log(`
✅  OTA deployed to production!
    Users will receive the update next time they open the app.

🔍  Verify in PostHog:
    → Errors:      https://app.posthog.com/activity/explore
    → Source maps: https://app.posthog.com/settings/project-error-tracking#error-tracking-symbol-sets
  `);
};

main();
