import { execFileSync, execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import { createWriteStream } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = __dirname;
const DIST_PORTABLE = path.resolve(ROOT, 'dist-portable');

const NODE_VERSION = 'v24.15.0';

const ALL_PLATFORMS = [
  { name: 'win-x64', url: `https://nodejs.org/dist/${NODE_VERSION}/node-${NODE_VERSION}-win-x64.zip`, ext: '.zip', dir: `node-${NODE_VERSION}-win-x64` },
  { name: 'macos-x64', url: `https://nodejs.org/dist/${NODE_VERSION}/node-${NODE_VERSION}-darwin-x64.tar.gz`, ext: '.tar.gz', dir: `node-${NODE_VERSION}-darwin-x64` },
  { name: 'macos-arm64', url: `https://nodejs.org/dist/${NODE_VERSION}/node-${NODE_VERSION}-darwin-arm64.tar.gz`, ext: '.tar.gz', dir: `node-${NODE_VERSION}-darwin-arm64` },
  { name: 'linux-x64', url: `https://nodejs.org/dist/${NODE_VERSION}/node-${NODE_VERSION}-linux-x64.tar.xz`, ext: '.tar.xz', dir: `node-${NODE_VERSION}-linux-x64` },
];

function getTargetPlatforms() {
  const args = process.argv.slice(2);
  const platformArg = args.find((arg) => arg === '--platform' || arg.startsWith('--platform='));
  const platformValue = platformArg === '--platform'
    ? args[args.indexOf(platformArg) + 1]
    : platformArg?.split('=')[1];

  if (!platformValue || platformValue === 'all') {
    return ALL_PLATFORMS;
  }

  const names = platformValue.split(',').map((name) => name.trim()).filter(Boolean);
  const platforms = ALL_PLATFORMS.filter((platform) => names.includes(platform.name));
  const missing = names.filter((name) => !ALL_PLATFORMS.some((platform) => platform.name === name));

  if (missing.length > 0) {
    throw new Error(`Unknown platform(s): ${missing.join(', ')}. Supported: ${ALL_PLATFORMS.map((platform) => platform.name).join(', ')}`);
  }

  return platforms;
}

function run(cmd) {
  console.log(`> ${cmd}`);
  execSync(cmd, { stdio: 'inherit', cwd: ROOT });
}

function powerShellLiteral(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

function extractArchive(archivePath, extractDir, ext) {
  if (ext === '.zip') {
    if (process.platform === 'win32') {
      const command = [
        'Expand-Archive',
        '-LiteralPath',
        powerShellLiteral(archivePath),
        '-DestinationPath',
        powerShellLiteral(extractDir),
        '-Force',
      ].join(' ');

      execFileSync(
        'powershell',
        [
          '-NoProfile',
          '-ExecutionPolicy',
          'Bypass',
          '-Command',
          command,
        ],
        { stdio: 'inherit' },
      );
    } else {
      execFileSync('unzip', ['-o', '-q', archivePath, '-d', extractDir], { stdio: 'inherit' });
    }
    return;
  }

  if (ext === '.tar.gz') {
    execFileSync('tar', ['-xzf', archivePath, '-C', extractDir], { stdio: 'inherit' });
    return;
  }

  if (ext === '.tar.xz') {
    execFileSync('tar', ['-xJf', archivePath, '-C', extractDir], { stdio: 'inherit' });
    return;
  }

  throw new Error(`Unsupported archive type: ${ext}`);
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(dest)) {
      console.log(`  Already downloaded: ${path.basename(dest)}`);
      resolve();
      return;
    }
    console.log(`  Downloading: ${url}`);
    const file = createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        downloadFile(response.headers.location, dest).then(resolve).catch(reject);
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlinkSync(dest);
      reject(err);
    });
  });
}

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function copyInitialDataIfMissing() {
  const sourceDb = path.resolve(ROOT, 'data', 'cost_dashboard.db');
  const portableDb = path.resolve(DIST_PORTABLE, 'data', 'cost_dashboard.db');

  if (fs.existsSync(portableDb)) {
    console.log('  Existing portable database found, preserving:', portableDb);
    return;
  }

  if (fs.existsSync(sourceDb)) {
    fs.copyFileSync(sourceDb, portableDb);
    console.log('  Copied existing database to portable data:', portableDb);
  } else {
    console.warn('  WARNING: source database not found, portable app will initialize empty seed data on first start.');
  }
}

function buildWindowsLauncher() {
  const launcherScript = path.resolve(ROOT, 'launcher', 'build-windows-launcher.ps1');
  const toolsDir = path.resolve(DIST_PORTABLE, 'tools', 'launcher');

  fs.mkdirSync(toolsDir, { recursive: true });
  copyRecursive(path.resolve(ROOT, 'launcher'), toolsDir);

  if (process.platform !== 'win32') {
    console.warn('  Skipping launcher exe build: Windows is required to compile Cost-Dashboard.exe.');
    console.warn('  On Windows, run: npm run build:launcher:win');
    return;
  }

  if (!fs.existsSync(launcherScript)) {
    console.warn('  WARNING: launcher build script not found:', launcherScript);
    return;
  }

  run(`powershell -NoProfile -ExecutionPolicy Bypass -File "${launcherScript}" -OutputDir "${DIST_PORTABLE}"`);
}

async function downloadNodePlatforms() {
  const platforms = getTargetPlatforms();
  const nodeDir = path.resolve(DIST_PORTABLE, 'node');
  fs.mkdirSync(nodeDir, { recursive: true });

  for (const platform of platforms) {
    const platformDir = path.resolve(nodeDir, platform.name);
    const nodeBinary = path.resolve(platformDir, platform.name === 'win-x64' ? 'node.exe' : 'bin/node');

    if (fs.existsSync(nodeBinary)) {
      console.log(`  Node.js ${NODE_VERSION} for ${platform.name} already exists, skipping.`);
      continue;
    }

    const archiveName = `node-${NODE_VERSION}-${platform.name === 'win-x64' ? 'win-x64' : platform.name === 'macos-x64' ? 'darwin-x64' : platform.name === 'macos-arm64' ? 'darwin-arm64' : 'linux-x64'}${platform.ext}`;
    const archivePath = path.resolve(nodeDir, archiveName);

    await downloadFile(platform.url, archivePath);

    console.log(`  Extracting ${platform.name}...`);
    const extractDir = path.resolve(nodeDir, platform.name + '_extract');
    fs.mkdirSync(extractDir, { recursive: true });

    extractArchive(archivePath, extractDir, platform.ext);

    const extractedDir = path.resolve(extractDir, platform.dir);
    if (fs.existsSync(extractedDir)) {
      if (fs.existsSync(platformDir)) {
        fs.rmSync(platformDir, { recursive: true });
      }
      fs.renameSync(extractedDir, platformDir);
    }

    fs.rmSync(extractDir, { recursive: true, force: true });
    if (fs.existsSync(archivePath)) {
      fs.unlinkSync(archivePath);
    }

    console.log(`  Node.js ${platform.name} ready at: ${platformDir}`);
  }
}

async function main() {
  console.log('=== Cost Dashboard Portable Builder ===\n');

  console.log('[Step 1/9] Building frontend...');
  run('npm run build:frontend');

  console.log('\n[Step 2/9] Building server bundle...');
  run('node build-server.js');

  console.log('\n[Step 3/9] Creating directory structure...');
  fs.mkdirSync(path.resolve(DIST_PORTABLE, 'app'), { recursive: true });
  fs.mkdirSync(path.resolve(DIST_PORTABLE, 'data'), { recursive: true });
  fs.mkdirSync(path.resolve(DIST_PORTABLE, 'uploads'), { recursive: true });
  fs.mkdirSync(path.resolve(DIST_PORTABLE, 'logs'), { recursive: true });
  fs.mkdirSync(path.resolve(DIST_PORTABLE, 'node'), { recursive: true });
  copyInitialDataIfMissing();

  console.log('\n[Step 4/9] Copying frontend dist...');
  const frontendDest = path.resolve(DIST_PORTABLE, 'app/dist-frontend');
  if (fs.existsSync(frontendDest)) fs.rmSync(frontendDest, { recursive: true });
  copyRecursive(path.resolve(ROOT, 'dist'), frontendDest);

  console.log('\n[Step 5/9] Copying sql-wasm.wasm...');
  const wasmSrc = path.resolve(ROOT, 'node_modules/sql.js/dist/sql-wasm.wasm');
  const wasmDest = path.resolve(DIST_PORTABLE, 'app/sql-wasm.wasm');
  if (fs.existsSync(wasmSrc)) {
    fs.copyFileSync(wasmSrc, wasmDest);
  } else {
    console.warn('  WARNING: sql-wasm.wasm not found at', wasmSrc);
  }

  console.log('\n[Step 6/9] Copying db-init.js...');
  const dbInitSrc = path.resolve(ROOT, 'server/db/init.js');
  const dbInitDest = path.resolve(DIST_PORTABLE, 'app/db-init.js');
  if (fs.existsSync(dbInitSrc)) {
    fs.copyFileSync(dbInitSrc, dbInitDest);
  } else {
    console.warn('  WARNING: server/db/init.js not found');
  }

  console.log('\n[Step 7/9] Downloading Node.js for all platforms...');
  await downloadNodePlatforms();

  console.log('\n[Step 8/9] Copying scripts...');
  const scriptsDest = path.resolve(DIST_PORTABLE);
  const scriptsSrc = path.resolve(ROOT, 'scripts');
  if (fs.existsSync(scriptsSrc)) {
    copyRecursive(scriptsSrc, scriptsDest);
  } else {
    console.warn('  WARNING: scripts/ directory not found');
  }

  console.log('\n[Step 8.5/9] Creating package.json for ES module support...');
  const packageJsonPath = path.resolve(DIST_PORTABLE, 'package.json');
  const packageJsonContent = JSON.stringify({ type: 'module' }, null, 2);
  
  if (fs.existsSync(packageJsonPath)) {
    const existingContent = fs.readFileSync(packageJsonPath, 'utf8');
    if (existingContent === packageJsonContent) {
      console.log('  package.json already exists and is up to date, skipping.');
    } else {
      fs.writeFileSync(packageJsonPath, packageJsonContent);
      console.log('  package.json updated.');
    }
  } else {
    fs.writeFileSync(packageJsonPath, packageJsonContent);
    console.log('  package.json created.');
  }

  console.log('\n[Step 9/9] Building Windows launcher...');
  buildWindowsLauncher();

  console.log('\n=== Build Complete! ===');
  console.log(`Output directory: ${DIST_PORTABLE}`);
  console.log('\nDirectory structure:');
  console.log('  dist-portable/');
  console.log('    Cost-Dashboard.exe - Windows launcher (when built on Windows)');
  console.log('    package.json       - ES module support configuration');
  console.log('    app/              - Application files');
  console.log('      server.bundle.js');
  console.log('      dist-frontend/  - Frontend static files');
  console.log('      sql-wasm.wasm');
  console.log('      db-init.js');
  console.log('    data/             - Database storage');
  console.log('    uploads/          - Uploaded files');
  console.log('    logs/             - Runtime logs');
  console.log('    node/             - Node.js runtimes');
  console.log('      win-x64/');
  console.log('      macos-x64/');
  console.log('      macos-arm64/');
  console.log('      linux-x64/');
  console.log('    start.bat         - Windows startup');
  console.log('    start.sh          - macOS/Linux startup');
  console.log('    stop.bat          - Windows stop');
  console.log('    stop.sh           - macOS/Linux stop');
  console.log('    README.txt        - User documentation');
  console.log('    tools/launcher/   - Launcher source and build script');
}

main().catch((err) => {
  console.error('Build failed:', err);
  process.exit(1);
});
