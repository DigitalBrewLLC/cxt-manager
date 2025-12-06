#!/usr/bin/env node

/**
 * Automated publishing script for CxtManager packages
 * 
 * This script:
 * 1. Builds both packages
 * 2. Runs tests
 * 3. Publishes @cxtmanager/core
 * 4. Updates CLI dependency to published version
 * 5. Publishes cxtmanager-cli
 * 6. Restores workspace dependency for development
 * 
 * Usage:
 *   node scripts/publish.js [patch|minor|major]
 * 
 * Options:
 *   patch  - Bug fixes (1.0.0 → 1.0.1)
 *   minor  - New features (1.0.0 → 1.1.0)
 *   major  - Breaking changes (1.0.0 → 2.0.0)
 * 
 * Examples:
 *   node scripts/publish.js patch   # First time publishing or after bug fix
 *   node scripts/publish.js minor   # After adding a new feat
 *   node scripts/publish.js major   # After a breaking change
 * 
 * Prerequisites:
 *   - Must be logged into npm: npm login
 *   - Must have npm account with publishing rights
 *   - Run from root directory: C:\code\cxt\cli
 * 
 * The script will stop if any step fails, so you can fix issues and rerun.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const CLI_PACKAGE_JSON = path.join(__dirname, '../cli/package.json');
const CORE_PACKAGE_JSON = path.join(__dirname, '../core/package.json');

function exec(command, options = {}) {
  console.log(`\n📦 ${command}`);
  try {
    execSync(command, { stdio: 'inherit', ...options });
  } catch (error) {
    console.error(`\n❌ Failed: ${command}`);
    process.exit(1);
  }
}

function getVersion(packageJsonPath) {
  const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  return pkg.version;
}

function updateCliDependency(version) {
  const cliPackage = JSON.parse(fs.readFileSync(CLI_PACKAGE_JSON, 'utf8'));
  const oldVersion = cliPackage.dependencies['@cxtmanager/core'];
  cliPackage.dependencies['@cxtmanager/core'] = version;
  fs.writeFileSync(CLI_PACKAGE_JSON, JSON.stringify(cliPackage, null, 2) + '\n');
  console.log(`✅ Updated CLI dependency: ${oldVersion} → ${version}`);
}

function restoreWorkspaceDependency() {
  const cliPackage = JSON.parse(fs.readFileSync(CLI_PACKAGE_JSON, 'utf8'));
  const oldVersion = cliPackage.dependencies['@cxtmanager/core'];
  cliPackage.dependencies['@cxtmanager/core'] = 'workspace:*';
  fs.writeFileSync(CLI_PACKAGE_JSON, JSON.stringify(cliPackage, null, 2) + '\n');
  console.log(`✅ Restored workspace dependency: ${oldVersion} → workspace:*`);
}

// Main
const versionBump = process.argv[2] || 'patch';

if (!['patch', 'minor', 'major'].includes(versionBump)) {
  console.error('❌ Invalid version bump. Use: patch, minor, or major');
  process.exit(1);
}

console.log('🚀 Starting CxtManager publishing process...\n');

// Check if logged into npm
try {
  execSync('npm whoami', { stdio: 'pipe' });
} catch (error) {
  console.error('❌ Not logged into npm. Please run: npm login');
  process.exit(1);
}

// Step 1: Build both packages
console.log('📦 Step 1: Building packages...');
exec('pnpm --filter @cxtmanager/core build');
exec('pnpm --filter cxtmanager-cli build');

// Step 2: Run tests
console.log('\n🧪 Step 2: Running tests...');
exec('pnpm --filter @cxtmanager/core test');
exec('pnpm --filter cxtmanager-cli test');

// Step 3: Publish core
console.log('\n📤 Step 3: Publishing @cxtmanager/core...');
const coreOldVersion = getVersion(CORE_PACKAGE_JSON);
console.log(`   Current version: ${coreOldVersion}`);
console.log(`   Bumping: ${versionBump}`);

process.chdir(path.join(__dirname, '../core'));
exec(`npm version ${versionBump}`);
const coreNewVersion = getVersion(CORE_PACKAGE_JSON);
console.log(`   New version: ${coreNewVersion}`);

exec('npm publish');
console.log(`✅ Published @cxtmanager/core@${coreNewVersion}`);

// Step 4: Update CLI dependency
console.log('\n🔗 Step 4: Updating CLI dependency...');
process.chdir(path.join(__dirname, '..'));
updateCliDependency(coreNewVersion);

// Step 5: Publish CLI
console.log('\n📤 Step 5: Publishing cxtmanager-cli...');
const cliOldVersion = getVersion(CLI_PACKAGE_JSON);
console.log(`   Current version: ${cliOldVersion}`);
console.log(`   Bumping: ${versionBump}`);

process.chdir(path.join(__dirname, '../cli'));
exec(`npm version ${versionBump}`);
const cliNewVersion = getVersion(CLI_PACKAGE_JSON);
console.log(`   New version: ${cliNewVersion}`);

exec('npm publish');
console.log(`✅ Published cxtmanager-cli@${cliNewVersion}`);

// Step 6: Restore workspace dependency
console.log('\n🔄 Step 6: Restoring workspace dependency for development...');
process.chdir(path.join(__dirname, '..'));
restoreWorkspaceDependency();
exec('pnpm install'); // Reinstall to link workspace

console.log('\n🎉 Publishing complete!');
console.log(`\n📦 Published packages:`);
console.log(`   @cxtmanager/core@${coreNewVersion}`);
console.log(`   cxtmanager-cli@${cliNewVersion}`);
console.log(`\n💡 Test installation:`);
console.log(`   npm install -g cxtmanager-cli@${cliNewVersion}`);

