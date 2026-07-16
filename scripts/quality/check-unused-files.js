#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..');
const baselinePath = path.join(__dirname, 'unused-files-baseline.json');

const SOURCE_ROOTS = ['src', 'server'];
const ENTRY_FILES = ['App.tsx', 'server/ai-proxy.js'];
const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];
const PLATFORM_SUFFIXES = ['', '.ios', '.android', '.web', '.native'];

const IMPORT_PATTERN =
  /(?:from\s+['"]([^'"]+)['"]|import\s*\(\s*['"]([^'"]+)['"]\s*\)|require\(\s*['"]([^'"]+)['"]\s*\))/g;

const toPosix = (value) => value.split(path.sep).join('/');

const listSourceFiles = () => {
  const files = [];

  const walk = (directoryPath) => {
    if (!fs.existsSync(directoryPath)) {
      return;
    }

    const entries = fs.readdirSync(directoryPath, { withFileTypes: true });
    for (const entry of entries) {
      const absolutePath = path.join(directoryPath, entry.name);

      if (entry.isDirectory()) {
        walk(absolutePath);
        continue;
      }

      const extension = path.extname(entry.name);
      if (!EXTENSIONS.includes(extension)) {
        continue;
      }

      files.push(absolutePath);
    }
  };

  for (const sourceRoot of SOURCE_ROOTS) {
    walk(path.join(repoRoot, sourceRoot));
  }

  return files;
};

const tryResolveFile = (basePath) => {
  if (fs.existsSync(basePath) && fs.statSync(basePath).isFile()) {
    return path.resolve(basePath);
  }

  for (const suffix of PLATFORM_SUFFIXES) {
    for (const extension of EXTENSIONS) {
      const withExtension = `${basePath}${suffix}${extension}`;
      if (fs.existsSync(withExtension) && fs.statSync(withExtension).isFile()) {
        return path.resolve(withExtension);
      }
    }
  }

  for (const suffix of PLATFORM_SUFFIXES) {
    for (const extension of EXTENSIONS) {
      const asIndex = path.join(basePath, `index${suffix}${extension}`);
      if (fs.existsSync(asIndex) && fs.statSync(asIndex).isFile()) {
        return path.resolve(asIndex);
      }
    }
  }

  return null;
};

const resolveSpecifier = (specifier, fromFile) => {
  if (specifier.startsWith('./') || specifier.startsWith('../')) {
    return tryResolveFile(path.resolve(path.dirname(fromFile), specifier));
  }

  if (specifier.startsWith('@/src/')) {
    return tryResolveFile(path.resolve(repoRoot, specifier.replace('@/src/', 'src/')));
  }

  if (specifier.startsWith('@/')) {
    return tryResolveFile(path.resolve(repoRoot, specifier.replace('@/', '')));
  }

  return null;
};

const getPlatformVariantFiles = (filePath) => {
  const resolvedPath = path.resolve(filePath);
  const parsed = path.parse(resolvedPath);
  const stem = parsed.name.replace(/\.(ios|android|web|native)$/, '');
  const variants = [];

  for (const suffix of PLATFORM_SUFFIXES) {
    const candidate = path.join(parsed.dir, `${stem}${suffix}${parsed.ext}`);
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      variants.push(path.resolve(candidate));
    }
  }

  return variants;
};

const buildReachableSet = (allFiles) => {
  const fileSet = new Set(allFiles.map((file) => path.resolve(file)));
  const visited = new Set();
  const queue = [];
  const enqueue = (filePath) => {
    for (const variant of getPlatformVariantFiles(filePath)) {
      if (!fileSet.has(variant) || visited.has(variant)) {
        continue;
      }
      queue.push(variant);
    }
  };

  for (const entryFile of ENTRY_FILES) {
    const resolved = tryResolveFile(path.resolve(repoRoot, entryFile));
    if (resolved) {
      queue.push(resolved);
      for (const variant of getPlatformVariantFiles(resolved)) {
        if (!visited.has(variant)) {
          queue.push(variant);
        }
      }
    }
  }

  while (queue.length > 0) {
    const currentFile = queue.pop();
    if (!currentFile || visited.has(currentFile)) {
      continue;
    }

    visited.add(currentFile);
    const source = fs.readFileSync(currentFile, 'utf8');
    IMPORT_PATTERN.lastIndex = 0;

    let match;
    while ((match = IMPORT_PATTERN.exec(source)) !== null) {
      const specifier = match[1] || match[2] || match[3];
      const resolved = resolveSpecifier(specifier, currentFile);
      if (!resolved || !fileSet.has(resolved) || visited.has(resolved)) {
        continue;
      }

      enqueue(resolved);
    }
  }

  return visited;
};

const buildResult = () => {
  const allFiles = listSourceFiles();
  const reachableFiles = buildReachableSet(allFiles);
  const allResolved = allFiles.map((file) => path.resolve(file));

  return allResolved
    .filter((file) => !reachableFiles.has(file))
    .map((file) => toPosix(path.relative(repoRoot, file)))
    .sort();
};

const updateBaseline = (unusedFiles) => {
  const baseline = { unusedFiles };
  fs.writeFileSync(baselinePath, `${JSON.stringify(baseline, null, 2)}\n`, 'utf8');
  console.log(`Unused-file baseline updated: ${toPosix(path.relative(repoRoot, baselinePath))}`);
};

const main = () => {
  const shouldUpdateBaseline = process.argv.includes('--update-baseline');
  const unusedFiles = buildResult();

  if (shouldUpdateBaseline) {
    updateBaseline(unusedFiles);
    return;
  }

  if (!fs.existsSync(baselinePath)) {
    console.error('Unused-file baseline file is missing.');
    console.error(`Expected: ${toPosix(path.relative(repoRoot, baselinePath))}`);
    console.error(
      'Initialize it with: node scripts/quality/check-unused-files.js --update-baseline',
    );
    process.exit(1);
  }

  const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
  const baselineList = baseline.unusedFiles || [];
  const newUnusedFiles = unusedFiles.filter((file) => !baselineList.includes(file));

  if (newUnusedFiles.length === 0) {
    console.log('Unused file check passed.');
    return;
  }

  console.error('Unused file check failed: new unreachable source files detected.');
  for (const file of newUnusedFiles) {
    console.error(`- ${file}`);
  }
  console.error('\nIf intentional, refresh baseline with:');
  console.error('node scripts/quality/check-unused-files.js --update-baseline');
  process.exit(1);
};

main();
