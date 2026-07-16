#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..');
const baselinePath = path.join(__dirname, 'dependency-check-baseline.json');

const SOURCE_DIRS = ['src', 'server', 'scripts', '__tests__', 'tests'];
const ROOT_FILES = [
  'App.tsx',
  'app.config.js',
  'eslint.config.js',
  'jest.config.js',
  'jest.setup.js',
  'metro.config.js',
];
const EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);
const IMPORT_PATTERN =
  /(?:from\s+['"]([^'"]+)['"]|import\s*\(\s*['"]([^'"]+)['"]\s*\)|require\(\s*['"]([^'"]+)['"]\s*\))/g;
const JEST_MOCK_PATTERN = /jest\.mock\(\s*['"]([^'"]+)['"]/g;
const PRESET_PATTERN = /\bpreset\s*:\s*['"]([^'"]+)['"]/g;

const SCRIPT_BIN_TO_PACKAGE = new Map([
  ['expo', 'expo'],
  ['jest', 'jest'],
  ['prettier', 'prettier'],
  ['tsc', 'typescript'],
  ['eslint', 'eslint'],
]);

const DEV_DEP_ALLOWLIST = new Set(['eslint-import-resolver-typescript', 'react-test-renderer']);
const FRAMEWORK_REQUIRED_DEPENDENCIES = new Set([
  // Required indirectly by installed framework/runtime packages.
  'expo-font',
  'react-native-screens',
  'react-native-worklets',
]);

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'));

const toPosix = (value) => value.split(path.sep).join('/');

const isBarePackageSpecifier = (specifier) =>
  !specifier.startsWith('.') && !specifier.startsWith('/') && !specifier.startsWith('@/');

const toPackageRoot = (specifier) => {
  if (!isBarePackageSpecifier(specifier)) {
    return null;
  }

  if (specifier.startsWith('@')) {
    const segments = specifier.split('/');
    if (segments.length < 2) {
      return specifier;
    }
    return `${segments[0]}/${segments[1]}`;
  }

  return specifier.split('/')[0];
};

const walkFiles = (directoryPath, files) => {
  if (!fs.existsSync(directoryPath)) {
    return;
  }

  const entries = fs.readdirSync(directoryPath, { withFileTypes: true });

  for (const entry of entries) {
    const absolutePath = path.join(directoryPath, entry.name);
    if (entry.isDirectory()) {
      walkFiles(absolutePath, files);
      continue;
    }

    if (!EXTENSIONS.has(path.extname(entry.name))) {
      continue;
    }

    files.push(absolutePath);
  }
};

const collectSourceFiles = () => {
  const files = [];

  for (const directory of SOURCE_DIRS) {
    walkFiles(path.join(repoRoot, directory), files);
  }

  for (const rootFile of ROOT_FILES) {
    const rootPath = path.join(repoRoot, rootFile);
    if (fs.existsSync(rootPath)) {
      files.push(rootPath);
    }
  }

  return files;
};

const collectUsedPackagesFromSources = () => {
  const usedPackages = new Set();
  const files = collectSourceFiles();

  for (const filePath of files) {
    const source = fs.readFileSync(filePath, 'utf8');
    const patterns = [IMPORT_PATTERN, JEST_MOCK_PATTERN, PRESET_PATTERN];

    for (const pattern of patterns) {
      pattern.lastIndex = 0;
      let match;

      while ((match = pattern.exec(source)) !== null) {
        const specifier = match[1] || match[2] || match[3];
        const packageRoot = toPackageRoot(specifier);
        if (packageRoot) {
          usedPackages.add(packageRoot);
        }
      }
    }
  }

  return usedPackages;
};

const collectUsedPackagesFromScripts = (packageJson) => {
  const usedPackages = new Set();
  const scriptValues = Object.values(packageJson.scripts || {});

  for (const script of scriptValues) {
    if (script.includes('--web')) {
      usedPackages.add('react-dom');
      usedPackages.add('react-native-web');
    }

    const tokens = script
      .split(/[\s|&;()]+/)
      .map((token) => token.trim())
      .filter(Boolean);

    for (const token of tokens) {
      const mapped = SCRIPT_BIN_TO_PACKAGE.get(token);
      if (mapped) {
        usedPackages.add(mapped);
      }
    }
  }

  return usedPackages;
};

const buildResult = () => {
  const packageJson = readJson(path.join(repoRoot, 'package.json'));
  const usedByImports = collectUsedPackagesFromSources();
  const usedByScripts = collectUsedPackagesFromScripts(packageJson);
  const usedPackages = new Set([...usedByImports, ...usedByScripts]);

  const dependencies = Object.keys(packageJson.dependencies || {});
  const devDependencies = Object.keys(packageJson.devDependencies || {});

  const unusedDependencies = dependencies
    .filter((dependency) => !FRAMEWORK_REQUIRED_DEPENDENCIES.has(dependency))
    .filter((dependency) => !usedPackages.has(dependency))
    .sort();

  const unusedDevDependencies = devDependencies
    .filter((dependency) => !dependency.startsWith('@types/'))
    .filter((dependency) => !DEV_DEP_ALLOWLIST.has(dependency))
    .filter((dependency) => !usedPackages.has(dependency))
    .sort();

  return {
    unusedDependencies,
    unusedDevDependencies,
  };
};

const updateBaseline = (result) => {
  fs.writeFileSync(baselinePath, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
  console.log(`Dependency baseline updated: ${toPosix(path.relative(repoRoot, baselinePath))}`);
};

const failWithNewFindings = (result, baseline) => {
  const newUnusedDependencies = result.unusedDependencies.filter(
    (dependency) => !(baseline.unusedDependencies || []).includes(dependency),
  );
  const newUnusedDevDependencies = result.unusedDevDependencies.filter(
    (dependency) => !(baseline.unusedDevDependencies || []).includes(dependency),
  );

  if (newUnusedDependencies.length === 0 && newUnusedDevDependencies.length === 0) {
    console.log('Dependency check passed.');
    return;
  }

  console.error('Dependency check failed: new unused dependencies detected.');

  if (newUnusedDependencies.length > 0) {
    console.error('\nUnused dependencies:');
    for (const dependency of newUnusedDependencies) {
      console.error(`- ${dependency}`);
    }
  }

  if (newUnusedDevDependencies.length > 0) {
    console.error('\nUnused devDependencies:');
    for (const dependency of newUnusedDevDependencies) {
      console.error(`- ${dependency}`);
    }
  }

  console.error('\nIf intentional, refresh baseline with:');
  console.error('node scripts/quality/check-dependencies.js --update-baseline');
  process.exit(1);
};

const main = () => {
  const shouldUpdateBaseline = process.argv.includes('--update-baseline');
  const result = buildResult();

  if (shouldUpdateBaseline) {
    updateBaseline(result);
    return;
  }

  if (!fs.existsSync(baselinePath)) {
    console.error('Dependency baseline file is missing.');
    console.error(`Expected: ${toPosix(path.relative(repoRoot, baselinePath))}`);
    console.error(
      'Initialize it with: node scripts/quality/check-dependencies.js --update-baseline',
    );
    process.exit(1);
  }

  const baseline = readJson(baselinePath);
  failWithNewFindings(result, baseline);
};

main();
