#!/usr/bin/env node

/**
 * Enforces feature boundaries inside src/features.
 *
 * A feature may import:
 * - itself (src/features/<same-feature>/...)
 * - shared/domain/service/config/app code (outside src/features)
 *
 * A feature may not import another feature directly.
 *
 * Checks both:
 * - alias imports (e.g. @/src/features/...)
 * - relative imports (e.g. ../../otherFeature/...)
 * - CJS require(...) calls
 */

const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..');
const featuresRoot = path.join(repoRoot, 'src', 'features');
const supportedExtensions = new Set(['.ts', '.tsx']);
const importSpecifierPattern =
  /(?:from\s+['"]([^'"]+)['"]|import\s*\(\s*['"]([^'"]+)['"]\s*\)|require\(\s*['"]([^'"]+)['"]\s*\))/g;
const violations = [];
const DIRECT_OPENAI_SERVICE_PATH = 'src/services/api/openai';
const NAVIGATION_LAYER_PATH = 'src/navigation';

const toPosixPath = (value) => value.split(path.sep).join('/');

const extractFeatureFromSpecifier = (specifier, importingFilePath) => {
  if (specifier.startsWith('@/src/features/')) {
    const match = specifier.match(/^@\/src\/features\/([^/]+)/);
    return match ? match[1] : null;
  }

  if (!specifier.startsWith('.')) {
    return null;
  }

  const importingDirectory = path.dirname(importingFilePath);
  const resolvedBase = path.resolve(importingDirectory, specifier);
  const normalized = toPosixPath(resolvedBase);

  const directMatch = normalized.match(/\/src\/features\/([^/]+)(\/|$)/);
  return directMatch ? directMatch[1] : null;
};

const resolvesToOpenAiServicePath = (specifier, importingFilePath) => {
  if (specifier === '@/src/services/api/openai') {
    return true;
  }

  if (!specifier.startsWith('.')) {
    return false;
  }

  const importingDirectory = path.dirname(importingFilePath);
  const resolvedBase = path.resolve(importingDirectory, specifier);
  const normalized = toPosixPath(resolvedBase);
  return normalized.includes(`/${DIRECT_OPENAI_SERVICE_PATH}`);
};

const resolvesToNavigationLayerPath = (specifier, importingFilePath) => {
  if (specifier === '@/src/navigation/types' || specifier === '@/src/navigation/types.ts') {
    return false;
  }

  if (specifier === '@/src/navigation' || specifier.startsWith('@/src/navigation/')) {
    return true;
  }

  if (!specifier.startsWith('.')) {
    return false;
  }

  const importingDirectory = path.dirname(importingFilePath);
  const resolvedBase = path.resolve(importingDirectory, specifier);
  const normalized = toPosixPath(resolvedBase);
  if (
    normalized.endsWith('/src/navigation/types') ||
    normalized.endsWith('/src/navigation/types.ts')
  ) {
    return false;
  }
  return normalized.includes(`/${NAVIGATION_LAYER_PATH}`);
};

const walk = (directoryPath) => {
  const entries = fs.readdirSync(directoryPath, { withFileTypes: true });

  for (const entry of entries) {
    const absolutePath = path.join(directoryPath, entry.name);

    if (entry.isDirectory()) {
      walk(absolutePath);
      continue;
    }

    if (!supportedExtensions.has(path.extname(entry.name))) {
      continue;
    }

    inspectFile(absolutePath);
  }
};

const inspectFile = (filePath) => {
  const relativePath = toPosixPath(path.relative(repoRoot, filePath));
  const currentMatch = relativePath.match(/^src\/features\/([^/]+)\//);

  if (!currentMatch) {
    return;
  }

  const currentFeature = currentMatch[1];
  const source = fs.readFileSync(filePath, 'utf8');
  let match;
  importSpecifierPattern.lastIndex = 0;

  while ((match = importSpecifierPattern.exec(source)) !== null) {
    const specifier = match[1] || match[2] || match[3];
    if (!specifier) {
      continue;
    }

    const importedFeature = extractFeatureFromSpecifier(specifier, filePath);
    const isOpenAiServiceImport = resolvesToOpenAiServicePath(specifier, filePath);
    const isNavigationLayerImport = resolvesToNavigationLayerPath(specifier, filePath);

    if (isOpenAiServiceImport) {
      violations.push({
        kind: 'forbidden-service-import',
        file: relativePath,
        target: DIRECT_OPENAI_SERVICE_PATH,
        currentFeature,
        specifier,
        reason:
          'Feature code must use src/domains/ai entrypoints instead of importing src/services/api/openai directly.',
      });
      continue;
    }

    if (isNavigationLayerImport) {
      violations.push({
        kind: 'forbidden-navigation-import',
        file: relativePath,
        target: NAVIGATION_LAYER_PATH,
        currentFeature,
        specifier,
        reason:
          'Feature modules must not import navigation internals directly. Move shared values to src/config or src/shared.',
      });
      continue;
    }

    if (!importedFeature) {
      continue;
    }

    if (importedFeature === currentFeature) {
      continue;
    }

    violations.push({
      kind: 'cross-feature-import',
      file: relativePath,
      importedFeature,
      currentFeature,
      specifier,
      reason: 'Feature modules must not import from other features directly.',
    });
  }
};

if (!fs.existsSync(featuresRoot)) {
  console.error('Feature boundary check failed: src/features was not found.');
  process.exit(1);
}

walk(featuresRoot);

if (violations.length > 0) {
  console.error('Feature boundary violations detected:\n');

  for (const violation of violations) {
    if (violation.kind === 'forbidden-service-import') {
      console.error(
        `- ${violation.file} imports "${violation.target}" from "${violation.currentFeature}" via "${violation.specifier}"`,
      );
    } else if (violation.kind === 'forbidden-navigation-import') {
      console.error(
        `- ${violation.file} imports "${violation.target}" from "${violation.currentFeature}" via "${violation.specifier}"`,
      );
    } else {
      console.error(
        `- ${violation.file} imports feature "${violation.importedFeature}" from "${violation.currentFeature}" via "${violation.specifier}"`,
      );
    }
    if (violation.reason) {
      console.error(`  Reason: ${violation.reason}`);
    }
  }

  console.error(
    '\nUse shared/ui for reusable presentation and src/domains for cross-feature business logic.',
  );
  process.exit(1);
}

console.log('Feature boundary check passed.');
