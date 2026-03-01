#!/usr/bin/env node
/**
 * release.js
 *
 * Bumps version, commits, creates and pushes release/vX.X.X branch.
 * CI triggers production build + TestFlight submit automatically.
 *
 * Usage:
 *   yarn release 1.2.0        → release specific version
 *   yarn release patch         → bump patch (1.0.0 → 1.0.1)
 *   yarn release minor         → bump minor (1.0.0 → 1.1.0)
 *   yarn release major         → bump major (1.0.0 → 2.0.0)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const APP_CONFIG = path.join(ROOT, 'app.config.js');
const PACKAGE_JSON = path.join(ROOT, 'package.json');

// ─── Helpers ──────────────────────────────────────────────────────────────────

function run(cmd, opts = {}) {
  return execSync(cmd, { cwd: ROOT, stdio: 'inherit', ...opts });
}

function getCurrentVersion() {
  const pkg = JSON.parse(fs.readFileSync(PACKAGE_JSON, 'utf-8'));
  return pkg.version;
}

function bumpVersion(current, type) {
  const [major, minor, patch] = current.split('.').map(Number);
  if (type === 'major') return `${major + 1}.0.0`;
  if (type === 'minor') return `${major}.${minor + 1}.0`;
  if (type === 'patch') return `${major}.${minor}.${patch + 1}`;
  // Explicit version provided
  if (/^\d+\.\d+\.\d+$/.test(type)) return type;
  throw new Error(
    `Invalid version or bump type: "${type}". Use major/minor/patch or X.X.X`,
  );
}

function updatePackageJson(version) {
  const pkg = JSON.parse(fs.readFileSync(PACKAGE_JSON, 'utf-8'));
  pkg.version = version;
  fs.writeFileSync(PACKAGE_JSON, JSON.stringify(pkg, null, 2) + '\n');
}

function updateAppConfig(version) {
  let content = fs.readFileSync(APP_CONFIG, 'utf-8');
  // Replace: version: 'X.X.X'
  content = content.replace(/(version:\s*['"])[^'"]+(['"])/, `$1${version}$2`);
  fs.writeFileSync(APP_CONFIG, content);
}

function ensureCleanBranch() {
  try {
    const status = execSync('git status --porcelain', { cwd: ROOT })
      .toString()
      .trim();
    if (status) {
      console.error(
        '❌ Working directory is not clean. Commit or stash changes first.',
      );
      process.exit(1);
    }
  } catch (e) {
    console.error('❌ Failed to check git status.');
    process.exit(1);
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const arg = process.argv[2] || 'patch';
const currentVersion = getCurrentVersion();
const newVersion = bumpVersion(currentVersion, arg);
const branch = `release/v${newVersion}`;

console.log(`\n🚀 Potlink Release`);
console.log(`   ${currentVersion} → ${newVersion}`);
console.log(`   Branch: ${branch}\n`);

ensureCleanBranch();

// 1. Update versions
console.log('📝 Bumping version...');
updatePackageJson(newVersion);
updateAppConfig(newVersion);
console.log(`   ✅ app.config.js → version: '${newVersion}'`);
console.log(`   ✅ package.json  → version: '${newVersion}'\n`);

// 2. Commit
console.log('💾 Committing...');
run('git add app.config.js package.json');
run(`git commit -m "chore(mobile): bump potlink version to v${newVersion}"`);
console.log('   ✅ Committed\n');

// 3. Create and push release branch
console.log(`🌿 Creating branch ${branch}...`);
run(`git checkout -b ${branch}`);
run(`git push origin ${branch}`);
console.log(`   ✅ Pushed\n`);

// 4. Return to main
run('git checkout main');

console.log(
  `✅ Done! CI will now build production → TestFlight for v${newVersion}`,
);
console.log(
  `   Monitor: https://github.com/juanobrach/entity-builders/actions\n`,
);
