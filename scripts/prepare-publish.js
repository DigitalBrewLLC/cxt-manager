#!/usr/bin/env node

/**
 * Helper script to prepare packages for publishing
 * 
 * Usage:
 *   node scripts/prepare-publish.js core <version>  - Update CLI to use published core version
 *   node scripts/prepare-publish.js restore        - Restore workspace dependency for development
 */

const fs = require('fs');
const path = require('path');

const CLI_PACKAGE_JSON = path.join(__dirname, '../cli/package.json');
const CORE_PACKAGE_JSON = path.join(__dirname, '../core/package.json');

function updateCliDependency(version) {
  const cliPackage = JSON.parse(fs.readFileSync(CLI_PACKAGE_JSON, 'utf8'));
  
  if (!cliPackage.dependencies['@cxtmanager/core']) {
    console.error('❌ @cxtmanager/core not found in CLI dependencies');
    process.exit(1);
  }

  const oldVersion = cliPackage.dependencies['@cxtmanager/core'];
  cliPackage.dependencies['@cxtmanager/core'] = version;

  fs.writeFileSync(CLI_PACKAGE_JSON, JSON.stringify(cliPackage, null, 2) + '\n');
  
  console.log(`✅ Updated CLI dependency:`);
  console.log(`   @cxtmanager/core: ${oldVersion} → ${version}`);
}

function restoreWorkspaceDependency() {
  const cliPackage = JSON.parse(fs.readFileSync(CLI_PACKAGE_JSON, 'utf8'));
  
  if (!cliPackage.dependencies['@cxtmanager/core']) {
    console.error('❌ @cxtmanager/core not found in CLI dependencies');
    process.exit(1);
  }

  const oldVersion = cliPackage.dependencies['@cxtmanager/core'];
  cliPackage.dependencies['@cxtmanager/core'] = 'workspace:*';

  fs.writeFileSync(CLI_PACKAGE_JSON, JSON.stringify(cliPackage, null, 2) + '\n');
  
  console.log(`✅ Restored workspace dependency:`);
  console.log(`   @cxtmanager/core: ${oldVersion} → workspace:*`);
}

function getCoreVersion() {
  const corePackage = JSON.parse(fs.readFileSync(CORE_PACKAGE_JSON, 'utf8'));
  return corePackage.version;
}

// Main
const command = process.argv[2];

if (command === 'restore') {
  restoreWorkspaceDependency();
} else if (command === 'core') {
  const version = process.argv[3];
  if (!version) {
    console.error('❌ Please provide a version number');
    console.log('Usage: node scripts/prepare-publish.js core <version>');
    process.exit(1);
  }
  updateCliDependency(version);
} else if (command === 'auto') {
  // Auto-detect core version and update CLI
  const version = getCoreVersion();
  console.log(`📦 Detected @cxtmanager/core version: ${version}`);
  updateCliDependency(version);
} else {
  console.log('Usage:');
  console.log('  node scripts/prepare-publish.js core <version>  - Update CLI to use published core version');
  console.log('  node scripts/prepare-publish.js auto            - Auto-detect core version and update CLI');
  console.log('  node scripts/prepare-publish.js restore          - Restore workspace dependency for development');
  process.exit(1);
}

