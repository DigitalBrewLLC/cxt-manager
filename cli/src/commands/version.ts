import { Command } from 'commander';
import chalk from 'chalk';
import { readFileSync } from 'fs';
import { join } from 'path';
import { existsSync } from 'fs';
import * as https from 'https';

const packageJson = JSON.parse(
  readFileSync(join(__dirname, '../../package.json'), 'utf8')
);

const currentVersion = packageJson.version;

/**
 * Detect which package manager was used for installation
 */
function detectPackageManager(): 'pnpm' | 'npm' | 'yarn' {
  try {
    // Check global installation location
    const globalNodeModules = require.resolve('@cxtmanager/cli/package.json');
    const globalRoot = globalNodeModules.replace(/node_modules.*$/, '');
    
    // Check for lock files near the installation
    if (existsSync(join(globalRoot, 'pnpm-lock.yaml'))) {
      return 'pnpm';
    }
    if (existsSync(join(globalRoot, 'yarn.lock'))) {
      return 'yarn';
    }
    if (existsSync(join(globalRoot, 'package-lock.json'))) {
      return 'npm';
    }
    
    // Check if we're in a project directory with lock files
    const cwd = process.cwd();
    if (existsSync(join(cwd, 'pnpm-lock.yaml'))) {
      return 'pnpm';
    }
    if (existsSync(join(cwd, 'yarn.lock'))) {
      return 'yarn';
    }
    if (existsSync(join(cwd, 'package-lock.json'))) {
      return 'npm';
    }
    
    // Check for package manager indicators in global paths
    const homeDir = process.env.HOME || process.env.USERPROFILE || '';
    if (homeDir) {
      // Check for pnpm store
      if (existsSync(join(homeDir, '.pnpm-store')) || existsSync(join(homeDir, '.local', 'share', 'pnpm'))) {
        return 'pnpm';
      }
      // Check for yarn global
      if (existsSync(join(homeDir, '.yarn', 'global'))) {
        return 'yarn';
      }
    }
    
    // Check which package manager executables are available
    // (This is a heuristic - if pnpm is available, it's likely the preferred manager)
    try {
      require('child_process').execSync('pnpm --version', { stdio: 'ignore' });
      return 'pnpm';
    } catch {
      // pnpm not available
    }
    
    // Default to npm as it's most common and always available with Node.js
    return 'npm';
  } catch {
    // Fallback to npm on any error
    return 'npm';
  }
}

/**
 * Get latest version from npm registry
 */
async function getLatestVersion(): Promise<string | null> {
  return new Promise((resolve) => {
    const options = {
      hostname: 'registry.npmjs.org',
      path: '/@cxtmanager/cli',
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const packageInfo = JSON.parse(data);
          const latestVersion = packageInfo['dist-tags']?.latest || null;
          resolve(latestVersion);
        } catch {
          resolve(null);
        }
      });
    });

    req.on('error', () => {
      resolve(null);
    });

    req.setTimeout(5000, () => {
      req.destroy();
      resolve(null);
    });

    req.end();
  });
}

/**
 * Compare version strings
 * Returns: 1 if v1 > v2, -1 if v1 < v2, 0 if equal
 */
function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const part1 = parts1[i] || 0;
    const part2 = parts2[i] || 0;
    
    if (part1 > part2) return 1;
    if (part1 < part2) return -1;
  }
  
  return 0;
}

/**
 * Get update command based on package manager
 */
function getUpdateCommand(packageManager: string): string {
  switch (packageManager) {
    case 'pnpm':
      return 'pnpm install -g @cxtmanager/cli@latest';
    case 'yarn':
      return 'yarn global add @cxtmanager/cli@latest';
    case 'npm':
    default:
      return 'npm install -g @cxtmanager/cli@latest';
  }
}

export const versionCommand = new Command('version')
  .description('Show version information')
  .action(async () => {
    try {
      console.log(chalk.bold(`CxtManager CLI v${currentVersion}`));
      
      // Try to get latest version (with timeout)
      const latestVersion = await getLatestVersion();
      
      if (latestVersion) {
        const comparison = compareVersions(currentVersion, latestVersion);
        
        if (comparison < 0) {
          // Current version is outdated
          console.log('');
          console.log(chalk.yellow(`⚠️  You're on version ${currentVersion}, latest is ${latestVersion}`));
          const packageManager = detectPackageManager();
          const updateCommand = getUpdateCommand(packageManager);
          console.log(chalk.cyan(`   Update with: ${updateCommand}`));
          process.exit(1);
        } else if (comparison > 0) {
          // Current version is newer (development/pre-release)
          console.log(chalk.green(`✅ You're on version ${currentVersion} (latest: ${latestVersion})`));
          process.exit(0);
        } else {
          // On latest version
          console.log(chalk.green(`✅ You're on the latest version`));
          process.exit(0);
        }
      } else {
        // Couldn't fetch latest version (network issue, etc.)
        console.log(chalk.gray(`   (Unable to check for updates)`));
        process.exit(0);
      }
    } catch (error: any) {
      // On any error, just show current version and exit successfully
      console.log(chalk.gray(`   (Unable to check for updates: ${error.message})`));
      process.exit(0);
    }
  });

