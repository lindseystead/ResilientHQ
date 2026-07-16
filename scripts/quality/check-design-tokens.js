#!/usr/bin/env node

/**
 * Design token guardrails:
 * 1) Hard-fail on raw color literals outside approved token files.
 * 2) Report high-density numeric style literals for progressive cleanup.
 */

const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..');
const sourceRoot = path.join(repoRoot, 'src');
const rootFiles = [path.join(repoRoot, 'App.tsx')];
const supportedExtensions = new Set(['.ts', '.tsx', '.js', '.jsx']);

const colorLiteralPattern = /#[0-9A-Fa-f]{3,8}\b|rgba?\s*\(/;
const numericStylePattern = /\b(fontSize|padding|margin|gap|borderRadius)\s*:\s*[0-9]+/g;

const colorViolationAllowlist = new Set([
  'src/config/theme.ts',
  'src/config/constants.ts',
  'src/shared/ui/theme/color.ts',
]);

const colorViolations = [];
const numericLiteralCounts = new Map();

const toPosixPath = (value) => value.split(path.sep).join('/');

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
  const source = fs.readFileSync(filePath, 'utf8');
  const lines = source.split(/\r?\n/);

  if (!colorViolationAllowlist.has(relativePath)) {
    lines.forEach((line, index) => {
      if (colorLiteralPattern.test(line)) {
        colorViolations.push({
          file: relativePath,
          line: index + 1,
          snippet: line.trim().slice(0, 140),
        });
      }
    });
  }

  const numericMatches = source.match(numericStylePattern);
  if (numericMatches && numericMatches.length > 0) {
    numericLiteralCounts.set(relativePath, numericMatches.length);
  }
};

if (!fs.existsSync(sourceRoot)) {
  console.error('Design token check failed: src/ directory was not found.');
  process.exit(1);
}

walk(sourceRoot);
rootFiles.forEach((filePath) => {
  if (fs.existsSync(filePath)) {
    inspectFile(filePath);
  }
});

if (colorViolations.length > 0) {
  console.error('Design token violations detected: raw color literals are not allowed.\n');

  colorViolations.slice(0, 80).forEach((violation) => {
    console.error(
      `- ${violation.file}:${violation.line} contains a raw color literal -> ${violation.snippet}`,
    );
  });

  if (colorViolations.length > 80) {
    console.error(`\n...and ${colorViolations.length - 80} more violations.`);
  }

  console.error(
    '\nUse theme tokens and withAlpha() instead of raw hex/rgba values in feature/shared code.',
  );
  process.exit(1);
}

const numericTopFiles = [...numericLiteralCounts.entries()]
  .filter(([file]) => !file.includes('/typography/'))
  .sort((left, right) => right[1] - left[1])
  .slice(0, 20);

if (numericTopFiles.length > 0) {
  console.log(
    'Design token check passed (no raw color literals). Top files still using numeric style literals:',
  );
  numericTopFiles.forEach(([file, count]) => {
    console.log(`- ${file}: ${count}`);
  });
} else {
  console.log('Design token check passed.');
}
